import { NextRequest, NextResponse } from 'next/server';
import { runningServers } from '../start/route'; // Import shared state
import { rmSync, existsSync } from 'fs';

// In a real app, we'd share state properly. For simplicity, we'll send a kill signal via PID.
// Note: This is a simplified implementation. In production, use proper IPC/process management.

export async function POST(req: NextRequest) {
  try {
    const { pid } = await req.json();
    
    if (!pid) {
      return NextResponse.json({ success: false, error: 'Missing pid' }, { status: 400 });
    }

    const numericPid = typeof pid === 'string' ? parseInt(pid, 10) : pid;
    const serverInfo = runningServers.get(numericPid);

    // Try to kill the process
    try {
      process.kill(numericPid, 'SIGTERM');
    } catch (killErr: any) {
      // Process might have already exited, which is fine for cleanup
      if (killErr.code !== 'ESRCH') {
        console.error(`Failed to kill process ${numericPid}:`, killErr);
        // We continue to cleanup regardless
      }
    }

    // Cleanup registry
    if (serverInfo) {
        runningServers.delete(numericPid);
        
        // Cleanup temp directory
        try {
            if (serverInfo.workDir && existsSync(serverInfo.workDir)) {
                rmSync(serverInfo.workDir, { recursive: true, force: true });
                console.log(`[Atlas] Cleaned up workDir: ${serverInfo.workDir}`);
            }
        } catch (err) {
            console.error(`[Atlas] Failed to cleanup workDir for ${numericPid}:`, err);
        }
    }

    return NextResponse.json({ success: true, message: `Stopped server ${numericPid} and cleaned up resources` });

  } catch (err: any) {
    console.error('Server stop error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
