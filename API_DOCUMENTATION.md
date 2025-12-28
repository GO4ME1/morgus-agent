# Morgy Creator API Documentation

## Base URL
```
Production: https://morgus-deploy.fly.dev
Development: http://localhost:8080
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Morgy Management

### Create Morgy
Create a new custom Morgy.

**Endpoint:** `POST /api/morgys`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Marketing Maven",
  "description": "Expert marketing strategist specializing in social media and content marketing",
  "category": "business",
  "tags": ["marketing", "social-media", "strategy", "content"],
  "aiConfig": {
    "primaryModel": "gpt-4",
    "temperature": 0.7,
    "maxTokens": 2000,
    "systemPrompt": "You are a marketing expert...",
    "fallbackModels": ["gpt-3.5-turbo"]
  },
  "personality": {
    "tone": "professional",
    "verbosity": "balanced",
    "emojiUsage": "minimal",
    "responseStyle": "Clear and actionable advice"
  },
  "appearance": {
    "avatar": "📊",
    "color": "#8B5CF6",
    "icon": "chart"
  },
  "capabilities": {
    "webSearch": true,
    "codeExecution": false,
    "fileProcessing": true,
    "imageGeneration": false,
    "voiceInteraction": false,
    "mcpTools": []
  },
  "knowledgeBase": {
    "documents": [],
    "urls": ["https://example.com/marketing-guide"],
    "customData": "Additional training data..."
  },
  "marketplace": {
    "isPublic": true,
    "licenseType": "paid",
    "price": 9.99,
    "isPremium": false
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "morgy": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Marketing Maven",
    "description": "Expert marketing strategist...",
    "category": "business",
    "tags": ["marketing", "social-media"],
    "creatorId": "user-id-here",
    "aiConfig": {...},
    "personality": {...},
    "appearance": {...},
    "capabilities": {...},
    "knowledgeBase": {...},
    "isPublic": true,
    "licenseType": "paid",
    "price": 9.99,
    "isPremium": false,
    "stats": {
      "totalPurchases": 0,
      "totalRevenue": 0,
      "rating": 0,
      "reviewCount": 0,
      "viewCount": 0
    },
    "createdAt": "2025-12-27T12:00:00Z",
    "updatedAt": "2025-12-27T12:00:00Z"
  }
}
```

---

### List User's Morgys
Get all Morgys created by a specific user.

**Endpoint:** `GET /api/morgys/user/:userId`

**Authentication:** Required

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Items per page
- `status` (string) - Filter by status: "all", "public", "private"

**Response:** `200 OK`
```json
{
  "success": true,
  "morgys": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Marketing Maven",
      "description": "Expert marketing strategist...",
      "category": "business",
      "tags": ["marketing"],
      "appearance": {
        "avatar": "📊",
        "color": "#8B5CF6"
      },
      "isPublic": true,
      "licenseType": "paid",
      "price": 9.99,
      "totalPurchases": 45,
      "totalRevenue": 314.55,
      "rating": 4.8,
      "reviewCount": 12,
      "createdAt": "2025-12-27T12:00:00Z",
      "updatedAt": "2025-12-27T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

---

### Get Morgy Details
Get complete details of a specific Morgy.

**Endpoint:** `GET /api/morgys/:morgyId`

**Authentication:** Optional (affects returned data)

**Response:** `200 OK`
```json
{
  "success": true,
  "morgy": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Marketing Maven",
    "description": "Expert marketing strategist...",
    "category": "business",
    "tags": ["marketing", "social-media"],
    "creator": {
      "id": "creator-user-id",
      "name": "John Doe"
    },
    "aiConfig": {...},
    "personality": {...},
    "appearance": {...},
    "capabilities": {...},
    "knowledgeBase": {...},  // Only if owner or purchased
    "isPublic": true,
    "licenseType": "paid",
    "price": 9.99,
    "isPremium": false,
    "stats": {
      "totalPurchases": 45,
      "totalRevenue": 314.55,
      "rating": 4.8,
      "reviewCount": 12,
      "viewCount": 1235
    },
    "isOwner": false,
    "hasPurchased": false,
    "createdAt": "2025-12-27T12:00:00Z",
    "updatedAt": "2025-12-27T12:00:00Z",
    "publishedAt": "2025-12-27T12:00:00Z"
  }
}
```

---

### Update Morgy
Update an existing Morgy.

**Endpoint:** `PUT /api/morgys/:morgyId`

**Authentication:** Required (must be owner)

**Request Body:** Same as Create Morgy (partial updates allowed)

**Response:** `200 OK`
```json
{
  "success": true,
  "morgy": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Marketing Maven Pro",
    ...
    "updatedAt": "2025-12-27T13:00:00Z"
  }
}
```

---

### Delete Morgy
Delete (soft delete) a Morgy.

**Endpoint:** `DELETE /api/morgys/:morgyId`

**Authentication:** Required (must be owner)

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Morgy deleted successfully"
}
```

