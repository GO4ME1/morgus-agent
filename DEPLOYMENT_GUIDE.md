# Morgus Platform Deployment Guide

This guide provides comprehensive instructions for deploying the Morgus autonomous agent platform, including the frontend, backend, and all required services.

## 1. Prerequisites

Before you begin, ensure you have accounts with the following services:

- **Supabase**: For the PostgreSQL database, authentication, and object storage.
- **Fly.io**: For hosting the Node.js backend service.
- **Cloudflare**: For hosting the React frontend and managing DNS.
- **Stripe**: For payment processing and subscriptions.
- **GitHub**: For source code management and version control.

## 2. Database Setup (Supabase)

### 2.1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Name your project (e.g., `morgus-platform`).
3. Generate a strong database password and save it securely.
4. Choose a region closest to your users.

### 2.2. Run Database Migrations

All database tables are managed via migration scripts in the `dppm-service/migrations` directory. Apply these migrations to your Supabase project using the SQL Editor.

1. In your Supabase project, navigate to the **SQL Editor**.
2. Create a new query.
3. Copy the contents of all SQL files from the `dppm-service/migrations` directory and paste them into the query editor.
4. Run the query to create all 12 tables and their schemas.

### 2.3. Get Supabase Credentials

Navigate to **Project Settings > API** in your Supabase dashboard and copy the following values:

- **Project URL**: `https://<your-project-id>.supabase.co`
- **Project API Keys > `anon` `public`**: Your public-facing anonymous key.
- **Project API Keys > `service_role` `secret`**: Your backend service role key.

## 3. Backend Deployment (Fly.io)

### 3.1. Install Fly.io CLI

Install the Fly.io command-line interface by following the instructions at [fly.io/docs/hands-on/install-flyctl/](https://fly.io/docs/hands-on/install-flyctl/).

### 3.2. Authenticate with Fly.io

```bash
fly auth login
```

### 3.3. Configure Backend Environment

Navigate to the `dppm-service` directory and set the following secrets. These are injected as environment variables in your Fly.io application.

```bash
cd morgus-agent/dppm-service

# Supabase Credentials
fly secrets set SUPABASE_URL="https://<your-project-id>.supabase.co"
fly secrets set SUPABASE_SERVICE_KEY="your_supabase_service_role_key"

# Stripe Credentials
fly secrets set STRIPE_SECRET_KEY="your_stripe_secret_key"
fly secrets set STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret"

# API Base URL
fly secrets set API_BASE_URL="https://<your-fly-app-name>.fly.dev"
```

### 3.4. Deploy the Backend

Deploy the backend application to Fly.io. The `--ha=false` flag is recommended for development and staging environments to minimize costs.

```bash
fly deploy --ha=false
```

After deployment, verify the backend is running correctly by checking the health endpoint:

```
https://<your-fly-app-name>.fly.dev/health
```

## 4. Frontend Deployment (Cloudflare Pages)

### 4.1. Configure Frontend Environment

Create a `.env` file in the `morgus-console` directory with the following variables:

```
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=https://<your-fly-app-name>.fly.dev
```

### 4.2. Deploy to Cloudflare Pages

1. Log in to your Cloudflare dashboard.
2. Go to **Workers & Pages** and create a new application.
3. Connect your GitHub account and select the `morgus-agent` repository.
4. Configure the build settings:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `/dist`
   - **Root directory**: `morgus-console`
5. Add the environment variables from your `.env` file in the project settings.
6. Click **Save and Deploy**.

## 5. Security Configuration

### 5.1. CORS Origins

The backend is configured with a strict CORS policy. Ensure your frontend URL is added to the `allowedOrigins` array in `dppm-service/src/middleware/security.ts` if you are using a custom domain.

### 5.2. API Key Hashing

API keys are securely hashed using **bcrypt**. The hashing salt rounds are configured in `dppm-service/src/api-key-routes.ts`.

### 5.3. Rate Limiting

Rate limits are configured by user tier in `dppm-service/src/middleware/rate-limiting.ts`. You can adjust the limits for `free`, `pro`, and `enterprise` tiers as needed.

## 6. Next Steps: Frontend Integration

With the backend deployed, the next critical step is to connect the frontend components to the live API endpoints. This involves:

1. **Authentication**: Implement user login, signup, and session management using the Supabase Auth client and the backend's authentication middleware.
2. **API Calls**: Replace all mock data in the frontend dashboards (Billing, Analytics, Support, Marketplace) with real API calls to the newly deployed backend.
3. **Error Handling**: Add robust error handling and loading states to all frontend components that interact with the API.
4. **End-to-End Testing**: Thoroughly test all user flows, from creating a Morgy to purchasing one in the marketplace, to ensure the platform is stable and reliable.

---

**Version**: 1.0.0
**Last Updated**: December 27, 2025
