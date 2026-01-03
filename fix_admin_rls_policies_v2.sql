-- Drop existing policies if they exist, then recreate them
-- This ensures we have the correct policies in place

-- Drop existing policies for promo_codes
DROP POLICY IF EXISTS "Admins can view all promo codes" ON promo_codes;
DROP POLICY IF EXISTS "Admins can insert promo codes" ON promo_codes;
DROP POLICY IF EXISTS "Admins can update promo codes" ON promo_codes;
DROP POLICY IF EXISTS "Admins can delete promo codes" ON promo_codes;

-- Drop existing admin policy for profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- Policy: Admins can view all promo codes
CREATE POLICY "Admins can view all promo codes"
ON promo_codes
FOR SELECT
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
ON profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles AS p
    WHERE p.id = auth.uid()
    AND p.is_admin = true
  )
);

-- Policy: Admins can insert promo codes
CREATE POLICY "Admins can insert promo codes"
ON promo_codes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Policy: Admins can update promo codes
CREATE POLICY "Admins can update promo codes"
ON promo_codes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Policy: Admins can delete promo codes
CREATE POLICY "Admins can delete promo codes"
ON promo_codes
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Policy: Admins can update any profile
CREATE POLICY "Admins can update any profile"
ON profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles AS p
    WHERE p.id = auth.uid()
    AND p.is_admin = true
  )
);
