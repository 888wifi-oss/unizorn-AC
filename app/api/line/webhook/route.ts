import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || '';
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get('x-line-signature') as string;

        // Verify signature
        const expectedSignature = crypto
            .createHmac('sha256', LINE_CHANNEL_SECRET)
            .update(body)
            .digest('base64');

        if (signature !== expectedSignature) {
            console.error('Invalid signature');
            return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
        }

        const events = JSON.parse(body).events;

        for (const event of events) {
            if (event.type === 'message' && event.message.type === 'text') {
                const userMessage = event.message.text.toLowerCase().trim();
                const replyToken = event.replyToken;
                const userId = event.source.userId;

                if (userMessage === 'myid') {
                    await replyMessage(replyToken, `LINE User ID ของคุณคือ:\n${userId}\n\n(กดคัดลอกรหัสข้างบนนี้ไปใส่ในแอปได้เลยครับ)`);
                } else {
                    // Optional: Reply help message or ignore
                    // await replyMessage(replyToken, 'พิมพ์ "myid" เพื่อดู User ID ของคุณ');
                }
            }
        }

        return NextResponse.json({ message: 'OK' });
    } catch (err) {
        console.error('Webhook Error:', err);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

async function replyMessage(replyToken: string, text: string) {
    const response = await fetch('https://api.line.me/v2/bot/message/reply', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
            replyToken: replyToken,
            messages: [{ type: 'text', text: text }],
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to reply: ${response.statusText}`);
    }
}
