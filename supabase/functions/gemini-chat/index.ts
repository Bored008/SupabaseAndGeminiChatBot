// Supabase Edge Function: gemini-chat
// Calls Google Gemini REST API directly with CORS support & AG-UI / SSE Streaming

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// High-availability models on Gemini v1beta REST API
const MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];

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

    const { prompt, stream = false } = await req.json();
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required and must be a non-empty string.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Option C: AG-UI Protocol Compatible SSE Token Streaming
    if (stream) {
      let activeStreamResponse: Response | null = null;
      let streamModelUsed = MODELS[0];

      for (const model of MODELS) {
        const streamUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
        try {
          const res = await fetch(streamUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey,
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          });
          if (res.ok && res.body) {
            activeStreamResponse = res;
            streamModelUsed = model;
            break;
          }
        } catch (_) {}
      }

      if (!activeStreamResponse || !activeStreamResponse.body) {
        return new Response(
          JSON.stringify({ error: 'Failed to initiate Gemini streaming session.' }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Transform raw Gemini SSE into AG-UI compatible protocol events
      const textDecoder = new TextDecoder();
      const textEncoder = new TextEncoder();
      const reader = activeStreamResponse.body.getReader();

      const readable = new ReadableStream({
        async start(controller) {
          // Send AG-UI RUN_STARTED event
          controller.enqueue(
            textEncoder.encode(`data: ${JSON.stringify({ type: 'RUN_STARTED', model: streamModelUsed })}\n\n`)
          );

          let buffer = '';
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += textDecoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('data: ')) {
                  const dataStr = trimmed.slice(6);
                  if (dataStr === '[DONE]') continue;
                  try {
                    const parsed = JSON.parse(dataStr);
                    const chunk = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (chunk) {
                      // Emit AG-UI TEXT_MESSAGE_DELTA event
                      controller.enqueue(
                        textEncoder.encode(
                          `data: ${JSON.stringify({ type: 'TEXT_MESSAGE_DELTA', delta: chunk })}\n\n`
                        )
                      );
                    }
                  } catch (_) {
                    // Ignore SSE json chunk boundaries
                  }
                }
              }
            }

            // Flush remaining buffer
            if (buffer.trim().startsWith('data: ')) {
              try {
                const parsed = JSON.parse(buffer.trim().slice(6));
                const chunk = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (chunk) {
                  controller.enqueue(
                    textEncoder.encode(
                      `data: ${JSON.stringify({ type: 'TEXT_MESSAGE_DELTA', delta: chunk })}\n\n`
                    )
                  );
                }
              } catch (_) {}
            }

            // Emit AG-UI RUN_FINISHED event
            controller.enqueue(
              textEncoder.encode(`data: ${JSON.stringify({ type: 'RUN_FINISHED' })}\n\n`)
            );
            controller.close();
          } catch (streamErr) {
            controller.enqueue(
              textEncoder.encode(
                `data: ${JSON.stringify({ type: 'RUN_ERROR', error: String(streamErr) })}\n\n`
              )
            );
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Fallback: Non-streaming unary execution
    let replyText: string | null = null;
    let lastErrorMessage = 'Failed to generate response.';

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
            contents: [{ parts: [{ text: prompt }] }],
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

