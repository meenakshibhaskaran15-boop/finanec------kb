-- LedgerLite Database Setup Script
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Create the Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    category TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
-- This is a security feature that allows you to control who can access which rows.
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 3. Create a Policy for Public Access (Development Mode)
-- NOTE: In a production app, you should restrict this to authenticated users!
CREATE POLICY "Allow public access for development" 
ON transactions 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 4. Create an Index for faster searching
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);

-- 5. Create the Saving Goals Table
CREATE TABLE IF NOT EXISTS saving_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    target_amount DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable RLS for Saving Goals
ALTER TABLE saving_goals ENABLE ROW LEVEL SECURITY;

-- 7. Create a Policy for Public Access to Saving Goals
CREATE POLICY "Allow public access for saving goals" 
ON saving_goals 
FOR ALL 
USING (true) 
WITH CHECK (true);
