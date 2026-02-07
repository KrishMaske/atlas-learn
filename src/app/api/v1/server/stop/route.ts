import { NextRequest, NextResponse } from 'next/server';

// In a real app, we'd share state properly. For simplicity, we'll send a kill signal via PID.
// Note: This is a simplified implementation. In production, use proper IPC/process management.

export async function POST(req: NextRequest) {
  try {
    const { pid } = await req.json();
    
    if (!pid) {
      return NextResponse.json({ success: false, error: 'Missing pid' }, { status: 400 });
    }

    // Try to kill the process
    try {
      process.kill(pid, 'SIGTERM');
      return NextResponse.json({ success: true, message: `Sent SIGTERM to process ${pid}` });
    } catch (killErr: any) {
      // Process might have already exited
      if (killErr.code === 'ESRCH') {
        return NextResponse.json({ success: true, message: 'Process already terminated' });
      }
      throw killErr;
    }

  } catch (err: any) {
    console.error('Server stop error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
