import { NextRequest } from 'next/server';
import { RomanianTutorAgent } from '~/lib/ag-ui/romanian-agent';

export const runtime = 'edge';

/**
 * AG-UI Protocol API Route for Romanian Learning
 * Implements proper event-driven communication as per AG-UI specification
 * From: https://github.com/ag-ui-protocol/ag-ui/blob/main/docs/concepts/
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Parse request body
    const body = await req.json();
    const { message, sessionId, conversationHistory = [] } = body;

    if (!message || typeof message !== 'string') {
      return new Response('Invalid message', { status: 400 });
    }

    // Initialize Romanian tutor agent with AG-UI protocol
    const agent = new RomanianTutorAgent(sessionId);

    // Set up Server-Sent Events headers for AG-UI streaming
    const headers = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Create readable stream for AG-UI events
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Process message with AG-UI event streaming
          const responseGenerator = await agent.processMessage(message, conversationHistory);
          
          for await (const event of responseGenerator) {
            // Send AG-UI protocol event
            controller.enqueue(new TextEncoder().encode(event));
            
            // Small delay to prevent overwhelming the client
            await new Promise(resolve => setTimeout(resolve, 10));
          }
          
          controller.close();
        } catch (error) {
          console.error('AG-UI streaming error:', error);
          
          // Send error event in AG-UI format
          const errorEvent = {
            type: 'AGENT_ERROR',
            timestamp: new Date().toISOString(),
            data: {
              error: error instanceof Error ? error.message : 'Unknown error',
              context: { message, sessionId },
            },
            metadata: {
              agentId: 'romanian-tutor',
              sessionId: sessionId ?? 'unknown',
            },
          };
          
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify(errorEvent)}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, { headers });

  } catch (error) {
    console.error('AG-UI API error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 