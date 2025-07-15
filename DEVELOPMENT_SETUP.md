# Development Setup Guide

## Prerequisites

### Required Software

- **Node.js** 18+ and npm
- **Git** for version control
- **Auth0 Account** (free tier available)
- **Cloudflare Account** with Workers and D1 access

### Required Tools

```bash
# Install Wrangler CLI globally
npm install -g wrangler

# Verify installation
wrangler --version
```

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-username/specification-cloudflare-mcp.git
cd specification-cloudflare-mcp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Auth0

#### Create Auth0 Application

1. Go to [Auth0 Dashboard](https://manage.auth0.com)
2. Create new **Regular Web Application**
3. Note your credentials:
   - Domain: `your-tenant.auth0.com`
   - Client ID: `your-client-id`
   - Client Secret: `your-client-secret`

#### Configure Application Settings

```
Allowed Callback URLs:
http://localhost:8787/callback
https://your-worker.workers.dev/callback

Allowed Logout URLs:
http://localhost:8787
https://your-worker.workers.dev

Allowed Web Origins:
http://localhost:8787
https://your-worker.workers.dev
```

### 4. Set Up Cloudflare Resources

#### Create D1 Database

```bash
# Create production database
wrangler d1 create specifications-prod

# Note the database ID from output
# Update wrangler-auth0.toml with the database ID
```

#### Create KV Namespaces

```bash
# Create KV namespace for OAuth state
wrangler kv:namespace create "OAUTH_KV"

# Create KV namespace for MCP OAuth
wrangler kv:namespace create "SPECIFICATION_MCP_OAUTH"

# Update wrangler-auth0.toml with the namespace IDs
```

#### Run Database Migrations

```bash
# Run migrations in order
wrangler d1 execute specifications-prod --file=./migrations/0001_create_specifications_table.sql
wrangler d1 execute specifications-prod --file=./migrations/0002_add_user_isolation.sql
wrangler d1 execute specifications-prod --file=./migrations/0003_fix_version_column.sql
```

### 5. Configure Environment Variables

#### Update wrangler-auth0.toml

```toml
# Update with your Auth0 credentials
AUTH0_DOMAIN = "your-tenant.auth0.com"
AUTH0_CLIENT_ID = "your-client-id"
AUTH0_AUDIENCE = "urn:specification-mcp-server"

# Update with your database/KV IDs
[[d1_databases]]
binding = "DB"
database_name = "specifications-prod"
database_id = "your-database-id"

[[kv_namespaces]]
binding = "OAUTH_KV"
id = "your-oauth-kv-id"
```

#### Set Secrets

```bash
# Set Auth0 client secret
wrangler secret put AUTH0_CLIENT_SECRET
# Enter your Auth0 client secret when prompted
```

### 6. Local Development Server

#### Start Development Server

```bash
# Start local development server
wrangler dev -c wrangler-auth0.toml --port 8787

# Or use the npm script
npm run dev
```

#### Test Authentication Flow

1. Navigate to `http://localhost:8787/authorize`
2. Complete Auth0 authentication
3. Test MCP endpoints at `http://localhost:8787/mcp`

## Development Workflow

### Code Organization

```
src/
├── index-auth0-streamable.ts    # Main MCP server entry point
├── auth.ts                      # OAuth authentication logic
├── types.ts                     # TypeScript type definitions
└── param-utils.ts               # Parameter validation utilities
```

### Key Files to Modify

#### Adding New Tools

Edit `src/index-auth0-streamable.ts`:

```typescript
this.server.tool(
  "your_tool_name",
  "Description of your tool",
  {
    param1: z.string().describe("Parameter description"),
    param2: z.number().optional().describe("Optional parameter"),
  },
  async (args) => {
    // Authentication check
    if (!this.props?.claims?.sub) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: "Authentication required",
              message: "User must be authenticated",
            }),
          },
        ],
      };
    }

    // Your tool logic here
    // Always filter by user_id: this.props.claims.sub
  }
);
```

#### Modifying Authentication Flow

Edit `src/auth.ts` for:

- OAuth configuration changes
- Token handling modifications
- Custom consent screens
- Permission validation

### Database Development

#### Local Database Testing

```bash
# Query local database
wrangler d1 execute specifications-prod --local --command="SELECT * FROM specifications LIMIT 5"

# Create test data
wrangler d1 execute specifications-prod --local --command="INSERT INTO specifications (title, content, user_id) VALUES ('Test', 'Content', 'test-user')"
```

#### Schema Migrations

1. Create new migration file: `migrations/XXXX_description.sql`
2. Test locally: `wrangler d1 execute specifications-prod --local --file=./migrations/XXXX_description.sql`
3. Apply to production: `wrangler d1 execute specifications-prod --file=./migrations/XXXX_description.sql`

## Testing

### Manual Testing

```bash
# Test MCP protocol compliance
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "initialize", "params": {"protocolVersion": "2024-11-05"}}'

# Test authentication
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"method": "list_specifications", "params": {"limit": 5}}'
```

### Security Testing

```bash
# Test user isolation
# Create data as user A, try to access as user B
# Should return empty results or authentication error

# Test token validation
# Use expired/invalid tokens
# Should return authentication errors
```

## Debugging

### Common Issues

#### Authentication Not Working

1. Check Auth0 application settings
2. Verify callback URLs match your local/deployed URLs
3. Check browser console for CORS errors
4. Verify Auth0 client secret is set correctly

#### Database Connection Issues

1. Verify D1 database exists: `wrangler d1 list`
2. Check database ID in wrangler-auth0.toml
3. Ensure migrations have been run

#### KV Storage Issues

1. List KV namespaces: `wrangler kv:namespace list`
2. Check namespace IDs in configuration
3. Verify KV permissions

### Debug Logs

```typescript
// Add debug logging to your tools
console.log("User ID:", this.props?.claims?.sub);
console.log("Request params:", JSON.stringify(args));
console.log("Database result:", result);
```

### Browser Developer Tools

1. **Network Tab**: Check API requests and responses
2. **Console**: Look for JavaScript errors
3. **Application > Storage**: Check for stored tokens/cookies

## Code Quality

### TypeScript Configuration

- Strict mode enabled
- Zod for runtime validation
- Type-safe database queries

### Linting and Formatting

```bash
# Add to package.json
npm install --save-dev eslint prettier typescript
```

### Best Practices

1. **Always filter by user_id** in database queries
2. **Validate all inputs** using Zod schemas
3. **Handle errors gracefully** with meaningful messages
4. **Log security events** for audit trails
5. **Use TypeScript strictly** for type safety

## Deployment

### Development Deployment

```bash
# Deploy to your development environment
wrangler deploy -c wrangler-auth0.toml --name your-app-dev
```

### Production Deployment

```bash
# Use the deployment script
./deploy-auth0.sh

# Or deploy manually
npm run deploy:auth0
```

## Troubleshooting

### Reset Development Environment

```bash
# Clear local KV data
wrangler kv:key list --namespace-id=your-kv-id --local
wrangler kv:key delete "key-name" --namespace-id=your-kv-id --local

# Reset local database
wrangler d1 execute specifications-prod --local --command="DROP TABLE specifications"
# Then re-run migrations
```

### Check Resource Usage

```bash
# Check D1 usage
wrangler d1 info specifications-prod

# Check KV usage
wrangler kv:namespace list
```

---

For additional help, consult the [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/) and [Auth0 Developer Documentation](https://auth0.com/docs).
