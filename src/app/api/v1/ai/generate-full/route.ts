import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

interface NodeData {
    id: string;
    type: string;
    label: string;
    config: Record<string, any>;
}

interface EdgeData {
    id: string;
    sourceId: string;
    targetId: string;
}

export async function POST(req: NextRequest) {
    try {
        const { nodes, edges, globalContext } = await req.json() as {
            nodes: NodeData[];
            edges: EdgeData[];
            globalContext?: string;
        };

        console.log('[AI Generate Full] Generating complete backend for', nodes.length, 'nodes');

        if (!OPENAI_API_KEY || OPENAI_API_KEY.startsWith('sk-...')) {
            return NextResponse.json({ success: false, error: 'Missing or invalid OPENAI_API_KEY' }, { status: 500 });
        }

        if (!nodes || nodes.length === 0) {
            return NextResponse.json({ success: false, error: 'No nodes provided' }, { status: 400 });
        }

        // Build architecture description
        const architectureLines: string[] = [];

        // Group nodes by type
        const contextNodes = nodes.filter(n => n.type === 'CONTEXT');
        const dbNodes = nodes.filter(n => ['SQL_DATABASE', 'NOSQL_DATABASE'].includes(n.type));
        const cacheNodes = nodes.filter(n => n.type === 'REDIS_CACHE');
        const storageNodes = nodes.filter(n => n.type === 'OBJECT_STORAGE');
        const integrationNodes = nodes.filter(n => ['SUPABASE', 'FIREBASE', 'GITHUB'].includes(n.type));
        const functionNodes = nodes.filter(n => n.type === 'FUNCTION');
        const apiNodes = nodes.filter(n => ['REST_API', 'GRAPHQL_API'].includes(n.type));

        // Context
        if (contextNodes.length > 0 || globalContext) {
            architectureLines.push('## Global Context');
            if (globalContext) architectureLines.push(globalContext);
            for (const node of contextNodes) {
                const ctx = (node.config as any).context || (node.config as any).prompt || '';
                if (ctx) architectureLines.push(`- ${node.label}: ${ctx}`);
            }
            architectureLines.push('');
        }

        // Databases
        if (dbNodes.length > 0) {
            architectureLines.push('## Databases');
            for (const node of dbNodes) {
                const cfg = node.config as any;
                const description = cfg.description || cfg.jobSpec || '';
                const schema = cfg.schema || '';
                const engine = cfg.engine || 'SQLITE'; // Default to SQLite
                architectureLines.push(`- ${node.label} (${node.type})`);
                architectureLines.push(`  Engine: ${engine}`);
                if (description) architectureLines.push(`  Description: ${description}`);
                if (schema) architectureLines.push(`  Schema: ${schema}`);
            }
            architectureLines.push('');
        }

        // Caches
        if (cacheNodes.length > 0) {
            architectureLines.push('## Caches');
            for (const node of cacheNodes) {
                architectureLines.push(`- ${node.label} (Redis)`);
            }
            architectureLines.push('');
        }

        // Storage
        if (storageNodes.length > 0) {
            architectureLines.push('## Object Storage');
            for (const node of storageNodes) {
                architectureLines.push(`- ${node.label}`);
            }
            architectureLines.push('');
        }

        // Integrations
        if (integrationNodes.length > 0) {
            architectureLines.push('## External Integrations');
            for (const node of integrationNodes) {
                const cfg = node.config as any;
                architectureLines.push(`- ${node.label} (${node.type})`);
                if (cfg.url) architectureLines.push(`  URL: ${cfg.url}`);
                if (cfg.repo) architectureLines.push(`  Repo: ${cfg.repo}`);
            }
            architectureLines.push('');
        }

        // Functions
        if (functionNodes.length > 0) {
            architectureLines.push('## Business Logic Functions');
            for (const node of functionNodes) {
                const cfg = node.config as any;
                const description = cfg.description || cfg.jobSpec || '';
                architectureLines.push(`- ${node.label}`);
                if (description) architectureLines.push(`  Logic: ${description}`);
            }
            architectureLines.push('');
        }

        // APIs
        if (apiNodes.length > 0) {
            architectureLines.push('## API Endpoints');
            for (const node of apiNodes) {
                const cfg = node.config as any;
                const method = cfg.method || 'GET';
                const path = cfg.path || `/api/${node.label.toLowerCase().replace(/\s+/g, '-')}`;
                const description = cfg.description || cfg.jobSpec || '';

                // Find what this API connects to
                const connectedTo = edges
                    .filter(e => e.sourceId === node.id)
                    .map(e => nodes.find(n => n.id === e.targetId))
                    .filter(Boolean)
                    .map(n => n!.label);

                architectureLines.push(`- ${method} ${path} (${node.label})`);
                if (description) architectureLines.push(`  Description: ${description}`);
                if (connectedTo.length > 0) architectureLines.push(`  Uses: ${connectedTo.join(', ')}`);
            }
            architectureLines.push('');
        }

        // Connections summary
        if (edges.length > 0) {
            architectureLines.push('## Data Flow (Connections)');
            for (const edge of edges) {
                const source = nodes.find(n => n.id === edge.sourceId);
                const target = nodes.find(n => n.id === edge.targetId);
                if (source && target) {
                    architectureLines.push(`- ${source.label} -> ${target.label}`);
                }
            }
            architectureLines.push('');
        }

        const architectureDescription = architectureLines.join('\n');

        // System prompt
        const systemPrompt = `You are an expert backend architect. Generate a COMPLETE, WORKING Express.js server based on the architecture below.

CRITICAL REQUIREMENTS:
1. Output ONLY valid JavaScript code. No markdown, no explanations, no code fences.
2. Initialize ALL databases/services at the top of the file as module-level variables.
3. For SQL Databases, CHECK the 'engine' config:
   - If 'POSTGRES', use 'pg' package and Client. connectionString should be process.env.DATABASE_URL.
   - If 'MYSQL', use 'mysql2/promise'.
   - If 'SQLITE' or undefined, use 'sqlite3' with a file-based database (mydb.sqlite).
4. Create API routes ONLY for nodes marked as REST_API or GRAPHQL_API.
5. Use the "Uses" connections to determine which services each API endpoint should access.
6. Write REAL working code - real SQL queries, real logic, real error handling.
7. Include a health check endpoint at GET /health.
8. Add console.log statements for debugging.
9. Make the code production-quality: proper error handling, validation, async/await.
10. The server MUST listen on process.env.PORT || 4000. Do NOT hardcode 3000.
11. Generate an OpenAPI 3.0 spec object (\`swaggerDocument\`) describing all API routes.
12. Serve API documentation at GET /api-docs using \`require('@scalar/express-api-reference').apiReference({ spec: { content: swaggerDocument } })\`.
13. Ensure \`app.use(express.json())\` is present.

ARCHITECTURE:
${architectureDescription}`;

        const userPrompt = `Generate the complete server.js file for this architecture. Remember: ONLY output the raw JavaScript code, no markdown fences or explanations.`;

        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.3, // Lower temperature for more consistent code
                max_tokens: 4096,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[AI Generate Full] OpenAI error:', errorText);
            return NextResponse.json({
                success: false,
                error: 'AI Provider Error: ' + errorText
            }, { status: response.status });
        }

        const data = await response.json();
        const generatedCode = data.choices?.[0]?.message?.content || '';

        // Clean up the code (remove markdown fences if present)
        const cleanCode = generatedCode
            .replace(/```(?:javascript|typescript|js|ts)?[\r\n]?/g, '')
            .replace(/```[\r\n]?/g, '')
            .trim();

        console.log('[AI Generate Full] Generated', cleanCode.length, 'characters of code');

        return NextResponse.json({
            success: true,
            code: cleanCode,
            nodeCount: nodes.length,
            apiCount: apiNodes.length,
        });

    } catch (err: any) {
        console.error('[AI Generate Full] Error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
