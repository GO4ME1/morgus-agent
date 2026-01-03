# Admin User Information

## Current Admin User
- **Email**: mross07@gmail.com
- **is_admin**: TRUE
- **Status**: This is the only admin user in the system

## Other Users (Non-Admin)
1. final.working.test.jan01@example.com - is_admin: FALSE
2. trumpducky45@gmail.com - is_admin: FALSE  
3. lawyers@go4me.ai - is_admin: FALSE

## Next Steps
Since we don't have the password for mross07@gmail.com, we have two options:
1. Create a new admin user with known credentials
2. Update an existing user to be admin and reset their password

## RLS Policies Status
- Policies "Admins can view all promo codes" and "Admins can view all profiles" already exist
- These policies allow users with is_admin=true to SELECT all rows from promo_codes and profiles tables
