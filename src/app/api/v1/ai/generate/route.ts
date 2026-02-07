import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function POST(req: NextRequest) {
  try {
    const { nodeId, nodeType, nodeLabel, description, currentCode } = await req.json();

    console.log('[AI] Using OpenAI API');

    if (!OPENAI_API_KEY || OPENAI_API_KEY.startsWith('sk-...')) {
      return NextResponse.json({ success: false, error: 'Missing or invalid OPENAI_API_KEY' }, { status: 500 });
    }

    if (!description) {
      return NextResponse.json({ success: false, error: 'Missing description' }, { status: 400 });
    }

    const systemPrompts: Record<string, string> = {
      DATABASE: `You are a Database Engineer. Generate code to interact with a database.
CONTEXT:
- Node ID: ${nodeId}
- Node Type: ${nodeType}
- Node Label: ${nodeLabel}

REQUIREMENTS:
1. Use 'sqlite3' for database operations.
2. Create a file named 'database.sqlite' if needed.
3. If the user asks for a new DB, create tables.
4. If they ask to query, write the SQL query.
5. Example: \`const db = new sqlite3.Database('database.sqlite'); db.run(...)\`
6. Output ONLY the code inside the Express route handler.`,

      SQL_DATABASE: `You are a Database Engineer. Generate code to interact with a SQL database.
CONTEXT:
- Node ID: ${nodeId}
- Node Type: ${nodeType}
- Node Label: ${nodeLabel}

REQUIREMENTS:
1. Use 'sqlite3' for database operations.
2. Create a file named 'database.sqlite' if needed.
3. Output ONLY the code inside the Express route handler.`,

      AUTH_SERVICE: `You are a Security Engineer. Generate authentication logic.
CONTEXT:
- Node ID: ${nodeId}
- Node Type: ${nodeType}
- Node Label: ${nodeLabel}

REQUIREMENTS:
1. Use 'jsonwebtoken' for token generation/verification.
2. Use 'bcrypt' for password hashing if needed.
3. Implement login/register/verify logic based on description.
4. Output ONLY the code inside the Express route handler.`,

      QUEUE: `You are a Backend Engineer. Implement message queue logic.
CONTEXT:
- Node ID: ${nodeId}
- Node Type: ${nodeType}
- Node Label: ${nodeLabel}

REQUIREMENTS:
1. Use an in-memory array or simple mock queue.
2. Implement produce/consume logic.
3. Output ONLY the code inside the Express route handler.`,
    };

    const defaultSystemPrompt = `You are an expert backend developer. Generate JavaScript/TypeScript code for an Express.js route handler.
CONTEXT:
- Node ID: ${nodeId}
- Node Type: ${nodeType}
- Node Label: ${nodeLabel}

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

    const systemPrompt = systemPrompts[nodeType] || defaultSystemPrompt;

    const userPrompt = `Description: "${description}"
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
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      let errorMessage = 'OpenAI API error';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorMessage;
      } catch (e) {
        // ignore parse error
      }
      
      return NextResponse.json({ 
        success: false, 
        error: errorMessage,
        details: errorText 
      }, { status: response.status });
    }

    const data = await response.json();
    const generatedCode = data.choices?.[0]?.message?.content || '';

    // Clean up the code (remove markdown fences if present)
    let cleanCode = generatedCode
      .replace(/```(?:javascript|typescript|js|ts)?\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    return NextResponse.json({ success: true, code: cleanCode });

  } catch (err: any) {
    console.error('AI generate error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