**Error:** `400 Bad Request` (if active subscriptions exist)
```json
{
  "success": false,
  "error": "Cannot delete Morgy with active subscriptions. Please cancel all subscriptions first."
}
```

---

## Marketplace

### Browse Marketplace
Browse public Morgys with filtering, searching, and sorting.

**Endpoint:** `GET /api/marketplace/morgys`

**Authentication:** Optional

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)
- `category` (string) - Filter by category
- `licenseType` (string) - Filter by license type: "free", "paid", "subscription"
- `minPrice` (number, default: 0)
- `maxPrice` (number, default: 999.99)
- `sortBy` (string) - Sort by: "popular", "newest", "rating", "price_low", "price_high"
- `search` (string) - Search in name and description
- `tags` (string) - Comma-separated tags to filter by

**Example Request:**
```
GET /api/marketplace/morgys?category=business&sortBy=popular&page=1&limit=20
```

**Response:** `200 OK`
```json
{
  "success": true,
  "morgys": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Marketing Maven",
      "description": "Expert marketing strategist...",
      "category": "business",
      "tags": ["marketing", "social-media"],
      "creator": {
        "id": "creator-id",
        "name": "John Doe"
      },
      "appearance": {
        "avatar": "📊",
        "color": "#8B5CF6"
      },
      "licenseType": "paid",
      "price": 9.99,
      "isPremium": false,
      "stats": {
        "totalPurchases": 45,
        "rating": 4.8,
        "reviewCount": 12
      },
      "createdAt": "2025-12-27T12:00:00Z"
    }
  ],
  "filters": {
    "categories": ["business", "social", "research", "technical", "creative", "custom"],
    "priceRange": {
      "min": 0,
      "max": 99.99
    }
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  }
}
```

---

### Purchase Morgy
Purchase a Morgy with a one-time payment.

**Endpoint:** `POST /api/marketplace/morgys/:morgyId/purchase`

**Authentication:** Required

**Request Body:**
```json
{
  "paymentMethodId": "pm_1234567890abcdef"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "purchase": {
    "id": "purchase-id",
    "morgyId": "550e8400-e29b-41d4-a716-446655440000",
    "purchaseType": "one_time",
    "price": 9.99,
    "platformFee": 3.00,
    "creatorRevenue": 6.99,
    "paymentStatus": "completed",
    "createdAt": "2025-12-27T12:00:00Z"
  },
  "morgy": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Marketing Maven",
    "description": "Expert marketing strategist...",
    "appearance": {...}
  }
}
```

**Error Responses:**
- `400 Bad Request` - Already own this Morgy
- `404 Not Found` - Morgy not found or not available
- `400 Bad Request` - Payment failed

---

### Subscribe to Morgy
Subscribe to a Morgy with monthly billing.

**Endpoint:** `POST /api/marketplace/morgys/:morgyId/subscribe`

**Authentication:** Required

**Request Body:**
```json
{
  "paymentMethodId": "pm_1234567890abcdef"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "subscription": {
    "id": "subscription-id",
    "morgyId": "550e8400-e29b-41d4-a716-446655440000",
    "purchaseType": "subscription",
    "price": 9.99,
    "subscriptionStatus": "active",
    "subscriptionStart": "2025-12-27T12:00:00Z",
    "subscriptionEnd": "2026-01-27T12:00:00Z",
    "stripeSubscriptionId": "sub_1234567890abcdef"
  }
}
```

---

### Cancel Subscription
Cancel an active subscription to a Morgy.

