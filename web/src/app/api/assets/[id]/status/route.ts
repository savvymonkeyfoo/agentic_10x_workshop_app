import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const asset = await prisma.asset.findUnique({
            where: { id: params.id },
            select: { status: true } // Only need status
        });

        if (!asset) {
            return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
        }

        return NextResponse.json({ status: asset.status });
    } catch (_error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
