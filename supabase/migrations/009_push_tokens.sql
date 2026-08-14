-- 009_push_tokens.sql

CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'android',
  device_role TEXT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, token)
);

-- Trigger para auto-asignar 'owner' o 'customer' según si existe en admin_users
CREATE OR REPLACE FUNCTION set_push_token_role() RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM admin_users WHERE user_id = NEW.user_id) THEN
    NEW.device_role := 'owner';
  ELSE
    NEW.device_role := 'customer';
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER push_token_role_trigger
  BEFORE INSERT OR UPDATE ON push_tokens
  FOR EACH ROW EXECUTE FUNCTION set_push_token_role();

-- RLS
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_tokens_select_own" 
  ON push_tokens FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "push_tokens_insert_own" 
  ON push_tokens FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_tokens_update_own" 
  ON push_tokens FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "push_tokens_delete_own" 
  ON push_tokens FOR DELETE 
  USING (auth.uid() = user_id);

-- RPC for deactivating token on logout without active session
CREATE OR REPLACE FUNCTION deactivate_push_token(token_val TEXT) RETURNS void AS $$
BEGIN
  UPDATE push_tokens SET active = false, updated_at = now() WHERE token = token_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
