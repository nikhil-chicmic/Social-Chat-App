import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type FcmServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

async function getFcmAccessToken(sa: FcmServiceAccount): Promise<string> {
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: sa.client_email,
    sub: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encoder = new TextEncoder();
  const base64UrlEncode = (obj: unknown) =>
    btoa(String.fromCharCode(...encoder.encode(JSON.stringify(obj))))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");

  const unsignedJwt = `${base64UrlEncode(header)}.${base64UrlEncode(claims)}`;

  const pem = sa.private_key;
  const pemBody = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");
  const binaryDerString = atob(pemBody);
  const binaryDer = new Uint8Array(
    [...binaryDerString].map((char) => char.charCodeAt(0)),
  );

  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    encoder.encode(unsignedJwt),
  );

  const signatureBase64 = btoa(
    String.fromCharCode(...new Uint8Array(signature)),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  const jwt = `${unsignedJwt}.${signatureBase64}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }).toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to obtain FCM access token:", res.status, text);
    throw new Error("Failed to obtain FCM access token");
  }

  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const { recipientId, title, body: messageBody, data } = body;

    if (!recipientId) {
      return new Response("recipientId required", { status: 400 });
    }

    const rawServiceAccount = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON");
    if (!rawServiceAccount) {
      console.error("FCM_SERVICE_ACCOUNT_JSON is not set in environment");
      return new Response("Push not configured", { status: 500 });
    }

    let serviceAccount: FcmServiceAccount;
    try {
      serviceAccount = JSON.parse(rawServiceAccount) as FcmServiceAccount;
    } catch (err) {
      console.error("Invalid FCM_SERVICE_ACCOUNT_JSON:", err);
      return new Response("Push not configured", { status: 500 });
    }

    const accessToken = await getFcmAccessToken(serviceAccount);

    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

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

    const fcmToken = user.expo_push_token as string;

    const payload = {
      message: {
        token: fcmToken,
        notification: {
          title: title ?? "SocialHub",
          body: messageBody ?? "New notification",
        },
        android: {
          notification: {
            channel_id: "default",
          },
        },
        data: data ?? {},
      },
    };

    console.log("Sending FCM v1 push to token:", fcmToken);

    // Await FCM request so the function reliably reports status
    const res = await fetch(fcmUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    let json: unknown = null;
    try {
      json = await res.json();
    } catch {
      // ignore JSON parse errors
    }
    console.log("FCM v1 status:", res.status, "response:", json);

    return new Response(
      JSON.stringify({ success: true, message: "Push queued" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("Edge error:", err);
    return new Response(
      JSON.stringify({ error: "Error sending notification" }),
      { status: 500 },
    );
  }
});
