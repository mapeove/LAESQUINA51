-- Add user_id column to orders table to track the user who placed the order
ALTER TABLE orders 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Policy to allow users to read their own orders
CREATE POLICY "orders_read_own" ON orders 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy to allow users to update their own orders (if needed, e.g. for cancellation, though mostly admin does this)
CREATE POLICY "orders_update_own" ON orders 
FOR UPDATE 
USING (auth.uid() = user_id);