**Endpoint:** `POST /api/marketplace/morgys/:morgyId/cancel-subscription`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Subscription cancelled. You will have access until 2026-01-27"
}
```

---

## Revenue & Payouts

### Get Creator Revenue
Get detailed revenue breakdown for a creator.

**Endpoint:** `GET /api/creators/:creatorId/revenue`

**Authentication:** Required (must be creator or admin)

**Query Parameters:**
- `startDate` (string, ISO date) - Filter start date
- `endDate` (string, ISO date) - Filter end date
- `morgyId` (string) - Filter by specific Morgy

**Response:** `200 OK`
```json
{
  "success": true,
  "revenue": {
    "totalRevenue": 6993.00,
    "platformFees": 2997.00,
    "netRevenue": 4896.00,
    "pendingPayout": 1234.56,
    "paidOut": 3661.44,
    "breakdown": [
      {
        "morgyId": "550e8400-e29b-41d4-a716-446655440000",
        "morgyName": "Marketing Maven",
        "totalSales": 45,
        "revenue": 314.55
      }
    ],
    "recentTransactions": [
      {
        "id": "transaction-id",
        "morgyId": "550e8400-e29b-41d4-a716-446655440000",
        "morgyName": "Marketing Maven",
        "buyerId": "buyer-id",
        "amount": 9.99,
        "creatorRevenue": 6.99,
        "date": "2025-12-27T12:00:00Z"
      }
    ]
  }
}
```

---

### Request Payout
Request a payout of earned revenue.

**Endpoint:** `POST /api/creators/:creatorId/request-payout`

**Authentication:** Required (must be creator)

**Request Body:**
```json
{
  "amount": 1234.56
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "payout": {
    "id": "payout-id",
    "amount": 1234.56,
    "status": "pending",
    "estimatedArrival": "2025-12-30T12:00:00Z"
  }
}
```

**Error:** `400 Bad Request`
```json
{
  "success": false,
  "error": "Minimum payout amount is $50"
}
```

---

### Get Payout History
Get history of all payouts for a creator.

**Endpoint:** `GET /api/creators/:creatorId/payouts`

**Authentication:** Required (must be creator or admin)

**Response:** `200 OK`
```json
{
  "success": true,
  "payouts": [
    {
      "id": "payout-id",
      "amount": 1234.56,
      "periodStart": "2025-11-01",
      "periodEnd": "2025-11-30",
      "status": "paid",
      "createdAt": "2025-12-01T12:00:00Z",
      "paidAt": "2025-12-03T12:00:00Z"
    }
  ],
  "summary": {
    "totalPaid": 10000.00,
    "pendingAmount": 1234.56,
    "nextPayoutDate": "2026-01-01"
  }
}
```

---

## Analytics

### Get Morgy Analytics
Get performance analytics for a specific Morgy.

**Endpoint:** `GET /api/morgys/:morgyId/analytics`

**Authentication:** Required (must be creator)

**Query Parameters:**
- `startDate` (string, ISO date) - Filter start date
- `endDate` (string, ISO date) - Filter end date
- `metric` (string) - Specific metric: "views", "purchases", "revenue", "messages"

**Response:** `200 OK`
```json
{
  "success": true,
  "analytics": {
    "summary": {
      "totalViews": 1234,
      "totalPurchases": 45,
      "totalRevenue": 314.55,
      "avgRating": 4.8,
      "conversionRate": 3.65
    },
    "timeSeries": [
      {
        "date": "2025-12-27",
        "views": 45,
        "purchases": 2,
        "revenue": 13.98
      }
    ],
    "topBuyers": [
      {
        "userId": "buyer-id",
        "purchaseDate": "2025-12-27T12:00:00Z"
      }
    ]
  }
}
```

---

### Get Creator Dashboard
Get dashboard statistics for a creator.

**Endpoint:** `GET /api/creators/:creatorId/dashboard`

**Authentication:** Required (must be creator or admin)

**Response:** `200 OK`
```json
{
  "success": true,
  "dashboard": {
    "totalMorgys": 5,
    "publicMorgys": 3,
    "totalSales": 120,
    "totalRevenue": 839.88,
    "avgRating": 4.7,
    "topMorgy": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Marketing Maven",
      "sales": 45,
      "revenue": 314.55
    },
    "recentActivity": [
      {
        "id": "activity-id",
        "morgyId": "550e8400-e29b-41d4-a716-446655440000",
        "buyerId": "buyer-id",
        "amount": 9.99,
        "date": "2025-12-27T12:00:00Z"
      }
    ]
  }
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "You do not have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Data Types

### Category Enum
- `business`
- `social`
- `research`
- `technical`
- `creative`
- `custom`

### License Type Enum
- `free` - No payment required
- `paid` - One-time payment
- `subscription` - Monthly subscription

### Payment Status Enum
- `pending` - Payment initiated
- `completed` - Payment successful
- `failed` - Payment failed
- `refunded` - Payment refunded

### Subscription Status Enum
- `active` - Subscription active
- `cancelled` - Subscription cancelled (access until period end)
- `expired` - Subscription expired

### Payout Status Enum
- `pending` - Payout requested
- `processing` - Payout being processed
- `paid` - Payout completed
- `failed` - Payout failed

---

## Rate Limits

