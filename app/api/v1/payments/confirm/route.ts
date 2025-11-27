import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  createPaymentConfirmedNotification,
  createPaymentRejectedNotification
} from "@/lib/supabase/notification-helpers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transactionId, confirmed, notes, userId } = body

    if (!transactionId) {
      return NextResponse.json(
        { error: 'transactionId is required' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get transaction with bill info
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .select(`
        *,
        bills!inner(
          id,
          unit_id,
          bill_number,
          units!inner(unit_number, project_id)
        )
      `)
      .eq('id', transactionId)
      .single()

    if (transactionError || !transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    if (confirmed) {
      // Confirm payment
      await supabase
        .from('payment_transactions')
        .update({
          status: 'completed',
          paid_at: new Date().toISOString(),
          notes: notes || 'Payment confirmed by admin',
          updated_by: userId,
        })
        .eq('id', transactionId)

      // Update bill status
      await supabase
        .from('bills')
        .update({ status: 'paid' })
        .eq('id', transaction.bill_id)

      // Create journal entries in general ledger (Double Entry Bookkeeping)
      const projectId = transaction.bills?.units?.project_id
      const paidDate = new Date().toISOString().split('T')[0]
      const description = `รับชำระค่าส่วนกลาง - ${transaction.bills?.units?.unit_number} (${transaction.bills?.bill_number})`

      // Debit: Cash/Bank (1101)
      // Credit: Revenue from Common Fees (4101)
      const journalEntries = [
        {
          transaction_date: paidDate,
          account_code: '1101', // Cash/Bank account
          debit: transaction.amount,
          credit: 0,
          description,
          reference_type: 'payment',
          reference_id: transactionId,
          project_id: projectId,
        },
        {
          transaction_date: paidDate,
          account_code: '4101', // Revenue from common fees
          debit: 0,
          credit: transaction.amount,
          description,
          reference_type: 'payment',
          reference_id: transactionId,
          project_id: projectId,
        },
      ]

      const { error: glError } = await supabase
        .from('general_ledger')
        .insert(journalEntries)

      if (glError) {
        console.error('[Confirm Payment] Error creating journal entries:', glError)
        // Don't fail the entire operation if GL insert fails
      }

      // Create payment confirmation record
      await supabase
        .from('payment_confirmations')
        .insert({
          payment_transaction_id: transactionId,
          bill_id: transaction.bill_id,
          confirmation_type: 'bank_confirmation',
          confirmed_by: userId,
          confirmation_data: {
            confirmed_at: new Date().toISOString(),
            confirmed_by: userId,
            notes,
          },
          notes,
        })

      // Create notification for resident (non-blocking)
      const unitNumber = transaction.bills?.units?.unit_number
      if (unitNumber) {
        createPaymentConfirmedNotification(
          unitNumber,
          transaction.reference_number || `PAY-${transactionId.substring(0, 8)}`,
          transaction.amount,
          transaction.bills?.bill_number
        ).catch(err => console.error('[Confirm Payment] Error creating notification:', err))
      }

      return NextResponse.json({
        success: true,
        message: 'Payment confirmed successfully',
      })
    } else {
      // Reject payment
      await supabase
        .from('payment_transactions')
        .update({
          status: 'failed',
          notes: notes || 'Payment rejected by admin',
          updated_by: userId,
        })
        .eq('id', transactionId)

      // Create notification for resident (non-blocking)
      const unitNumber = transaction.bills?.units?.unit_number
      if (unitNumber) {
        createPaymentRejectedNotification(
          unitNumber,
          transaction.reference_number || `PAY-${transactionId.substring(0, 8)}`,
          transaction.amount,
          notes
        ).catch(err => console.error('[Reject Payment] Error creating notification:', err))
      }

      return NextResponse.json({
        success: true,
        message: 'Payment rejected',
      })
    }
  } catch (error: any) {
    console.error('[Confirm Payment] Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to confirm payment',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

