# Morgus - Autonomous Agent Platform

🚀 **Production Status**: LIVE AND OPERATIONAL

## Live Deployment

- **Frontend**: https://325a65ac.morgus-console.pages.dev/
- **Backend**: https://morgus-deploy.fly.dev/
- **Database**: Supabase PostgreSQL with pgvector

## Features

### Core Platform
- Multi-model AI chat with MOE (Mixture of Experts) system
- Custom AI agent creation (Morgys)
- Real-time streaming responses
- File upload and processing
- Voice input/output
- Deep research mode
- NotebookLM integration

### Marketplace
- Browse and purchase custom Morgys
- List your own Morgys for sale
- **Approval workflow** for new listings
- Revenue sharing for creators
- Ratings and reviews

### Billing & Subscriptions
- 4 pricing tiers: Free, Pro, Business, Enterprise
- Stripe integration for payments
- **Usage tracking and cost calculation** in credits
- **Monthly quota management**
- Subscription management

### Knowledge Base
- **File uploads** (PDF, TXT, MD, DOCX) for knowledge sources
- **URL scraping** and text input
- **Automatic chunking** for RAG
- Secure and scalable knowledge management

### API & Integrations
- **API Key Management**: Securely generate, manage, and revoke API keys
- **Scoped Permissions**: Control API key access to specific resources
- **MCP Export**: Export Morgys as Claude Desktop MCP servers
- **Usage Tracking**: Monitor API usage and costs

### Security & Stability
- **Authentication**: JWT and API key authentication with Supabase
- **Rate Limiting**: Tier-based rate limiting to prevent abuse
- **Security Headers**: CSP, XSS protection, and other security headers
- **Input Validation**: Strict validation on all API inputs
- **Error Handling**: Centralized error handling and logging
- **CORS**: Secure cross-origin resource sharing configuration

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite build tool
- TailwindCSS
- Supabase Auth
- Cloudflare Pages

### Backend
- Node.js 22 + TypeScript
- Express.js
- Supabase (PostgreSQL + pgvector)
- Stripe payments
- **bcrypt** for API key hashing
- Fly.io deployment

## Project Structure

```
morgus-agent/
├── console/              # Frontend React app
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── lib/          # Utilities and services
│   │   └── App.tsx       # Main app component
│   └── dist/             # Build output
├── dppm-service/         # Backend API
│   ├── src/
│   │   ├── index.ts      # Main server
│   │   ├── middleware/   # Auth, rate limiting, security
│   │   ├── *-routes.ts   # API route handlers
│   │   └── *-service.ts  # Business logic services
│   └── Dockerfile        # Container config
└── README.md
```

## Development

### Frontend
```bash
cd console
npm install
npm run dev
```

### Backend
```bash
cd dppm-service
npm install
npm run dev
```

## Deployment

### Frontend (Cloudflare Pages)
```bash
cd console
npm run build
npx wrangler pages deploy dist --project-name=morgus-console
```

### Backend (Fly.io)
```bash
cd dppm-service
flyctl auth login
flyctl deploy --ha=false
```

## Environment Variables

### Frontend (.env)
```
VITE_SUPABASE_URL=https://dnxqgphaisdxvdyeiwnh.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=https://morgus-deploy.fly.dev
```

### Backend (fly.toml)
```
SUPABASE_URL=https://dnxqgphaisdxvdyeiwnh.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

## API Endpoints

### Knowledge Base
- `POST /api/knowledge-base/:morgyId/sources` - Add knowledge source (file, URL, text)
- `GET /api/knowledge-base/:morgyId/sources` - List knowledge sources
- `GET /api/knowledge-base/sources/:sourceId` - Get a specific source
- `PUT /api/knowledge-base/sources/:sourceId` - Update a source
- `DELETE /api/knowledge-base/sources/:sourceId` - Delete a source

### MCP Export
- `POST /api/morgys/:morgyId/mcp-export` - Create MCP export
- `GET /api/mcp-exports/:shareId` - Download MCP configuration
- `GET /api/morgys/:morgyId/mcp-exports` - List exports for a Morgy
- `DELETE /api/mcp-exports/:exportId` - Delete an export

### API Keys
- `POST /api/api-keys` - Generate new API key
- `GET /api/api-keys` - List user's API keys
- `GET /api/api-keys/:keyId` - Get specific key details
- `PUT /api/api-keys/:keyId` - Update API key
- `DELETE /api/api-keys/:keyId` - Revoke API key

### Marketplace
- `POST /api/marketplace/listings` - Create a new listing (pending approval)
- `GET /api/marketplace/listings` - Browse listings with filters
- `GET /api/marketplace/listings/:id` - Get a single listing
- `PUT /api/marketplace/listings/:id` - Update a listing
- `DELETE /api/marketplace/listings/:id` - Delete a listing
- `POST /api/marketplace/listings/:id/approve` - Approve a listing (admin)
- `POST /api/marketplace/listings/:id/reject` - Reject a listing (admin)

## Contributing

This is a private project. For questions or issues, create a support ticket in the app.

## License

Proprietary - All rights reserved

---

**Version**: 2.6.0-backend-complete
**Last Updated**: December 27, 2025
**Status**: 🟢 Backend Complete, Ready for Frontend Integration
