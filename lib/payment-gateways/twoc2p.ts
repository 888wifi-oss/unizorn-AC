/**
 * 2C2P Payment Gateway Integration
 * https://www.2c2p.com/
 */

interface TwoC2PConfig {
  merchantId: string
  secretKey: string
  environment: 'sandbox' | 'production'
}

interface CreatePaymentParams {
  amount: number
  currency: string // 'THB'
  description?: string
  customerEmail?: string
  customerPhone?: string
  paymentMethod?: string // 'CREDIT_CARD', 'PROMPTPAY', 'ALIPAY', etc.
  returnUrl?: string
  cancelUrl?: string
  metadata?: Record<string, any>
}

interface TwoC2PPaymentResponse {
  paymentToken: string
  webPaymentUrl: string
  expiresAt: string
}

export class TwoC2PGateway {
  private config: TwoC2PConfig
  private baseUrl: string

  constructor(config: TwoC2PConfig) {
    this.config = config
    this.baseUrl = config.environment === 'production'
      ? 'https://api.2c2p.com'
      : 'https://demo2.2c2p.com'
  }

  /**
   * Create payment request
   */
  async createPayment(params: CreatePaymentParams): Promise<TwoC2PPaymentResponse> {
    try {
      // 2C2P requires specific request format
      const requestData = {
        version: '10.01',
        merchantID: this.config.merchantId,
        invoiceNo: `INV-${Date.now()}`,
        description: params.description || 'Payment',
        amount: params.amount.toFixed(2),
        currencyCode: params.currency,
        paymentChannel: params.paymentMethod || 'ALL',
        frontendReturnUrl: params.returnUrl,
        userDefined1: JSON.stringify(params.metadata || {}),
      }

      // Generate signature (simplified - actual implementation requires HMAC)
      const signature = this.generateSignature(requestData)

      const response = await fetch(`${this.baseUrl}/Payment4.0/Payment.aspx`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...requestData,
          signature,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create payment')
      }

      const data = await response.json()
      return {
        paymentToken: data.paymentToken,
        webPaymentUrl: data.webPaymentUrl,
        expiresAt: data.expiresAt,
      }
    } catch (error: any) {
      console.error('[2C2P] Error creating payment:', error)
      throw error
    }
  }

  /**
   * Verify payment callback
   */
  async verifyPayment(responseData: any): Promise<boolean> {
    try {
      // Verify signature from callback
      const expectedSignature = this.generateSignature(responseData)
      return responseData.signature === expectedSignature
    } catch (error) {
      console.error('[2C2P] Error verifying payment:', error)
      return false
    }
  }

  /**
   * Generate signature (simplified - implement proper HMAC)
   */
  private generateSignature(data: any): string {
    // TODO: Implement proper HMAC-SHA256 signature
    // For now, return a placeholder
    const dataString = JSON.stringify(data) + this.config.secretKey
    return Buffer.from(dataString).toString('base64').substring(0, 40)
  }
}

/**
 * Get 2C2P config from environment
 */
export function getTwoC2PConfig(): TwoC2PConfig | null {
  const merchantId = process.env.TWOC2P_MERCHANT_ID
  const secretKey = process.env.TWOC2P_SECRET_KEY
  const environment = (process.env.TWOC2P_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production'

  if (!merchantId || !secretKey) {
    return null
  }

  return {
    merchantId,
    secretKey,
    environment,
  }
}

