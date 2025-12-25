# Morgus Console Development Rules

To ensure stability and prevent conflicting deployments, all future UI/UX development for the Morgus Console must follow the **Desktop-First Development Strategy**.

## 1. Desktop-First Implementation

- **All new features or changes must be implemented and tested on the desktop version first.**
- The desktop version is the primary development target.
- Ensure all desktop features are fully functional and stable before proceeding to mobile.

## 2. Verify Desktop Version

- Before making any mobile changes, deploy the desktop version to a preview environment.
- Thoroughly test all features and functionality on multiple desktop browsers.
- Get confirmation from the user that the desktop version is working as expected.

## 3. Batch Changes for Mobile

- Once the desktop version is approved, create a separate branch for mobile changes.
- **Do not mix desktop and mobile changes in the same commit.**
- Apply all necessary mobile-specific styles and layout adjustments in this branch.

## 4. Verify Mobile Version

- Deploy the mobile branch to a separate preview environment.
- Test thoroughly on multiple mobile devices and screen sizes.
- Get confirmation from the user that the mobile version is working as expected.

## 5. Merge and Deploy to Production

- Once both desktop and mobile versions are approved, merge the mobile branch into the `main` branch.
- This will trigger an automatic deployment to production.
- Verify that both desktop and mobile are working correctly on the production URL.

By following this process, we can avoid the issues we encountered with conflicting deployments and ensure a stable and consistent user experience across all devices.
