import { NextRequest } from 'next/server';
import { subscribe } from '@/lib/crm/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ event: 'connected', timestamp: new Date().toISOString() })}\n\n`
        )
      );

      // Subscribe to real-time events from the store
      const unsubscribe = subscribe((data) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Stream closed by client
          unsubscribe();
        }
      });

      // Keepalive ping every 30 seconds
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch {
          clearInterval(keepalive);
          unsubscribe();
        }
      }, 30000);

      // Cleanup when the client disconnects
      request.signal.addEventListener('abort', () => {
        clearInterval(keepalive);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