- **Create Morgy**: 10 per hour per user
- **Purchase**: 20 per hour per user
- **Browse**: 100 per hour per IP
- **Other endpoints**: 60 per hour per user

---

## Frontend Integration Examples

### Creating a Morgy
```typescript
async function createMorgy(morgyData: MorgyCreateData) {
  const response = await fetch('https://morgus-deploy.fly.dev/api/morgys', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify(morgyData)
  });
  
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error);
  }
  
  return result.morgy;
}
```

### Browsing Marketplace
```typescript
async function browseMarketplace(filters: MarketplaceFilters) {
  const params = new URLSearchParams({
    page: filters.page.toString(),
    limit: filters.limit.toString(),
    ...(filters.category && { category: filters.category }),
    ...(filters.sortBy && { sortBy: filters.sortBy }),
    ...(filters.search && { search: filters.search })
  });
  
  const response = await fetch(
    `https://morgus-deploy.fly.dev/api/marketplace/morgys?${params}`
  );
  
  const result = await response.json();
  return result;
}
```

### Purchasing a Morgy
```typescript
async function purchaseMorgy(morgyId: string, paymentMethodId: string) {
  const response = await fetch(
    `https://morgus-deploy.fly.dev/api/marketplace/morgys/${morgyId}/purchase`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ paymentMethodId })
    }
  );
  
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error);
  }
  
  return result.purchase;
}
```

### Getting Creator Revenue
```typescript
async function getCreatorRevenue(creatorId: string) {
  const response = await fetch(
    `https://morgus-deploy.fly.dev/api/creators/${creatorId}/revenue`,
    {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    }
  );
  
  const result = await response.json();
  return result.revenue;
}
```

---

## TypeScript Types

```typescript
interface Morgy {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'social' | 'research' | 'technical' | 'creative' | 'custom';
  tags: string[];
  creatorId: string;
  aiConfig: AIConfig;
  personality: Personality;
  appearance: Appearance;
  capabilities: Capabilities;
  knowledgeBase?: KnowledgeBase;
  isPublic: boolean;
  licenseType: 'free' | 'paid' | 'subscription';
  price: number;
  isPremium: boolean;
  stats: MorgyStats;
  isOwner?: boolean;
  hasPurchased?: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

interface AIConfig {
  primaryModel: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  fallbackModels: string[];
}

interface Personality {
  tone: string;
  verbosity: string;
  emojiUsage: string;
  responseStyle: string;
}

interface Appearance {
  avatar: string;
  color: string;
  icon: string;
}

interface Capabilities {
  webSearch: boolean;
  codeExecution: boolean;
  fileProcessing: boolean;
  imageGeneration: boolean;
  voiceInteraction: boolean;
  mcpTools: string[];
}

interface KnowledgeBase {
  documents: string[];
  urls: string[];
  customData: string;
}

interface MorgyStats {
  totalPurchases: number;
  totalRevenue: number;
  rating: number;
  reviewCount: number;
  viewCount: number;
}

interface Purchase {
  id: string;
  morgyId: string;
  purchaseType: 'one_time' | 'subscription';
  price: number;
  platformFee: number;
  creatorRevenue: number;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  subscriptionStatus?: 'active' | 'cancelled' | 'expired';
  subscriptionStart?: string;
  subscriptionEnd?: string;
  createdAt: string;
}

interface Revenue {
  totalRevenue: number;
  platformFees: number;
  netRevenue: number;
  pendingPayout: number;
  paidOut: number;
  breakdown: RevenueBreakdown[];
  recentTransactions: Transaction[];
}

interface RevenueBreakdown {
  morgyId: string;
  morgyName: string;
  totalSales: number;
  revenue: number;
}

interface Transaction {
  id: string;
  morgyId: string;
  morgyName?: string;
  buyerId: string;
  amount: number;
  creatorRevenue: number;
  date: string;
}
```

---

*Last Updated: December 27, 2025*
*API Version: 1.0*


---

## Knowledge Base

Manages knowledge sources for Morgys, including file uploads, URL scraping, and text input.

### Add Knowledge Source
Add a new knowledge source to a Morgy. Supports file upload, URL, or raw text.

**Endpoint:** `POST /api/knowledge-base/:morgyId/sources`

**Authentication:** Required

**Request Body:**
- **multipart/form-data:** `file` (PDF, TXT, MD, DOCX)
- **application/json:**
```json
{
  "url": "https://example.com/knowledge-article",
  "title": "Optional Title",
  "content": "(Required if URL scraping is not yet implemented)"
}
```
```json
{
  "text": "Raw text content to be added as a knowledge source.",
  "title": "Optional Title"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "knowledge": {
    "id": "knowledge-source-id",
    "morgy_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Example Knowledge Source",
    "source_type": "file",
    "metadata": {
      "filename": "example.pdf",
      "size": 123456
    },
    "created_at": "2025-12-27T14:00:00Z"
  },
  "message": "Knowledge source added successfully"
}
```

---

### List Knowledge Sources
Get a paginated list of all knowledge sources for a specific Morgy.

**Endpoint:** `GET /api/knowledge-base/:morgyId/sources`

**Authentication:** Required

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)

**Response:** `200 OK`
```json
{
  "success": true,
  "sources": [
    {
      "id": "knowledge-source-id",
      "title": "Example Knowledge Source",
      "source_type": "file",
      "created_at": "2025-12-27T14:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "total_pages": 1
  }
}
```

---

### Get Knowledge Source Details
Get the full details of a specific knowledge source.

**Endpoint:** `GET /api/knowledge-base/sources/:sourceId`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "success": true,
  "source": {
    "id": "knowledge-source-id",
    "morgy_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Example Knowledge Source",
    "content": "The full text content of the knowledge source...",
    "source_type": "file",
    "source_url": null,
    "metadata": {},
    "created_at": "2025-12-27T14:00:00Z"
  }
}
```

---

### Update Knowledge Source
Update the title or content of a knowledge source.

**Endpoint:** `PUT /api/knowledge-base/sources/:sourceId`

**Authentication:** Required (must be owner)

**Request Body:**
```json
{
  "title": "Updated Knowledge Source Title",
  "content": "Updated content..."
}
```

**Response:** `200 OK`

---

### Delete Knowledge Source
Delete a knowledge source.

**Endpoint:** `DELETE /api/knowledge-base/sources/:sourceId`

**Authentication:** Required (must be owner)

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Knowledge source deleted successfully"
}
```

---

## MCP Export

Export Morgys as Claude Desktop MCP servers.

### Create MCP Export
Create a new MCP export for a Morgy.

**Endpoint:** `POST /api/morgys/:morgyId/mcp-export`

**Authentication:** Required

**Request Body:**
```json
{
  "include_knowledge": true,
  "include_templates": true,
  "user_id": "user-id-here"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "export": {
    "id": "export-id",
    "share_url": "https://morgus-deploy.fly.dev/api/mcp-exports/some-share-id"
  },
  "instructions": {
    "message": "Add this MCP server to your Claude Desktop config",
    "config_example": {
      "mcpServers": {
        "morgy-name": {
          "command": "npx",
          "args": ["-y", "@modelcontextprotocol/server-fetch", "share-url-here"]
        }
      }
    }
  }
}
```

---

### Download MCP Configuration
Download the MCP-compliant JSON configuration for a shared Morgy.

**Endpoint:** `GET /api/mcp-exports/:shareId`

**Authentication:** None (public)

**Response:** `200 OK` (MCP JSON)

---

## API Key Management

Manage API keys for programmatic access to the Morgus platform.

### Create API Key
Generate a new API key with specified scopes.

**Endpoint:** `POST /api/api-keys`

**Authentication:** Required

**Request Body:**
```json
{
  "user_id": "user-id-here",
  "name": "My New API Key",
  "scopes": ["morgys:read", "marketplace:read"],
  "expires_in_days": 30
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "api_key": {
    "id": "key-id",
    "key": "morg_..." 
  },
  "warning": "Save this API key now. You will not be able to see it again!"
}
```

---

### List API Keys
Get a list of all API keys for the authenticated user.

**Endpoint:** `GET /api/api-keys`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "success": true,
  "api_keys": [
    {
      "id": "key-id",
      "name": "My New API Key",
      "key_prefix": "morg_...",
      "scopes": ["morgys:read"],
      "status": "active"
    }
  ]
}
```

---

## Enhanced Marketplace

### Submit Listing for Approval
Create a new marketplace listing. It will start in `pending` status.

**Endpoint:** `POST /api/marketplace/listings`

**Authentication:** Required

**Request Body:**
```json
{
  "morgy_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "My Awesome Morgy",
  "description": "This Morgy does amazing things.",
  "price": 19.99,
  "pricing_model": "one_time",
  "category": "creative",
  "tags": ["art", "design"]
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "listing": { ... },
  "message": "Listing created and pending approval"
}
```

---

### Approve or Reject Listing (Admin)

**Endpoint:** `POST /api/marketplace/listings/:id/approve`
**Endpoint:** `POST /api/marketplace/listings/:id/reject`

**Authentication:** Required (Admin role)

**Response:** `200 OK`
