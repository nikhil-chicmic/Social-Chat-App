import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  const { push_token, message, sender } = await req.json();

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: push_token,
      sound: "default",
      title: sender,
      body: message,
      data: { type: "chat_message" },
    }),
  });

  const result = await response.json();

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
});
