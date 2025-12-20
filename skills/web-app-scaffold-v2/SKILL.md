# 🏗️ Morgus Web App Scaffold Skill v2.0

## 🌟 Overview

This skill empowers Morgus to build production-grade, full-stack web applications from a single prompt. It combines a modern, best-practices tech stack with a seamless, AI-driven workflow to take your ideas from concept to reality in record time.

**The Morgus Philosophy:** We don't just build apps; we build businesses. This skill is designed to create robust, scalable, and secure applications that can grow with your vision.

---

## 🔮 The Morgus Touch: Core Principles

| Principle | Description |
|---|---|
| **Production-Ready from Day One** | We build with the end in mind. Every app is built on a foundation of best practices for performance, security, and scalability. |
| **You Own the Code** | Morgus generates clean, readable, and maintainable code that you can extend and customize at any time. |
| **Seamless End-to-End Workflow** | From database design to deployment, Morgus handles the entire process, so you can focus on what matters most: your users. |
| **AI-Powered, Human-Guided** | Morgus is your AI software engineer, but you are the architect. You have full control over the final product. |

---

## 🛠️ The Modern Full-Stack Architecture

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | Vite + React + TypeScript + TailwindCSS | A modern, performant, and type-safe stack for building beautiful, responsive user interfaces. |
| **Backend** | Supabase Edge Functions | Serverless functions that run close to the user for low-latency, high-performance backend logic. |
| **Database** | Supabase (PostgreSQL) | A robust, scalable, and open-source SQL database with a generous free tier. |
| **ORM** | Drizzle ORM | A lightweight, type-safe SQL ORM that makes database access a breeze. |
| **Authentication** | Supabase Auth | Secure, built-in user authentication with support for email/password, social logins, and more. |

---

## 🗺️ The Build Process: A Step-by-Step Guide

### Phase 1: Project Initialization

1.  **Start with a clear prompt:** Describe the application you want to build in as much detail as possible.
    > "Build me a full-stack application for a book club. It should have user accounts, a database of books, and the ability for users to leave reviews."
2.  **Use the `webdev_init_project` tool:** Morgus will use the `web-app-supabase` scaffold to create a new project with all the necessary configuration.

### Phase 2: Database Schema Design

1.  **Describe your data:** Tell Morgus what kind of information you need to store.
    > "I need a `books` table with columns for `title`, `author`, and `cover_image_url`. I also need a `reviews` table with columns for `book_id`, `user_id`, `rating`, and `comment`."
2.  **Morgus generates the SQL:** Morgus will generate the SQL schema and provide it to you.
3.  **Run the SQL in Supabase:** Copy the SQL and run it in the Supabase SQL Editor to create your tables.

### Phase 3: Authentication Setup

1.  **Request authentication:** Tell Morgus you want to add user accounts.
    > "Add user authentication with email/password and Google login."
2.  **Morgus handles the setup:** Morgus will add the necessary login, signup, and profile pages to your application and configure Supabase Auth.

### Phase 4: Backend Logic with Edge Functions

1.  **Describe the desired functionality:** Tell Morgus what you want the application to do.
    > "When a user submits a review, save it to the database and then recalculate the average rating for that book."
2.  **Morgus writes the Edge Function:** Morgus will create a Supabase Edge Function to handle the backend logic.

### Phase 5: Frontend Development

1.  **Build the UI with natural language:** Describe the user interface you want to create.
    > "Create a page that displays a grid of all the books in the database. Each book should show its cover image, title, and author. When a user clicks on a book, it should take them to a details page with the book's information and all of its reviews."
2.  **Morgus writes the React components:** Morgus will create the necessary React components and connect them to your backend.

### Phase 6: Deployment

1.  **Tell Morgus you're ready to deploy:**
    > "Deploy my application to production."
2.  **Morgus handles the rest:** Morgus will deploy your application to a scalable, global hosting platform.

---

## ✨ The Morgus Flair: Signature Elements

*   **AI-Powered Features:** Easily add AI capabilities to your application, such as a chatbot, a content generator, or a natural language search.
*   **Real-time Updates:** Build collaborative, real-time applications with Supabase's real-time capabilities.
*   **Stripe Integration:** Monetize your application with a seamless, AI-driven Stripe integration.

---

## 📚 Resources & References

*   Supabase Documentation: https://supabase.com/docs
*   Drizzle ORM Documentation: https://orm.drizzle.team/docs
*   React Documentation: https://react.dev/
*   TailwindCSS Documentation: https://tailwindcss.com/docs
*   Vite Documentation: https://vitejs.dev/
