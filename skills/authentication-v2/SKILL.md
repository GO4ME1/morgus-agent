# 🔒 Morgus Authentication & User Management Skill v2.0

## 🌟 Overview

This skill empowers Morgus to integrate secure, production-ready user authentication and management into any web application. It provides a seamless, AI-driven workflow that handles everything from user signup and login to social logins and role-based access control.

**The Morgus Philosophy:** We believe that user authentication should be simple, secure, and flexible. This skill is designed to remove the complexity of authentication, so you can focus on building great user experiences.

---

## 🔮 The Morgus Touch: Core Principles

| Principle | Description |
|---|---|
| **Secure by Default** | We use industry best practices for password hashing, session management, and data protection to keep your users safe. |
| **Flexible and Extensible** | We support a wide range of authentication methods, from email/password to social logins, and we make it easy to add new ones. |
| **Seamless User Experience** | We create a smooth, intuitive authentication experience that gets users into your application quickly and easily. |
| **You're in Control** | You have full control over your user data. We provide the tools to manage your users, but you own the data. |

---

## 🗺️ The Authentication Workflow

### Phase 1: Basic Setup

1.  **Tell Morgus you want to add authentication:**
    > "Add user authentication to my application."
2.  **Morgus sets up the basics:** Morgus will add the necessary login, signup, and profile pages to your application and configure Supabase Auth with email/password authentication.

### Phase 2: Social Logins

1.  **Tell Morgus which social logins you want to add:**
    > "Add Google and GitHub login to my application."
2.  **Morgus guides you through the setup:** Morgus will provide you with the necessary instructions to configure the OAuth providers in your Supabase dashboard.

### Phase 3: Role-Based Access Control (RBAC)

1.  **Define your user roles:**
    > "I need two user roles: `admin` and `member`. Admins should be able to do everything, while members should only be able to read content."
2.  **Morgus implements the RBAC:** Morgus will add the necessary logic to your application to enforce the specified roles and permissions.

### Phase 4: User Management

1.  **Morgus provides a user management dashboard:** You can view, edit, and delete users from a simple, intuitive dashboard.
2.  **You can also manage users programmatically:** Morgus can create scripts to perform bulk user operations, such as importing a list of users from a CSV file.

---

## ✨ The Morgus Flair: Signature Elements

*   **Magic Links:** Allow users to log in without a password by clicking a link in their email.
*   **Two-Factor Authentication (2FA):** Add an extra layer of security to your application with 2FA.
*   **Customizable Email Templates:** Customize the look and feel of your authentication emails to match your brand.

---

## 📚 Resources & References

*   Supabase Authentication Documentation: https://supabase.com/docs/guides/auth
*   NextAuth.js (for more advanced use cases): https://next-auth.js.org/
