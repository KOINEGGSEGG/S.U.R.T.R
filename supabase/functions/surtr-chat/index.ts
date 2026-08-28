import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT =
  "You are SURTR — Seriously Useful Robot That Responds. " +
  "You are a confident, helpful, concise personal AI assistant. " +
  "You speak naturally and efficiently, like JARVIS. " +
  "Avoid excessive emojis, generic chatbot language, and repetitive phrases. " +
  "Keep responses short and natural for voice interaction. " +
  "Address the user as 'sir' occasionally but not every sentence.";

const GEMINI_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-flash-latest",
  "gemini-2.5-flash",
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "AI service not configured. Add your Gemini API key in the Secrets tab.",
          connected: false,
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();
    const messages = body.messages as Array<{ role: string; content: string }>;
    const customSystemPrompt = body.systemPrompt as string | undefined;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const systemInstruction = customSystemPrompt || SYSTEM_PROMPT;

    // Convert chat messages to Gemini format
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    let lastError = "";
    let lastStatus = 500;

    for (const model of GEMINI_MODELS) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const geminiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (geminiResponse.ok) {
        const geminiData = await geminiResponse.json();
        const responseText =
          geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (responseText) {
          return new Response(
            JSON.stringify({ response: responseText, model }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        lastError = "Empty response from AI service";
        lastStatus = 502;
        continue;
      }

      const errorBody = await geminiResponse.text();
      console.error(`Gemini API error (${model}):`, errorBody);
      lastStatus = geminiResponse.status;
      lastError = errorBody;

      // If it's a 400 (bad key/format) or 403 (key not authorized), no point trying other models
      if (geminiResponse.status === 400 || geminiResponse.status === 403) {
        break;
      }
      // If 404 (model not found), try next model
      // If 429 (rate limit), try next model
    }

    // Parse the last error for a user-friendly message
    let userMessage = "Gemini API error";
    try {
      const parsed = JSON.parse(lastError);
      userMessage = parsed?.error?.message || userMessage;
    } catch {
      if (lastStatus === 400) userMessage = "Invalid API key or request format";
      else if (lastStatus === 403) userMessage = "API key not authorized for Gemini";
      else if (lastStatus === 429) userMessage = "Rate limit exceeded. Please wait a moment.";
      else if (lastStatus === 404) userMessage = "No available Gemini model found";
      else if (lastError) userMessage = lastError.slice(0, 200);
    }

    return new Response(
      JSON.stringify({ error: userMessage }),
      {
        status: lastStatus,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("surtr-chat error:", err);
    return new Response(
      JSON.stringify({ error: "Backend error. Please try again." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
