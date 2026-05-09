import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type CreateOrderBody = {
  amount: number;
  currency?: string;
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
  const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
  const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

  if (!supabaseUrl || !supabaseAnonKey || !razorpayKeyId || !razorpayKeySecret) {
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

  if (!Number.isFinite(amount) || amount <= 0) {
    return json(400, { error: "Invalid amount" });
  }

  const credentials = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
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
      notes: { user_id: user.id, plan: "premium" },
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
    keyId: razorpayKeyId,
  });
});
