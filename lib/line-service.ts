import { createClient } from "@/lib/supabase/server"

const LINE_API_URL = 'https://api.line.me/v2/bot/message'
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN

interface LineMessage {
    type: string
    text?: string
    packageId?: string
    stickerId?: string
    originalContentUrl?: string
    previewImageUrl?: string
    // Add other message types as needed
}

export class LineService {
    /**
     * Send a message to a single user (Push Message)
     * @param userId The resident's user ID (Supabase Auth ID)
     * @param messages Array of LINE messages
     */
    /**
     * Send a message to a specific unit (e.g. 1001)
     */
    static async sendMessage(unitNumber: string, messages: LineMessage[]) {
        if (!CHANNEL_ACCESS_TOKEN) {
            console.warn('LINE_CHANNEL_ACCESS_TOKEN is not configured')
            return { success: false, error: 'LINE configuration missing' }
        }

        try {
            const supabase = await createClient()

            // Get the LINE User ID from the UNITS table directly
            const { data: unit, error } = await supabase
                .from('units')
                .select('line_user_id')
                .eq('unit_number', unitNumber)
                .single()

            if (error || !unit || !unit.line_user_id) {
                console.warn(`No LINE User ID found for unit ${unitNumber}`)
                return { success: false, error: 'LINE user ID not found' }
            }

            console.log(`[LineService] Sending to unit ${unitNumber} (LINE ID: ${unit.line_user_id})`)

            const response = await fetch(`${LINE_API_URL}/push`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
                },
                body: JSON.stringify({
                    to: unit.line_user_id,
                    messages: messages
                })
            })

            // ... rest of error handling same as before
            if (!response.ok) {
                const errorData = await response.json()
                console.error('LINE API Error:', errorData)
                return { success: false, error: errorData.message }
            }

            return { success: true }

        } catch (error: any) {
            console.error('LineService.sendMessage exception:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * Broadcast message to all users in a project (Multicast)
     * Note: LINE Multicast handles up to 500 users per request.
     * This implementation fetches all users with LINE IDs in the project and batches them.
     */
    static async broadcastToProject(projectId: string, messages: LineMessage[]) {
        if (!CHANNEL_ACCESS_TOKEN) {
            console.warn('LINE_CHANNEL_ACCESS_TOKEN is not configured')
            return { success: false, error: 'LINE configuration missing' }
        }

        try {
            const supabase = await createClient()

            // 1. Get all units in the project with a LINE User ID
            const { data: units } = await supabase
                .from('units')
                .select('line_user_id')
                .eq('project_id', projectId)
                .not('line_user_id', 'is', null)

            const lineUserIds = units
                ?.map(u => u.line_user_id)
                .filter(Boolean) as string[] || []

            if (lineUserIds.length === 0) {
                return { success: true, count: 0 }
            }

            // Batching for Multicast (max 500)
            const BATCH_SIZE = 500
            const batches = []
            for (let i = 0; i < lineUserIds.length; i += BATCH_SIZE) {
                batches.push(lineUserIds.slice(i, i + BATCH_SIZE))
            }

            // Send multicast
            const results = await Promise.all(batches.map(async (batchIds) => {
                const response = await fetch(`${LINE_API_URL}/multicast`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
                    },
                    body: JSON.stringify({
                        to: batchIds,
                        messages: messages
                    })
                })
                return response.ok
            }))

            const successCount = results.filter(Boolean).length

            return {
                success: successCount === results.length,
                sentCount: lineUserIds.length,
                batches: results.length
            }

        } catch (error: any) {
            console.error('LineService.broadcastToProject exception:', error)
            return { success: false, error: error.message }
        }
    }
}
