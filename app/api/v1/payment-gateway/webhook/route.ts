import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { OmiseGateway, getOmiseConfig } from "@/lib/payment-gateways/omise"
import { TwoC2PGateway, getTwoC2PConfig } from "@/lib/payment-gateways/twoc2p"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const gatewayType = request.headers.get('x-gateway-type') || body.gateway_type

    if (!gatewayType) {
      return NextResponse.json(
        { error: 'Gateway type not specified' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    if (gatewayType === 'omise') {
      // Omise webhook
      const { data } = body

      if (data && data.object === 'charge') {
        const chargeId = data.id
        const status = data.status

        // Find transaction by gateway_transaction_id
        const { data: transaction } = await supabase
          .from('payment_transactions')
          .select('*, bills!inner(id, unit_id)')
          .eq('gateway_transaction_id', chargeId)
          .maybeSingle()

        if (transaction) {
          let newStatus = 'pending'
          if (status === 'successful') {
            newStatus = 'completed'
          } else if (status === 'failed') {
            newStatus = 'failed'
          }

          // Update transaction
          await supabase
            .from('payment_transactions')
            .update({
              status: newStatus,
              gateway_response: data,
              paid_at: newStatus === 'completed' ? new Date().toISOString() : null,
            })
            .eq('id', transaction.id)

          // Update bill status if payment completed
          if (newStatus === 'completed') {
            await supabase
              .from('bills')
              .update({ status: 'paid' })
              .eq('id', transaction.bill_id)
          }
        }
      }
    } else if (gatewayType === '2c2p') {
      // 2C2P webhook
      const twoc2pConfig = getTwoC2PConfig()
      if (!twoc2pConfig) {
        return NextResponse.json({ error: '2C2P not configured' }, { status: 500 })
      }

      const twoc2p = new TwoC2PGateway(twoc2pConfig)
      const isValid = await twoc2p.verifyPayment(body)

      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }

      // Process 2C2P callback
      const invoiceNo = body.invoiceNo
      const respCode = body.respCode

      // Find transaction
      const { data: transaction } = await supabase
        .from('payment_transactions')
        .select('*, bills!inner(id, unit_id)')
        .eq('gateway_transaction_id', invoiceNo)
        .maybeSingle()

      if (transaction) {
        let newStatus = 'pending'
        if (respCode === '00') {
          newStatus = 'completed'
        } else {
          newStatus = 'failed'
        }

        await supabase
          .from('payment_transactions')
          .update({
            status: newStatus,
            gateway_response: body,
            paid_at: newStatus === 'completed' ? new Date().toISOString() : null,
          })
          .eq('id', transaction.id)

        if (newStatus === 'completed') {
          await supabase
            .from('bills')
            .update({ status: 'paid' })
            .eq('id', transaction.bill_id)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Payment Gateway Webhook] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

