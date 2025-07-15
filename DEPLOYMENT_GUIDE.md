# Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Specification Version Control MCP Server to production using Cloudflare Workers, Auth0, and D1 database.

## Prerequisites

### Required Accounts

- **Cloudflare Account** with Workers and D1 access
- **Auth0 Account** (free tier available)
- **GitHub Account** (for CI/CD, optional)

### Required Tools

- **Node.js** 18+ and npm
- **Wrangler CLI** 3.0+
- **Git** for version control

### Installation

```bash
# Install Wrangler CLI globally
npm install -g wrangler

# Authenticate with Cloudflare
wrangler login

# Verify installation
wrangler --version
```

## Environment Setup

### 1. Cloudflare Resources

#### Create D1 Database

```bash
# Create production database
wrangler d1 create specifications-prod

# Output will include database ID - save this for configuration
# Example: database_id = "9513e380-fb7b-4670-9301-4ea918df80ba"
```

#### Create KV Namespaces

```bash
# Create OAuth state namespace
wrangler kv:namespace create "OAUTH_KV"

# Create MCP OAuth namespace
wrangler kv:namespace create "SPECIFICATION_MCP_OAUTH"

# Save the namespace IDs from output for configuration
```

#### Create Durable Object (if not exists)

```bash
# Durable Objects are created automatically during deployment
# No manual setup required
```

### 2. Auth0 Configuration

#### Create Auth0 Application

1. Go to [Auth0 Dashboard](https://manage.auth0.com)
2. Navigate to **Applications** → **Create Application**
3. Choose:
   - **Name**: `Specification Version Control MCP`
   - **Type**: `Regular Web Application`
   - **Technology**: `Node.js`

#### Configure Application Settings

```
# Basic Information
Name: Specification Version Control MCP
Domain: your-tenant.auth0.com
Client ID: (auto-generated)
Client Secret: (auto-generated - keep secure)

# Application URIs
Allowed Callback URLs:
https://specification-mcp-auth0.your-subdomain.workers.dev/callback

Allowed Logout URLs:
https://specification-mcp-auth0.your-subdomain.workers.dev

Allowed Web Origins:
https://specification-mcp-auth0.your-subdomain.workers.dev

# Advanced Settings → OAuth
Grant Types:
- Authorization Code
- Refresh Token

# Advanced Settings → Endpoints
Token Endpoint Authentication Method: Client Secret (Post)
```

#### Configure API Settings

1. Go to **APIs** → **Create API**
2. Settings:
   - **Name**: `Specification MCP API`
   - **Identifier**: `urn:specification-mcp-server`
   - **Signing Algorithm**: `RS256`

3. **Scopes**:

   ```
   read:specifications - Read specifications
   write:specifications - Create and update specifications
   delete:specifications - Delete specifications
   compare:versions - Compare specification versions
   ```

4. **Settings**:
   - **Token Expiration**: `900` seconds (15 minutes)
   - **Allow Offline Access**: `Yes`
   - **Refresh Token Rotation**: `Yes`
   - **Refresh Token Expiration**: `3600` seconds (1 hour)

## Configuration Files

### 1. Update wrangler-auth0.toml

```toml
name = "specification-mcp-auth0"
compatibility_date = "2025-01-01"
main = "src/index-auth0-streamable.ts"

# D1 Database binding
[[d1_databases]]
binding = "DB"
database_name = "specifications-prod"
database_id = "YOUR_DATABASE_ID"  # Replace with actual ID

# KV namespace for OAuth state
[[kv_namespaces]]
binding = "OAUTH_KV"
id = "YOUR_OAUTH_KV_ID"  # Replace with actual ID

# Additional KV namespace for MCP OAuth
[[kv_namespaces]]
binding = "SPECIFICATION_MCP_OAUTH"
id = "YOUR_MCP_OAUTH_KV_ID"  # Replace with actual ID

# Durable Objects binding
[[durable_objects.bindings]]
name = "MCP_OBJECT"
class_name = "AuthenticatedSpecificationMCP"

# Durable Object migration
[[migrations]]
tag = "v1"
new_classes = ["AuthenticatedSpecificationMCP"]

[vars]
# MCP Server configuration
MCP_SERVER_NAME = "Authenticated Specification Version Control"
MCP_SERVER_VERSION = "1.0.0"

# Auth0 configuration
AUTH0_DOMAIN = "YOUR_TENANT.auth0.com"
AUTH0_CLIENT_ID = "YOUR_CLIENT_ID"
AUTH0_AUDIENCE = "urn:specification-mcp-server"
AUTH0_SCOPE = "openid email profile offline_access read:specifications write:specifications delete:specifications compare:versions"

# Security: Shorter token lifetimes
AUTH0_ACCESS_TOKEN_TTL = 900
AUTH0_REFRESH_TOKEN_TTL = 3600
AUTH0_FORCE_REAUTH_AFTER = 14400
```

### 2. Update wrangler-auth0.jsonc

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "specification-mcp-auth0",
  "main": "src/index-auth0-streamable.ts",
  "compatibility_date": "2025-04-01",
  "compatibility_flags": ["nodejs_compat"],
  "migrations": [
    {
      "new_classes": ["AuthenticatedSpecificationMCP"],
      "tag": "v1",
    },
  ],
  "durable_objects": {
    "bindings": [
      {
        "class_name": "AuthenticatedSpecificationMCP",
        "name": "MCP_OBJECT",
      },
    ],
  },
  "kv_namespaces": [
    {
      "binding": "OAUTH_KV",
      "id": "YOUR_OAUTH_KV_ID",
    },
    {
      "binding": "SPECIFICATION_MCP_OAUTH",
      "id": "YOUR_MCP_OAUTH_KV_ID",
    },
  ],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "specifications-prod",
      "database_id": "YOUR_DATABASE_ID",
    },
  ],
  "vars": {
    "AUTH0_DOMAIN": "YOUR_TENANT.auth0.com",
    "AUTH0_CLIENT_ID": "YOUR_CLIENT_ID",
    "AUTH0_AUDIENCE": "urn:specification-mcp-server",
    "AUTH0_SCOPE": "openid profile email read:specifications write:specifications delete:specifications compare:versions",
  },
}
```

## Database Migration

### 1. Run Initial Migrations

```bash
# Run migrations in order
wrangler d1 execute specifications-prod --file=./migrations/0001_create_specifications_table.sql

