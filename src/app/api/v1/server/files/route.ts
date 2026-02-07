import { NextRequest, NextResponse } from 'next/server';
import { readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';
import { runningServers } from '../start/route';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  // Security Gate
  const ATLAS_SECRET = process.env.ATLAS_SECRET || 'atlas-local-dev-secret';
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== ATLAS_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const pid = searchParams.get('pid');
  const filePath = searchParams.get('path'); // relative path

  if (!pid) {
    return NextResponse.json({ success: false, error: 'Missing pid' }, { status: 400 });
  }

  const serverInfo = runningServers.get(parseInt(pid));
  if (!serverInfo) {
    return NextResponse.json({ success: false, error: 'Server not found' }, { status: 404 });
  }

  const workDir = serverInfo.workDir;

  try {
    // If path is provided, read file content
    if (filePath) {
      // Security check: prevent directory traversal
      const fullPath = join(workDir, filePath);
      if (!fullPath.startsWith(workDir)) {
        return NextResponse.json({ success: false, error: 'Invalid path' }, { status: 403 });
      }

      // Check if file exists and is a file
      const stats = statSync(fullPath);
      if (!stats.isFile()) {
        return NextResponse.json({ success: false, error: 'Not a file' }, { status: 400 });
      }

      // Allow reading text files only (crudely)
      // For now, let's just try to read as utf8. 
      // Binary files might return garbage or error, but explicit matching is safer.
      const isBinary = /\.(sqlite|db|png|jpg|node)$/.test(filePath);
      
      if (isBinary) {
          return NextResponse.json({ success: true, content: `[Binary file: ${filePath}]` });
      }

      const content = readFileSync(fullPath, 'utf8');
      return NextResponse.json({ success: true, content });
    }

    // Otherwise, list files
    const entries = readdirSync(workDir);
    const files = entries.map(name => {
      try {
        const fullPath = join(workDir, name);
        const stats = statSync(fullPath);
        return {
          name,
          type: stats.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          lastModified: stats.mtime.getTime(),
        };
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    return NextResponse.json({ success: true, files });

  } catch (err: any) {
    console.error('File API Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
