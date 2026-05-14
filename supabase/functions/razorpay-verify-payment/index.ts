import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type VerifyBody = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  plan?: string;
};

const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return json(500, { error: "Missing server configuration" });
  }

  let keySecret = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: cfg } = await admin.from("razorpay_config").select("key_secret").eq("id", 1).maybeSingle();
  if (cfg?.key_secret?.trim()) {
    keySecret = cfg.key_secret.trim();
  }

  if (!keySecret) {
    return json(500, {
      error:
        "Razorpay secret missing. Save it in Admin → Razorpay, or set RAZORPAY_KEY_SECRET on the Edge Function.",
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json(401, { error: "Unauthorized" });
  }

  const token = authHeader.replace("Bearer ", "");
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser(token);

  if (authError || !user) {
    return json(401, { error: "Unauthorized" });
  }

  const body = (await req.json()) as VerifyBody;
  if (!body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
    return json(400, { error: "Missing payment verification fields" });
  }

  const message = `${body.razorpay_order_id}|${body.razorpay_payment_id}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(keySecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  const expectedSignature = toHex(signatureBuffer);

  if (expectedSignature !== body.razorpay_signature) {
    return json(400, { error: "Invalid payment signature" });
  }

  const rawPlan = typeof body.plan === "string" ? body.plan.trim().toLowerCase() : "";
  const dbPlan = rawPlan === "moksha" ? "moksha" : "premium";

  const { error: upsertError } = await admin.from("subscriptions").upsert(
    {
      user_id: user.id,
      plan: dbPlan,
      status: "active",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (upsertError) {
    return json(500, { error: "Failed to activate subscription" });
  }

  return json(200, { success: true, plan: dbPlan });
});