wrangler d1 execute specifications-prod --file=./migrations/0002_add_user_isolation.sql

wrangler d1 execute specifications-prod --file=./migrations/0003_fix_version_column.sql
```

### 2. Verify Migration

```bash
# Check database schema
wrangler d1 execute specifications-prod --command="SELECT sql FROM sqlite_master WHERE type='table' AND name='specifications'"

# Check indexes
wrangler d1 execute specifications-prod --command="SELECT name, sql FROM sqlite_master WHERE type='index'"
```

## Secret Management

### 1. Set Required Secrets

```bash
# Set Auth0 client secret
wrangler secret put AUTH0_CLIENT_SECRET
# Enter your Auth0 client secret when prompted

# Optional: Set additional secrets
wrangler secret put DATABASE_ENCRYPTION_KEY
wrangler secret put JWT_SIGNING_SECRET
```

### 2. Verify Secrets

```bash
# List secrets (without values)
wrangler secret list

# Expected output:
# [
#   {
#     "name": "AUTH0_CLIENT_SECRET",
#     "type": "secret_text"
#   }
# ]
```

## Deployment Process

### 1. Install Dependencies

```bash
# Install project dependencies
npm install

# Verify TypeScript compilation
npm run build
```

### 2. Deploy to Production

```bash
# Deploy using the deployment script
./deploy-auth0.sh

# Or deploy manually
wrangler deploy -c wrangler-auth0.jsonc

# Or use npm script
npm run deploy:auth0
```

### 3. Verify Deployment

```bash
# Check deployment status
wrangler deployments list

# Test basic endpoint
curl -I https://specification-mcp-auth0.your-subdomain.workers.dev

# Expected response: HTTP/2 200
```

## Post-Deployment Configuration

### 1. Update Auth0 URLs

After deployment, update your Auth0 application with the actual Worker URL:

```
# Replace with your actual Worker URL
Allowed Callback URLs:
https://specification-mcp-auth0.your-subdomain.workers.dev/callback

Allowed Logout URLs:
https://specification-mcp-auth0.your-subdomain.workers.dev

Allowed Web Origins:
https://specification-mcp-auth0.your-subdomain.workers.dev
```

### 2. Test Authentication Flow

```bash
# Test OAuth flow
curl -X GET "https://specification-mcp-auth0.your-subdomain.workers.dev/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=https://specification-mcp-auth0.your-subdomain.workers.dev/callback&response_type=code&scope=openid%20profile%20email"

# Should redirect to Auth0 login page
```

### 3. Test MCP Endpoints

```bash
# Test MCP protocol
curl -X POST https://specification-mcp-auth0.your-subdomain.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "initialize", "params": {"protocolVersion": "2024-11-05"}, "id": "1"}'
```

## Domain Setup (Optional)

### 1. Custom Domain

```bash
# Add custom domain
wrangler custom-domains create specification-mcp.yourdomain.com

# Update DNS records as instructed
# Update Auth0 URLs to use custom domain
```

### 2. SSL Certificate

```bash
# SSL is automatically handled by Cloudflare
# Verify SSL grade
curl -I https://specification-mcp.yourdomain.com
```

## Monitoring Setup

### 1. Cloudflare Analytics

- Navigate to **Cloudflare Dashboard** → **Workers & Pages** → **specification-mcp-auth0**
- Enable **Real-time logs** for debugging
- Set up **Alerts** for errors and performance

### 2. Health Check Endpoint

```bash
# Add health check to your application
curl https://specification-mcp-auth0.your-subdomain.workers.dev/health

# Expected response:
# {"status": "healthy", "timestamp": "2025-01-01T00:00:00Z"}
```

### 3. Log Monitoring

```bash
# View real-time logs
wrangler tail

# Filter logs
wrangler tail --format=pretty --status=error
```

## Performance Optimization

### 1. Caching Strategy

```typescript
// Add to your worker for API responses
const cache = caches.default;
const cacheKey = new Request(url, {
  method: "GET",
  headers: { "Cache-Key": userId },
});

