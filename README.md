# Morgus - AI Agent Platform

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
- Revenue sharing for creators
- Ratings and reviews

### Billing & Subscriptions
- 4 pricing tiers: Free, Pro, Business, Enterprise
- Stripe integration for payments
- Usage tracking and limits
- Subscription management

### Analytics
- Platform-wide metrics (admin)
- User usage statistics
- Performance monitoring
- Revenue tracking

### Support
- Integrated ticketing system
- Priority levels and categories
- Admin management tools
- Audit logging

### MCP Export
- Export Morgys as Claude Desktop MCP servers
- Integration with Claude Desktop
- Tool definitions and schemas

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
flyctl deploy
```

## Environment Variables

### Frontend (.env)
```
VITE_SUPABASE_URL=https://dnxqgphaisdxvdyeiwnb.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=https://morgus-deploy.fly.dev
```

### Backend (fly.toml)
```
SUPABASE_URL=https://dnxqgphaisdxvdyeiwnb.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

## API Endpoints

### Billing
- `GET /api/billing/pricing` - Get pricing tiers
- `GET /api/billing/info` - Get subscription info
- `POST /api/billing/checkout` - Create checkout session
- `POST /api/billing/portal` - Customer portal

### Marketplace
- `GET /api/marketplace/browse` - Browse Morgys
- `POST /api/marketplace/create` - List Morgy
- `POST /api/marketplace/purchase` - Purchase Morgy

### Analytics
- `GET /api/analytics/platform` - Platform metrics
- `GET /api/analytics/user/:userId` - User analytics

### Support
- `GET /api/support/tickets` - List tickets
- `POST /api/support/tickets` - Create ticket
- `PATCH /api/support/tickets/:id` - Update ticket

### MCP
- `GET /api/mcp/export/:morgyId` - Export as MCP server

## Contributing

This is a private project. For questions or issues, create a support ticket in the app.

## License

Proprietary - All rights reserved

---

**Version**: 2.5.0-creator-economy  
**Last Updated**: December 27, 2025  
**Status**: 🟢 Production Ready
