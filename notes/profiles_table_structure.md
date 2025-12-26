# Profiles Table Structure

Based on the Supabase query results, the profiles table has the following columns:

| Column Name | Data Type | Nullable |
|-------------|-----------|----------|
| id | uuid | NO |
| email | text | YES |
| display_name | text | YES |
| avatar_url | text | YES |
| subscription_status | text | YES |
| subscription_... | text | YES |
| subscription_... | timestamp | YES |
| subscription_... | timestamp | YES |
| stripe_customer_id | text | YES |
| stripe_subscription_id | text | YES |
| day_pass_balance | integer | YES |
| day_pass_expires_at | timestamp | YES |

## Issue Found

The profiles table does NOT have an `is_admin` column! The admin badge functionality in the UI is checking for `profile?.is_admin` but this column doesn't exist in the database.

## Solution

Need to add `is_admin` column to the profiles table:

```sql
ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
```

Then set the admin user:

```sql
UPDATE profiles SET is_admin = TRUE WHERE email = 'go4me1@gmail.com';
```
