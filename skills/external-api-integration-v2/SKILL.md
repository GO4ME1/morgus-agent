# 🔌 Morgus External API Integration Skill v2.0

## 🌟 Overview

This skill empowers Morgus to connect your web application to a vast ecosystem of external APIs, unlocking a world of possibilities for new features and functionality. It provides a seamless, AI-driven workflow that handles everything from API key management to data transformation and error handling.

**The Morgus Philosophy:** We believe that your application should be able to talk to the world. This skill is designed to make it easy to connect to any API, so you can build richer, more powerful applications.

---

## 🔮 The Morgus Touch: Core Principles

| Principle | Description |
|---|---|
| **Secure by Default** | We use best-in-class security practices to protect your API keys and other sensitive data. We never expose your secrets in the frontend code. |
| **Resilient and Reliable** | We build robust integrations that can handle API errors, rate limits, and other common issues gracefully. |
| **AI-Driven, Human-Approved** | Morgus acts as your personal integration specialist, but you have the final say. You can review and approve every step of the process. |
| **Infinitely Extensible** | We can connect to any API with a publicly available specification. If it has an API, Morgus can talk to it. |

---

## 🗺️ The API Integration Workflow

### Phase 1: API Discovery and Planning

1.  **Tell Morgus what you want to achieve:**
    > "I want to display the current weather in the user's location."
2.  **Morgus researches and recommends an API:** Morgus will research the best APIs for the job and recommend one to you, along with its documentation.

### Phase 2: API Key Management

1.  **Morgus prompts you for your API key:** Morgus will provide you with a secure way to enter your API key.
2.  **Morgus stores your API key securely:** Your API key will be stored as an encrypted secret in your Supabase project, and it will never be exposed in the frontend code.

### Phase 3: Backend Integration

1.  **Morgus creates a Supabase Edge Function:** Morgus will create a serverless function to handle the communication with the external API.
2.  **Morgus handles data transformation:** Morgus will transform the data from the external API into a format that is easy to use in your frontend application.

### Phase 4: Frontend Integration

1.  **Morgus creates the necessary UI:** Morgus will create the React components to display the data from the external API.
2.  **Morgus connects the frontend to the backend:** Morgus will wire up the frontend to the Supabase Edge Function to fetch the data.

---

## ✨ The Morgus Flair: Signature Elements

*   **Automatic OpenAPI/Swagger Import:** If an API has an OpenAPI (formerly Swagger) specification, Morgus can automatically import it to understand the API's capabilities and generate the necessary code.
*   **AI-Powered Data Mapping:** Morgus can intelligently map the data from an external API to your application's data model, even if the field names are different.
*   **Built-in Caching and Rate Limiting:** Morgus can automatically add caching and rate limiting to your API integrations to improve performance and reduce costs.

---

## 📚 Resources & References

*   Supabase Edge Functions Documentation: https://supabase.com/docs/guides/functions
*   OpenAPI Specification: https://www.openapis.org/
