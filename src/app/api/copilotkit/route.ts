import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Temporary minimal implementation to fix build errors
  // TODO: Implement proper CopilotKit integration once version compatibility is resolved
  
  try {
    const body: unknown = await req.json();
    
    // Basic chat response for now
    return NextResponse.json({
      message: "Bună! Sunt profesorul tău de română. (Hello! I am your Romanian teacher.) CopilotKit integration is currently being updated for compatibility.",
      type: "assistant"
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
} 