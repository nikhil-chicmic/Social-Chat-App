import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const body = await req.json();
    const { recipientId, title, body: messageBody, data } = body;

    if (!recipientId) {
      return new Response("recipientId required", { status: 400 });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("expo_push_token")
      .eq("id", recipientId)
      .maybeSingle();

    if (error) {
      console.error("DB error:", error);
      return new Response("DB error", { status: 500 });
    }

    if (!user?.expo_push_token) {
      console.log("No push token for user:", recipientId);
      return new Response("No push token", { status: 200 });
    }

    const message = {
      to: user.expo_push_token,
      sound: "default",
      title: title ?? "SocialHub",
      body: messageBody ?? "New notification",
      data: data ?? {},
    };

    console.log("Sending push to token:", user.expo_push_token);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const expoRes = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const expoJson = await expoRes.json();

    console.log("Expo response:", expoJson);

    return new Response(JSON.stringify(expoJson), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
});
