/**
 * Omise Payment Gateway Integration
 * https://www.omise.co/
 */

interface OmiseConfig {
  publicKey: string
  secretKey: string
  apiVersion?: string
}

interface CreateChargeParams {
  amount: number // Amount in satang (smallest unit of THB)
  currency: string // 'thb'
  card?: string // Card token from Omise.js
  customer?: string // Customer ID
  description?: string
  metadata?: Record<string, any>
  return_uri?: string
  source?: {
    type: string
    name?: string
    email?: string
    phone_number?: string
  }
}

interface OmiseChargeResponse {
  id: string
  status: 'pending' | 'successful' | 'failed'
  amount: number
  currency: string
  description?: string
  metadata?: Record<string, any>
  created_at: string
  paid_at?: string
  failure_code?: string
  failure_message?: string
}

export class OmiseGateway {
  private config: OmiseConfig
  private baseUrl: string

  constructor(config: OmiseConfig) {
    this.config = config
    this.baseUrl = 'https://api.omise.co'
  }

  /**
   * Create a charge
   */
  async createCharge(params: CreateChargeParams): Promise<OmiseChargeResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/charges`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(this.config.secretKey + ':').toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: params.amount,
          currency: params.currency || 'thb',
          card: params.card,
          customer: params.customer,
          description: params.description,
          metadata: params.metadata,
          return_uri: params.return_uri,
          source: params.source,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create charge')
      }

      const data = await response.json()
      return data
    } catch (error: any) {
      console.error('[Omise] Error creating charge:', error)
      throw error
    }
  }

  /**
   * Get charge details
   */
  async getCharge(chargeId: string): Promise<OmiseChargeResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/charges/${chargeId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(this.config.secretKey + ':').toString('base64')}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to get charge')
      }

      return await response.json()
    } catch (error: any) {
      console.error('[Omise] Error getting charge:', error)
      throw error
    }
  }

  /**
   * Create customer
   */
  async createCustomer(email: string, name?: string, phone?: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/customers`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(this.config.secretKey + ':').toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          description: name,
          metadata: {
            phone,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create customer')
      }

      return await response.json()
    } catch (error: any) {
      console.error('[Omise] Error creating customer:', error)
      throw error
    }
  }
}

/**
 * Get Omise config from environment
 */
export function getOmiseConfig(): OmiseConfig | null {
  const publicKey = process.env.OMISE_PUBLIC_KEY
  const secretKey = process.env.OMISE_SECRET_KEY

  if (!publicKey || !secretKey) {
    return null
  }

  return {
    publicKey,
    secretKey,
    apiVersion: process.env.OMISE_API_VERSION || '2019-05-29',
  }
}

