import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type PushPayload =
  | {
      type: "message";
      senderId: string;
      conversationId: string;
      content: string;
    }
  | {
      type: "like";
      actorId: string;
      postId: string;
    }
  | {
      type: "follow";
      actorId: string;
      targetUserId: string;
    };

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const supabaseUrl = "https://qnatyjdgkwazvcanpcuo.supabase.co";
  const supabaseAnonKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuYXR5amRna3dhenZjYW5wY3VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MjQ5NDIsImV4cCI6MjA4ODEwMDk0Mn0.3CSWAKatCIcM3ZN_eXUFcMJ0ygKT0_Wrqy6R6duTwvM";

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });

  const body = (await req.json()) as {
    recipientId: string;
    title?: string;
    body?: string;
    data?: PushPayload & Record<string, any>;
  };

  const { recipientId } = body;

  if (!recipientId) {
    return new Response("recipientId is required", { status: 400 });
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("expo_push_token, username")
    .eq("id", recipientId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching user:", error);
    return new Response("Internal error", { status: 500 });
  }

  if (!user?.expo_push_token) {
    return new Response("No token for user", { status: 200 });
  }

  const message = {
    to: user.expo_push_token as string,
    sound: "default" as const,
    title: body.title ?? "SocialHub",
    body: body.body ?? "You have a new notification",
    data: body.data ?? {},
  };

  const expoRes = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(message),
  });

  const expoJson = await expoRes.json();

  if (!expoRes.ok) {
    console.error("Expo push error:", expoJson);
    return new Response("Expo push error", { status: 500 });
  }

  return new Response(JSON.stringify(expoJson), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
