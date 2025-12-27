# Supabase Credit System Setup Guide

**Easy Step-by-Step Instructions** 🚀

---

## What We're Doing

We're adding 4 new tables to your Supabase database to track credits:
1. `user_credits` - How many credits each user has
2. `credit_transactions` - History of all credit usage
3. `credit_packages` - Available packages to buy
4. `credit_confirmations` - Video generation approvals

---

## Step-by-Step Instructions

### **Step 1: Open Supabase SQL Editor**

1. Go to: **https://supabase.com/dashboard**
2. Click on your project: **"morgus-agent"** (or whatever it's called)
3. In the left sidebar, click **"SQL Editor"** (looks like a database icon)
4. You should see a page with a SQL editor

### **Step 2: Create New Query**

1. Click the **"New Query"** button (top right, green button)
2. A blank SQL editor will open

### **Step 3: Copy the Migration SQL**

1. Open the file: `supabase/migrations/20251226_credit_system.sql`
2. **Select ALL the text** (Ctrl+A or Cmd+A)
3. **Copy it** (Ctrl+C or Cmd+C)

### **Step 4: Paste and Run**

1. Go back to the Supabase SQL Editor
2. **Paste** the SQL code (Ctrl+V or Cmd+V)
3. Click the **"Run"** button (bottom right, or press Ctrl+Enter)
4. Wait 2-3 seconds...

### **Step 5: Verify Success**

You should see green checkmarks and messages like:
- ✅ `CREATE TABLE user_credits`
- ✅ `CREATE TABLE credit_transactions`
- ✅ `CREATE TABLE credit_packages`
- ✅ `CREATE TABLE credit_confirmations`
- ✅ `CREATE FUNCTION initialize_user_credits`
- ✅ `CREATE FUNCTION add_credits`
- ✅ `CREATE FUNCTION use_credits`
- ✅ `CREATE FUNCTION check_credits`

### **Step 6: Test It Works**

Run this test query to verify:

```sql
-- Check tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%credit%';
```

You should see 4 tables listed.

---

## What This Creates

### **Tables:**

1. **user_credits**
   - Tracks each user's credit balance
   - Columns: `user_id`, `image_credits_total`, `image_credits_used`, `video_credits_total`, `video_credits_used`, `unlimited_credits`

2. **credit_transactions**
   - History of all credit additions and usage
   - Columns: `id`, `user_id`, `transaction_type`, `credit_type`, `amount`, `balance_after`, `metadata`

3. **credit_packages**
   - Available packages for purchase
   - Pre-populated with 3 packages:
     - Image Pack: $10 for 50 images
     - Video Pack: $15 for 20 videos
     - Creator Bundle: $20 for 50 images + 20 videos

4. **credit_confirmations**
   - Pending video generation approvals
   - Columns: `id`, `user_id`, `credit_type`, `credits_required`, `status`, `expires_at`

### **Functions:**

1. **initialize_user_credits()**
   - Automatically runs when new user signs up
   - Gives 5 free image credits + 1 free video credit

2. **add_credits(user_id, type, amount, reason)**
   - Add credits to user account
   - Records transaction

3. **use_credits(user_id, type, amount, task_id, description)**
   - Deduct credits from user account
   - Validates sufficient balance
   - Records transaction

4. **check_credits(user_id, type, amount)**
   - Check if user has enough credits
   - Returns true/false

---

## Enable Unlimited Credits (For Testing)

After running the migration, you can give yourself unlimited credits:

```sql
-- Replace 'YOUR_USER_ID' with your actual user ID
UPDATE user_credits
SET unlimited_credits = true
WHERE user_id = 'YOUR_USER_ID';
```

**To find your user ID:**
```sql
SELECT id, email FROM auth.users;
```

**When unlimited is enabled:**
- ✅ Credit checks always pass
- ✅ No credits are deducted
- ✅ Perfect for testing and development
- ✅ Can be enabled for admin accounts

---

## Troubleshooting

### **Error: "relation already exists"**
**Solution:** Tables already exist. You can either:
1. Skip this (you're good!)
2. Drop tables first (if you want to start fresh):
```sql
DROP TABLE IF EXISTS credit_confirmations CASCADE;
DROP TABLE IF EXISTS credit_transactions CASCADE;
DROP TABLE IF EXISTS credit_packages CASCADE;
DROP TABLE IF EXISTS user_credits CASCADE;
```
Then run the migration again.

### **Error: "permission denied"**
**Solution:** Make sure you're logged in as the project owner.

### **Error: "syntax error"**
**Solution:** Make sure you copied the ENTIRE SQL file (all 450+ lines).

---

## After Migration

### **Check Your Balance**

```sql
-- See your credit balance
SELECT * FROM user_credits WHERE user_id = 'YOUR_USER_ID';
```

### **View All Packages**

```sql
-- See available packages
SELECT * FROM credit_packages;
```

### **View Transaction History**

```sql
-- See all transactions
SELECT * FROM credit_transactions WHERE user_id = 'YOUR_USER_ID';
```

---

## Quick Reference

### **Give Someone Credits**

```sql
-- Add 50 image credits
SELECT add_credits(
  'USER_ID_HERE'::uuid,
  'image',
  50,
  'purchase',
  'Purchased Image Pack'
);

-- Add 20 video credits
SELECT add_credits(
  'USER_ID_HERE'::uuid,
  'video',
  20,
  'purchase',
  'Purchased Video Pack'
);
```

### **Check If Someone Has Credits**

```sql
-- Check if user has 1 image credit
SELECT check_credits('USER_ID_HERE'::uuid, 'image', 1);
-- Returns: true or false
```

### **Enable/Disable Unlimited**

```sql
-- Enable unlimited credits
UPDATE user_credits
SET unlimited_credits = true
WHERE user_id = 'USER_ID_HERE';

-- Disable unlimited credits
UPDATE user_credits
SET unlimited_credits = false
WHERE user_id = 'USER_ID_HERE';
```

---

## What Happens Next?

After running this migration:

1. ✅ **New users automatically get free credits**
   - 5 image credits
   - 1 video credit

2. ✅ **Credit checks work in the app**
   - Worker checks credits before generating
   - DPPM deducts credits after generation

3. ✅ **Transaction history is tracked**
   - Every credit addition recorded
   - Every credit usage recorded

4. ✅ **Video confirmations work**
   - User must approve before video generation
   - 5-minute expiry on confirmations

---

## Need Help?

If you run into issues:
1. Check the error message in Supabase
2. Make sure you copied the entire SQL file
3. Try running the test queries above
4. Check if tables already exist

---

**That's it!** Once you run the SQL migration, the credit system is live! 🎉
