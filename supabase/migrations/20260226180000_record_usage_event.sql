-- Atomic RPC: insert usage event, deduct credits, log transaction, update session totals
CREATE OR REPLACE FUNCTION public.record_usage_event(
  p_session_id     uuid,
  p_user_id        uuid,
  p_instance_id    uuid,
  p_input_tokens   integer,
  p_output_tokens  integer,
  p_compute_seconds numeric,
  p_credits_consumed numeric,
  p_cost_usd       numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
  v_remaining numeric;
  v_sub_credits numeric;
  v_topup_credits numeric;
  v_deduct_sub numeric;
  v_deduct_topup numeric;
BEGIN
  -- 1. Insert usage event
  INSERT INTO usage_events (
    session_id, user_id, instance_id,
    input_tokens, output_tokens, compute_seconds,
    credits_consumed, cost_usd
  ) VALUES (
    p_session_id, p_user_id, p_instance_id,
    p_input_tokens, p_output_tokens, p_compute_seconds,
    p_credits_consumed, p_cost_usd
  ) RETURNING id INTO v_event_id;

  -- 2. Deduct credits: subscription first, then topup. FOR UPDATE prevents races.
  SELECT subscription_credits, topup_credits
    INTO v_sub_credits, v_topup_credits
    FROM credit_balances
   WHERE user_id = p_user_id
     FOR UPDATE;

  -- If no balance row exists, create one (should exist from handle_new_user trigger)
  IF NOT FOUND THEN
    INSERT INTO credit_balances (user_id, subscription_credits, topup_credits)
    VALUES (p_user_id, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    v_sub_credits := 0;
    v_topup_credits := 0;
  END IF;

  v_remaining := p_credits_consumed;

  -- Deduct from subscription first
  v_deduct_sub := LEAST(v_sub_credits, v_remaining);
  v_remaining := v_remaining - v_deduct_sub;

  -- Then from topup
  v_deduct_topup := LEAST(v_topup_credits, v_remaining);
  -- Remaining after both is allowed to go negative (soft limit)

  UPDATE credit_balances
     SET subscription_credits = subscription_credits - v_deduct_sub,
         topup_credits = topup_credits - v_deduct_topup,
         updated_at = now()
   WHERE user_id = p_user_id;

  -- 3. Insert credit transaction (negative amount = usage deduction)
  INSERT INTO credit_transactions (
    user_id, session_id, type, credit_type, amount, description
  ) VALUES (
    p_user_id, p_session_id, 'usage', 'usage',
    -p_credits_consumed,
    'Chat usage: ' || p_input_tokens || ' in + ' || p_output_tokens || ' out tokens'
  );

  -- 4. Increment session totals
  UPDATE sessions
     SET total_input_tokens = COALESCE(total_input_tokens, 0) + p_input_tokens,
         total_output_tokens = COALESCE(total_output_tokens, 0) + p_output_tokens,
         compute_seconds = COALESCE(compute_seconds, 0) + p_compute_seconds,
         total_credits_consumed = COALESCE(total_credits_consumed, 0) + p_credits_consumed
   WHERE id = p_session_id;

  RETURN v_event_id;
END;
$$;
