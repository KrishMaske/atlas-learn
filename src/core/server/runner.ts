import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';

export function spawnServerProcess(serverDir: string, port: number): ChildProcess {
    // Use a completely dynamic path construction to confuse Turbopack's static analysis
    const parts = ['server', 'js'];
    const scriptName = parts.join('.');
    const scriptPath = join(serverDir, scriptName);

    console.log('[Atlas Runner] Spawning:', scriptPath);

    return spawn('node', [scriptPath], {
        cwd: serverDir,
        env: {
            ...process.env,
            PORT: port.toString(), // Explicitly set PORT to override inherited Next.js port
        },
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false,
    });
}
