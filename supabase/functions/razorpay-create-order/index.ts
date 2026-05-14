import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type CreateOrderBody = {
  amount: number;
  currency?: string;
  plan?: string;
};

const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    return json(500, { error: "Missing server configuration" });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json(401, { error: "Unauthorized" });
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return json(401, { error: "Unauthorized" });
  }

  const body = (await req.json()) as CreateOrderBody;
  const amount = Number(body.amount);
  const currency = body.currency ?? "INR";
  const plan = typeof body.plan === "string" && body.plan.trim() ? body.plan.trim() : "sacred";

  if (!Number.isFinite(amount) || amount <= 0) {
    return json(400, { error: "Invalid amount" });
  }

  let keyId = Deno.env.get("RAZORPAY_KEY_ID") ?? "";
  let keySecret = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";

  if (serviceRoleKey) {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: cfg } = await admin.from("razorpay_config").select("key_id,key_secret").eq("id", 1).maybeSingle();
    if (cfg?.key_id?.trim()) {
      keyId = cfg.key_id.trim();
    }
    if (cfg?.key_secret?.trim()) {
      keySecret = cfg.key_secret.trim();
    }
  }

  if (!keyId || !keySecret) {
    return json(500, {
      error:
        "Razorpay keys missing. Save Key ID and Secret in Admin → Razorpay, or set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET on the Edge Function.",
    });
  }

  const credentials = btoa(`${keyId}:${keySecret}`);
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      amount,
      currency,
      receipt: `${user.id}-${Date.now()}`,
      notes: { user_id: user.id, plan },
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    return json(400, { error: payload?.error?.description ?? "Failed to create order" });
  }

  return json(200, {
    orderId: payload.id,
    amount: payload.amount,
    currency: payload.currency,
    keyId,
  });
});
