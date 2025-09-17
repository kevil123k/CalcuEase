import { NextResponse } from 'next/server';
// We import the actual tool from your existing file
import { unitConversion } from '@/ai/flows/unit-conversion-tool';

export async function POST(request: Request) {
    try {
        const { expression } = await request.json();

        if (!expression) {
            return NextResponse.json({ error: 'Expression is required.' }, { status: 400 });
        }

        const result = await unitConversion({ expression });
        return NextResponse.json({ data: result });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to perform unit conversion.' }, { status: 500 });
    }
}