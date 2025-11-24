import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getOmiseConfig, OmiseGateway } from "@/lib/payment-gateways/omise"
import { getTwoC2PConfig, TwoC2PGateway } from "@/lib/payment-gateways/twoc2p"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      billId,
      amount,
      gatewayType, // 'omise' or '2c2p'
      paymentMethod,
      customerEmail,
      customerPhone,
      customerName,
      returnUrl,
    } = body

    if (!billId || !amount || !gatewayType) {
      return NextResponse.json(
        { error: 'billId, amount, and gatewayType are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get payment method config
    const { data: paymentMethodConfig } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('method_type', 'payment_gateway')
      .eq('gateway_config->>type', gatewayType)
      .eq('is_active', true)
      .maybeSingle()

    if (!paymentMethodConfig || !paymentMethodConfig.gateway_config) {
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 400 }
      )
    }

    const gatewayConfig = paymentMethodConfig.gateway_config

    // Get bill info
    const { data: bill } = await supabase
      .from('bills')
      .select('*, units!inner(unit_number, owner_name)')
      .eq('id', billId)
      .single()

    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      )
    }

    let transactionId: string
    let gatewayResponse: any
    let redirectUrl: string | undefined

    if (gatewayType === 'omise') {
      const omiseConfig = getOmiseConfig()
      if (!omiseConfig) {
        return NextResponse.json(
          { error: 'Omise not configured' },
          { status: 500 }
        )
      }

      const omise = new OmiseGateway(omiseConfig)

      // Create customer if email provided
      let customerId: string | undefined
      if (customerEmail) {
        const customer = await omise.createCustomer(customerEmail, customerName, customerPhone)
        customerId = customer.id
      }

      // Create charge
      const charge = await omise.createCharge({
        amount: Math.round(amount * 100), // Convert to satang
        currency: 'thb',
        description: `Bill payment for ${bill.units?.unit_number} - ${bill.month}`,
        customer: customerId,
        metadata: {
          bill_id: billId,
          unit_number: bill.units?.unit_number,
        },
        return_uri: returnUrl,
      })

      transactionId = charge.id
      gatewayResponse = charge
    } else if (gatewayType === '2c2p') {
      const twoc2pConfig = getTwoC2PConfig()
      if (!twoc2pConfig) {
        return NextResponse.json(
          { error: '2C2P not configured' },
          { status: 500 }
        )
      }

      const twoc2p = new TwoC2PGateway(twoc2pConfig)

      const payment = await twoc2p.createPayment({
        amount,
        currency: 'THB',
        description: `Bill payment for ${bill.units?.unit_number} - ${bill.month}`,
        customerEmail,
        customerPhone,
        paymentMethod: paymentMethod || 'ALL',
        returnUrl,
        cancelUrl: returnUrl,
        metadata: {
          bill_id: billId,
          unit_number: bill.units?.unit_number,
        },
      })

      transactionId = payment.paymentToken
      gatewayResponse = payment
      redirectUrl = payment.webPaymentUrl
    } else {
      return NextResponse.json(
        { error: 'Unsupported gateway type' },
        { status: 400 }
      )
    }

    // Create payment transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        bill_id: billId,
        payment_method_id: paymentMethodConfig.id,
        amount,
        currency: 'THB',
        status: 'pending',
        transaction_type: 'payment',
        gateway_transaction_id: transactionId,
        gateway_response: gatewayResponse,
        reference_number: `PAY-${Date.now()}`,
      })
      .select()
      .single()

    if (transactionError) {
      console.error('[Payment Gateway] Error creating transaction:', transactionError)
      throw new Error(`Failed to create transaction: ${transactionError.message}`)
    }

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      gatewayTransactionId: transactionId,
      redirectUrl,
      gatewayResponse,
    })
  } catch (error: any) {
    console.error('[Payment Gateway] Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to create payment charge',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

