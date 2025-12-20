# 🌌 Morgus Full-Stack App Development Skill v2.0

## 🚀 Overview

This skill provides a comprehensive framework for building robust, scalable, and secure full-stack applications. It goes beyond basic CRUD and covers the entire lifecycle of a modern web application, from database design to deployment and maintenance.

**The Morgus Philosophy:** We build applications that are not just functional but also delightful to use. We combine powerful backend architecture with a seamless frontend experience to create products that users love.

---

## 🏗️ The Modern Full-Stack Architecture

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | Vite + React + TypeScript + TailwindCSS | A modern, performant, and type-safe stack for building beautiful user interfaces. |
| **Backend** | Drizzle ORM + MySQL/TiDB | A powerful and scalable database solution with a type-safe ORM for easy and secure database access. |
| **Authentication** | Manus-Oauth | A secure and easy-to-use authentication solution that handles user management and social logins. |
| **Deployment** | Cloudflare Pages (Frontend) & Fly.io (Backend) | A globally distributed and scalable deployment solution for both the frontend and backend. |

---

## 🗺️ The Development Roadmap

### Phase 1: Project Scaffolding

1.  **Initialize the Project:**
    *   Use `webdev_init_project` with the `web-db-user` scaffold. This will set up the entire project structure with all the necessary dependencies and configurations.

### Phase 2: Database Design

1.  **Define the Schema:**
    *   Identify the data models for your application (e.g., users, posts, comments).
    *   Define the relationships between them (one-to-one, one-to-many, many-to-many).
2.  **Write the Drizzle Schema:**
    *   Use Drizzle's TypeScript-based schema definition to create your database tables.
    *   Example:
        ```typescript
        import { mysqlTable, serial, text, varchar } from "drizzle-orm/mysql-core";

        export const users = mysqlTable("users", {
          id: serial("id").primaryKey(),
          fullName: text("full_name"),
          phone: varchar("phone", { length: 256 }),
        });
        ```

### Phase 3: Backend Development

1.  **Create the API Endpoints:**
    *   Use a framework like Express or Hono to create your API endpoints.
    *   Use Drizzle to interact with the database in a type-safe way.
2.  **Implement Authentication:**
    *   Use the Manus-Oauth library to handle user registration, login, and session management.
3.  **Business Logic:**
    *   Implement the core business logic of your application.

### Phase 4: Frontend Development

1.  **Build the UI Components:**
    *   Create reusable React components for your application's UI.
2.  **Connect to the Backend:**
    *   Use a library like `axios` or `fetch` to make API calls to your backend.
3.  **State Management:**
    *   Use a state management library like Zustand or Redux Toolkit to manage your application's state.

### Phase 5: Deployment

1.  **Deploy the Backend:**
    *   Use `flyctl` to deploy your backend to Fly.io.
2.  **Deploy the Frontend:**
    *   Use `wrangler pages deploy` to deploy your frontend to Cloudflare Pages.

---

## 🔒 Security Best Practices

*   **Input Validation:** Always validate user input on both the frontend and backend.
*   **SQL Injection Prevention:** Use an ORM like Drizzle to prevent SQL injection attacks.
*   **Cross-Site Scripting (XSS) Prevention:** Sanitize user-generated content before rendering it in the browser.
*   **Authentication & Authorization:** Use a secure authentication solution like Manus-Oauth and implement proper authorization checks.

---

## ✨ The Morgus Flair: Advanced Features

*   **Real-time Updates:** Use WebSockets or a service like Pusher to provide real-time updates to your users.
*   **Background Jobs:** Use a queueing system like BullMQ to run background jobs for long-running tasks.
*   **Email & Notifications:** Integrate with an email service like SendGrid or a notification service like OneSignal to send emails and push notifications.

---

## 📚 Resources & References

*   [Drizzle ORM Documentation](https://orm.drizzle.team/)
*   [Fly.io Documentation](https://fly.io/docs/)
*   [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
*   [OWASP Top 10](https://owasp.org/www-project-top-ten/)
