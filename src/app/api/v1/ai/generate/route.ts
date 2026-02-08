import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function POST(req: NextRequest) {
  try {
    const { nodeId, nodeType, nodeLabel, description, currentCode, context } = await req.json();

    console.log('[AI] Using OpenAI API');

    if (!OPENAI_API_KEY || OPENAI_API_KEY.startsWith('sk-...')) {
      return NextResponse.json({ success: false, error: 'Missing or invalid OPENAI_API_KEY' }, { status: 500 });
    }

    if (!description) {
      return NextResponse.json({ success: false, error: 'Missing description' }, { status: 400 });
    }

    // --- System Prompts per Node Type ---

    const prompts: Record<string, string> = {
      // Data
      SQL_DATABASE: `You are a Database Engineer. Generate code to interact with a SQL database.
REQUIREMENTS:
1. Use 'sqlite3' or 'pg' for database operations.
2. Assume environment variables for connection strings.
3. Output ONLY the code inside the Express route handler.`,

      NOSQL_DATABASE: `You are a Database Engineer. Generate code to interact with a NoSQL database (MongoDB).
REQUIREMENTS:
1. Use 'mongodb' driver.
2. Assume environment variables for connection strings.
3. Output ONLY the code inside the Express route handler.`,

      REDIS_CACHE: `You are a Backend Engineer. Generate code to interact with Redis.
REQUIREMENTS:
1. Use 'ioredis'.
2. Assume existing 'redis' client is available or create a new one.
3. Output ONLY the code inside the Express route handler.`,

      OBJECT_STORAGE: `You are a Cloud Engineer. Generate code to interact with Object Storage (S3).
REQUIREMENTS:
1. Use '@aws-sdk/client-s3'.
2. Assume environment variables for credentials.
3. Output ONLY the code inside the Express route handler.`,

      // Integrations
      SUPABASE: `You are a Full Stack Engineer. Generate code to interact with Supabase.
REQUIREMENTS:
1. Use '@supabase/supabase-js'.
2. Assume SUPABASE_URL and SUPABASE_KEY are in env.
3. Output ONLY the code inside the Express route handler.`,

      FIREBASE: `You are a Full Stack Engineer. Generate code to interact with Firebase Admin.
REQUIREMENTS:
1. Use 'firebase-admin'.
2. Assume service account is configured or mocked.
3. Output ONLY the code inside the Express route handler.`,

      GITHUB: `You are a DevOps Engineer. Generate code to interact with GitHub API.
REQUIREMENTS:
1. Use '@octokit/rest'.
2. Assume GITHUB_TOKEN is in env.
3. Output ONLY the code inside the Express route handler.`,

      // Logic
      FUNCTION: `You are a Senior Typescript Developer. Implement a specific business logic function.
REQUIREMENTS:
1. Write pure clean business logic.
2. Use 'input' variable for request data.
3. Output ONLY the code inside the Express route handler.`,
    };

    const defaultSystemPrompt = `You are an expert backend developer. Generate JavaScript/TypeScript code for an Express.js route handler.
REQUIREMENTS:
1. The code will be placed inside an Express route handler that already has:
   - \`req\` (Express Request object)
   - \`res\` (Express Response object)
   - \`input\` (parsed JSON body from req.body)
2. You must call \`res.json()\` to send a response.
3. Keep the code concise but functional.
4. Use async/await if needed.
5. Add helpful console.log statements for debugging.
6. OUTPUT ONLY THE CODE, no explanation, no markdown fences. Just raw JavaScript code.`;

    let systemPrompt = prompts[nodeType] || defaultSystemPrompt;

    // --- Inject Global System Context ---
    if (context) {
      systemPrompt = `SYSTEM CONTEXT / GLOBAL ARCHITECTURE:\n${context}\n\n${systemPrompt}`;
    }

    const userPrompt = `Context: Node "${nodeLabel}" (${nodeType})
Description: "${description}"
${currentCode ? `\nCURRENT CODE (improve or replace):\n\`\`\`\n${currentCode}\n\`\`\`` : ''}`;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', // or gpt-3.5-turbo
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      // Fallback for missing/invalid key or rate limits - return mock code for demo purposes if dev
      // For now, return error
      const errorText = await response.text();
      return NextResponse.json({
        success: false,
        error: 'AI Provider Error: ' + errorText
      }, { status: response.status });
    }

    const data = await response.json();
    const generatedCode = data.choices?.[0]?.message?.content || '';

    // Clean up the code (remove markdown fences if present)
    const cleanCode = generatedCode
      .replace(/```(?:javascript|typescript|js|ts)?\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    return NextResponse.json({ success: true, code: cleanCode });

  } catch (err: any) {
    console.error('AI generate error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
