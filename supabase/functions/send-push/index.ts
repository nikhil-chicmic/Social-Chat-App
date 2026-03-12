import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

serve(async (req: Request) => {
  try {
    const { recipientId, title, body, data } = await req.json();

    if (!recipientId) {
      return new Response("recipientId required", { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: user } = await supabase
      .from("users")
      .select("expo_push_token")
      .eq("id", recipientId)
      .single();

    if (!user?.expo_push_token) {
      return new Response("No push token", { status: 200 });
    }

    const message = {
      to: user.expo_push_token,
      sound: "default",
      title: title || "New Notification",
      body: body || "",
      data: data || {},
    };

    const expoRes = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    const result = await expoRes.json();

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response("Error sending notification", { status: 500 });
  }
});
