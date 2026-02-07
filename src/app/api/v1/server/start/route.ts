import { NextRequest, NextResponse } from 'next/server';
import { spawn, ChildProcess } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { graphToCode } from '@/core/generator/graphToCode';
import { GraphState } from '@/core/types';

// Store running server processes (in production, use a proper process manager)
const runningServers: Map<number, { process: ChildProcess; port: number }> = new Map();

// Find an available port
function getAvailablePort(): number {
  // Start from 4000 and find an unused port
  const usedPorts = Array.from(runningServers.values()).map(s => s.port);
  let port = 4000;
  while (usedPorts.includes(port)) {
    port++;
  }
  return port;
}

export async function POST(req: NextRequest) {
  try {
    const { graph } = await req.json();
    
    if (!graph) {
      return NextResponse.json({ success: false, error: 'Missing graph' }, { status: 400 });
    }

    // Generate the server code
    const code = graphToCode(graph as GraphState);
    
    // Create a temp directory for the server
    const serverDir = join(tmpdir(), `atlas-server-${Date.now()}`);
    if (!existsSync(serverDir)) {
      mkdirSync(serverDir, { recursive: true });
    }

    // Write the server file
    const serverFile = join(serverDir, 'server.ts');
    writeFileSync(serverFile, code);

    // Write a minimal package.json
    const packageJson = {
      name: 'atlas-live-server',
      type: 'commonjs',
      dependencies: {
        express: '^4.18.0',
        cors: '^2.8.0',
      },
    };
    writeFileSync(join(serverDir, 'package.json'), JSON.stringify(packageJson, null, 2));

    // Get an available port
    const port = getAvailablePort();

    // Spawn the server using ts-node or tsx
    // Note: In a real production env, you'd use a process manager
    const serverProcess = spawn('npx', ['tsx', serverFile], {
      cwd: serverDir,
      env: { ...process.env, PORT: String(port) },
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    });

    const pid = serverProcess.pid || Date.now();

    // Store the process
    runningServers.set(pid, { process: serverProcess, port });

    // Capture output
    let stdout = '';
    let stderr = '';

    serverProcess.stdout?.on('data', (data) => {
      stdout += data.toString();
      console.log(`[Atlas Server ${port}]`, data.toString());
    });

    serverProcess.stderr?.on('data', (data) => {
      stderr += data.toString();
      console.error(`[Atlas Server ${port} ERR]`, data.toString());
    });

    serverProcess.on('close', (code) => {
      console.log(`[Atlas Server ${port}] Process exited with code ${code}`);
      runningServers.delete(pid);
    });

    // Wait a bit for the server to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    return NextResponse.json({
      success: true,
      port,
      pid,
      serverDir,
      message: `Server started on port ${port}`,
    });

  } catch (err: any) {
    console.error('Server start error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// Export the running servers for the stop endpoint
export { runningServers };
