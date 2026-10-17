// Supabase Edge Function: gemini-chat
// Calls Google Gemini REST API directly with CORS support

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// High-availability models on Gemini v1beta REST API
const MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite'];

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'GEMINI_API_KEY is not configured in Supabase secrets. Please set it using: npx supabase secrets set GEMINI_API_KEY=your_key',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required and must be a non-empty string.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let replyText: string | null = null;
    let lastErrorMessage = 'Failed to generate response.';

    // Try primary model (gemini-3.5-flash), fallback to gemini-3.5-flash-lite if needed
    for (const model of MODELS) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      try {
        const geminiResponse = await fetch(geminiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
          }),
        });

        if (geminiResponse.ok) {
          const data = await geminiResponse.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            replyText = text;
            break;
          }
        } else {
          const errorText = await geminiResponse.text();
          try {
            const errorJson = JSON.parse(errorText);
            lastErrorMessage = errorJson?.error?.message || errorText;
          } catch {
            lastErrorMessage = errorText || `Gemini API error (Status ${geminiResponse.status})`;
          }
        }
      } catch (err) {
        lastErrorMessage = err instanceof Error ? err.message : String(err);
      }
    }

    if (replyText) {
      return new Response(
        JSON.stringify({ reply: replyText }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: lastErrorMessage }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
