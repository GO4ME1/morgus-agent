-- Create RLS policies for admin access to promo_codes and profiles

-- Policy: Admins can view all promo codes
CREATE POLICY "Admins can view all promo codes"
ON promo_codes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles AS p
    WHERE p.id = auth.uid() 
    AND p.is_admin = true
  )
);
