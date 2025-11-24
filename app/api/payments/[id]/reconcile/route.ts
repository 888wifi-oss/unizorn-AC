import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const paymentId = params.id

  try {
    const body = await request.json()
    const admin = createAdminClient()

    const updates: Record<string, any> = {
      reconciled: body.reconciled ?? true,
      reconciliation_date: body.reconciliation_date ?? new Date().toISOString().slice(0, 10),
      reconciliation_notes: body.reconciliation_notes ?? null,
      reconciliation_assignee: body.reconciliation_assignee ?? null,
      reconciliation_status: body.reconciliation_status ?? (body.reconciled ? 'done' : 'pending'),
      reconciliation_updated_by: body.reconciliation_updated_by ?? null,
      reconciled_at: body.reconciled ? new Date().toISOString() : null,
      reconciled_by: body.reconciled_by ?? null,
    }

    if (!body.reconciled) {
      updates.reconciliation_date = null
      updates.reconciled_at = null
      updates.reconciled_by = null
    }

    const { data, error } = await admin.from('payments').update(updates).eq('id', paymentId).select('*').maybeSingle()

    if (error) {
      throw error
    }

    return NextResponse.json({ payment: data })
  } catch (error: any) {
    console.error('[Payment reconcile] error', error)
    return NextResponse.json({ error: error?.message || 'Failed to update payment reconciliation' }, { status: 500 })
  }
}