// Cache GET responses for 5 minutes
if (method === "GET") {
  const cached = await cache.match(cacheKey);
  if (cached) return cached;
}
```

### 2. Database Optimization

```sql
-- Add additional indexes for common queries
CREATE INDEX idx_user_updated ON specifications(user_id, updated_at);
CREATE INDEX idx_user_tags ON specifications(user_id, tags);
CREATE INDEX idx_content_search ON specifications(content);
```

## Security Hardening

### 1. Enable Security Headers

```typescript
// Add to your worker response
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline'",
};
```

### 2. Rate Limiting

```bash
# Configure rate limiting via Cloudflare Dashboard
# Navigate to Security → Rate Limiting
# Set limits: 100 requests per minute per IP
```

### 3. IP Allowlist (if needed)

```bash
# Configure IP restrictions via Cloudflare Dashboard
# Navigate to Security → Access Rules
# Add allowed IP ranges
```

## Backup Strategy

### 1. Database Backup

```bash
# Export database
wrangler d1 export specifications-prod --output=backup-$(date +%Y%m%d).sql

# Schedule regular backups
# Add to cron job or CI/CD pipeline
```

### 2. Configuration Backup

```bash
# Backup configuration files
cp wrangler-auth0.toml wrangler-auth0.toml.backup
cp wrangler-auth0.jsonc wrangler-auth0.jsonc.backup

# Store in secure location
```

## Disaster Recovery

### 1. Recovery Procedure

```bash
# 1. Restore database
wrangler d1 execute specifications-prod --file=backup-YYYYMMDD.sql

# 2. Redeploy application
wrangler deploy -c wrangler-auth0.jsonc

# 3. Verify functionality
curl -X POST https://specification-mcp-auth0.your-subdomain.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "initialize", "params": {"protocolVersion": "2024-11-05"}, "id": "1"}'
```

### 2. Rollback Strategy

```bash
# Rollback to previous version
wrangler rollback

# Or deploy specific version
wrangler deploy -c wrangler-auth0.jsonc --compatibility-date=2024-12-01
```

## CI/CD Pipeline (Optional)

### 1. GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          wranglerVersion: "3.0.0"
          command: deploy -c wrangler-auth0.jsonc
```

### 2. Environment Variables

Set in GitHub repository settings:

- `CLOUDFLARE_API_TOKEN`
- `AUTH0_CLIENT_SECRET`

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues

```bash
# Check database exists
wrangler d1 list

# Test database connection
wrangler d1 execute specifications-prod --command="SELECT 1"
```

#### 2. Authentication Issues

```bash
# Check Auth0 configuration
curl -X GET "https://YOUR_TENANT.auth0.com/.well-known/openid_configuration"

# Verify client credentials
# Check Auth0 dashboard for errors
```

#### 3. KV Storage Issues

```bash
# List KV namespaces
wrangler kv:namespace list

# Test KV operations
wrangler kv:key put --binding=OAUTH_KV "test-key" "test-value"
wrangler kv:key get --binding=OAUTH_KV "test-key"
```

#### 4. Deployment Failures

```bash
# Check deployment logs
wrangler deployments list

# View detailed logs
wrangler tail --format=pretty

# Check resource limits
wrangler whoami
```

### Performance Issues

#### 1. High Latency

```bash
# Check worker performance
wrangler metrics

# Optimize database queries
# Add appropriate indexes
# Implement caching
```

#### 2. Rate Limiting

```bash
# Check rate limit status
# Implement exponential backoff
# Add user-specific rate limiting
```

## Production Checklist

### Pre-Deployment

- [ ] All secrets configured
- [ ] Database migrations completed
- [ ] Auth0 application configured
- [ ] SSL certificate valid
- [ ] Domain configured (if using custom domain)
- [ ] Monitoring set up
- [ ] Backup strategy implemented

### Post-Deployment

- [ ] Authentication flow tested
- [ ] All MCP tools tested
- [ ] Performance monitoring active
- [ ] Error logging configured
- [ ] Security headers enabled
- [ ] Rate limiting configured
- [ ] Documentation updated

### Ongoing Maintenance

- [ ] Regular security updates
- [ ] Database optimization
- [ ] Performance monitoring
- [ ] Error monitoring
- [ ] Backup verification
- [ ] Access log review

## Support & Maintenance

### Regular Tasks

- **Daily**: Check error logs and performance metrics
- **Weekly**: Review security logs and access patterns
- **Monthly**: Database optimization and backup verification
- **Quarterly**: Security audit and dependency updates

### Emergency Contacts

- **Primary**: DevOps team (devops@yourcompany.com)
- **Secondary**: Security team (security@yourcompany.com)
- **Escalation**: CTO (cto@yourcompany.com)

### Documentation Updates

- Update this guide after each deployment
- Maintain changelog for configuration changes
- Document any custom modifications

---

**Last Updated**: January 2025
**Deployment Version**: 1.0.0
**Next Review**: April 2025

For deployment support, contact the DevOps team or create an issue in the repository.
