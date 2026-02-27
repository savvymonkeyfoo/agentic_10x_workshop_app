import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Server-Sent Events endpoint for real-time asset status updates
 * Replaces polling mechanism for better performance
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const workshopId = searchParams.get('workshopId');

  if (!workshopId) {
    return new Response('workshopId required', { status: 400 });
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = (data: any) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Send initial status
      try {
        const assets = await prisma.asset.findMany({
          where: { workshopId },
          select: {
            id: true,
            status: true,
            name: true,
          },
        });
        sendUpdate({ type: 'initial', assets });
      } catch (error) {
        console.error('SSE initial fetch error:', error);
      }

      // Poll for changes every 3 seconds (server-side)
      // This is more efficient than client-side polling
      const interval = setInterval(async () => {
        try {
          const assets = await prisma.asset.findMany({
            where: {
              workshopId,
              status: 'PROCESSING', // Only check processing assets
            },
            select: {
              id: true,
              status: true,
              name: true,
            },
          });

          if (assets.length > 0) {
            sendUpdate({ type: 'update', assets });
          }

          // If no processing assets, close the connection
          if (assets.length === 0) {
            clearInterval(interval);
            controller.close();
          }
        } catch (error) {
          console.error('SSE update error:', error);
          clearInterval(interval);
          controller.close();
        }
      }, 3000);

      // Cleanup on connection close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
    },
  });
}
