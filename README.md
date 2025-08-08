# Specification Version Control MCP Server

An Auth0-authenticated Model Context Protocol (MCP) server for managing technical specifications with version control capabilities, deployed on Cloudflare Workers. Uses HTTP Streamable transport for efficient bidirectional communication.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/your-repo/specification-cloudflare-mcp.git
cd specification-cloudflare-mcp

# Install dependencies
npm install

# Deploy to production
npm run deploy:auth0
```

Example endpoint: `https://specification-mcp-auth0.<your-subdomain>.workers.dev/mcp`

## 📚 Documentation

### Core Documentation

- **[📋 Project Overview](./PROJECT_OVERVIEW.md)** - Complete project overview and features
- **[🔧 Development Setup](./DEVELOPMENT_SETUP.md)** - Local development environment setup
- **[🛡️ Security Guidelines](./SECURITY.md)** - Security architecture and best practices
- **[📖 API Documentation](./API_DOCUMENTATION.md)** - Comprehensive API reference
- **[🚀 Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Production deployment instructions

### Legacy Documentation

- **[⚡ Migration Summary](./MIGRATION_SUMMARY.md)** - HTTP Streamable migration details
- **[🔐 Auth0 Setup](./AUTH0_SETUP.md)** - Auth0 configuration guide
- **[📝 Implementation Summary](./IMPLEMENTATION_SUMMARY.md)** - Technical implementation details
- **[📊 MCP Usage Guide](./MCP_USAGE_GUIDE.md)** - MCP tools usage examples

## ✨ Features

### 🔐 **Security & Authentication**

- **Auth0 OAuth 2.0 with PKCE** - Industry-standard authentication
- **User Data Isolation** - Private workspace for each user
- **JWT Token Validation** - Secure token-based authentication
- **Manual Logout** - Explicit authentication state clearing
- **Short-lived Tokens** - 15-minute access tokens, 1-hour refresh tokens

### 📝 **Specification Management**

- **Full CRUD Operations** - Create, read, update, delete specifications
- **Version Control** - Track specification versions and changes
- **Advanced Search** - Search by title, content, or tags
- **Comparison Tools** - Compare different specification versions
- **Monthly Reports** - Activity and usage analytics
- **Tag-based Organization** - Categorize specifications

### 🏗️ **Technical Architecture**

- **HTTP Streamable Transport** - Modern MCP protocol implementation
- **Cloudflare Workers** - Serverless edge computing
- **D1 Database** - SQLite-compatible database
- **KV Storage** - Session and OAuth state management
- **TypeScript** - Type-safe development with Zod validation

## 🛠️ Available Tools

| Tool                           | Description                   | Parameters                                  |
| ------------------------------ | ----------------------------- | ------------------------------------------- |
| `create_specification`         | Create new specification      | `title`, `content`, `version`, `tags`       |
| `list_specifications`          | List user's specifications    | `limit`, `offset`                           |
| `get_specification`            | Get specific specification    | `id`                                        |
| `update_specification`         | Update existing specification | `id`, `title`, `content`, `version`, `tags` |
| `delete_specification`         | Delete specification          | `id`                                        |
| `search_specifications`        | Search specifications         | `query`, `limit`                            |
| `compare_specifications`       | Compare two specifications    | `id1`, `id2`                                |
| `monthly_specification_report` | Generate activity report      | `month` (YYYY-MM)                           |
| `logout`                       | Clear authentication state    | None                                        |

## 🔧 Configuration

### Claude Desktop Integration

```json
{
  "mcpServers": {
    "specification-server": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://specification-mcp-auth0.<your-subdomain>.workers.dev/mcp"
      ]
    }
  }
}
```

### Production Configuration

- **Database**: Cloudflare D1 (`specifications-prod`)
- **Authentication**: Auth0 (`YOUR_TENANT.auth0.com`)
- **Transport**: HTTP Streamable (port `/mcp`)
- **Storage**: Cloudflare KV for OAuth state

## 🏗️ Project Structure

```
specification-cloudflare-mcp/
├── src/
│   ├── index-auth0-streamable.ts    # Main MCP server
│   ├── auth.ts                      # OAuth authentication logic
│   ├── types.ts                     # TypeScript definitions
│   └── param-utils.ts               # Parameter validation
├── migrations/                      # Database schema migrations
├── documentation/                   # Project documentation
│   ├── PROJECT_OVERVIEW.md
│   ├── DEVELOPMENT_SETUP.md
│   ├── SECURITY.md
│   ├── API_DOCUMENTATION.md
│   └── DEPLOYMENT_GUIDE.md
├── wrangler-auth0.toml             # Cloudflare configuration
├── wrangler-auth0.jsonc            # Cloudflare configuration (with comments)
├── deploy-auth0.sh                 # Deployment script
└── package.json                    # Dependencies and scripts
```

## 🚀 Deployment Status

### Example Deployment

- **Environment**: Production
- **URL**: `https://specification-mcp-auth0.<your-subdomain>.workers.dev/mcp`
- **Transport**: HTTP Streamable
- **Database**: `specifications-prod`
- **Auth0 Domain**: `YOUR_TENANT.auth0.com`
- **OAuth Flow**: PKCE with state protection

## 📊 Usage

### Authentication Flow

1. User accesses MCP tool → Redirected to Auth0 consent screen
2. User approves permissions → Auth0 redirects with authorization code
3. Server exchanges code for JWT tokens → User can access tools

### Example Usage

```bash
# Create a specification
curl -X POST https://specification-mcp-auth0.<your-subdomain>.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "method": "create_specification",
    "params": {
      "title": "API Specification",
      "content": "# API Spec\n\nThis is an API specification.",
      "version": "1.0.0",
      "tags": ["api", "backend"]
    },
    "id": "1"
  }'

# List specifications
curl -X POST https://specification-mcp-auth0.<your-subdomain>.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "method": "list_specifications",
    "params": {"limit": 10},
    "id": "2"
  }'
```

## 🔍 Development

### Local Development

```bash
# Install dependencies
npm install

# Start development server
wrangler dev -c wrangler-auth0.toml --port 8787

# Run tests
npm test

# Deploy to production
npm run deploy:auth0
```

### Key Files

- **Entry Point**: `src/index-auth0-streamable.ts`
- **Authentication**: `src/auth.ts`
- **Configuration**: `wrangler-auth0.toml`
- **Database**: `migrations/`

## 📈 Monitoring

### Performance Metrics

- **Request Latency**: < 100ms average
- **Authentication Success Rate**: > 99.5%
- **Database Query Time**: < 50ms average
- **Error Rate**: < 0.1%

### Security Monitoring

- **Token Validation**: All requests validated
- **User Isolation**: 100% enforced
- **Failed Auth Attempts**: Logged and monitored
- **Rate Limiting**: 100 requests/minute per user

## 🤝 Contributing

1. **Setup**: Follow the [Development Setup Guide](./DEVELOPMENT_SETUP.md)
2. **Security**: Review [Security Guidelines](./SECURITY.md)
3. **API**: Reference [API Documentation](./API_DOCUMENTATION.md)
4. **Deploy**: Use [Deployment Guide](./DEPLOYMENT_GUIDE.md)

### Code Standards

- **TypeScript**: Strict mode with Zod validation
- **Authentication**: Always check `this.props?.claims?.sub`
- **Database**: Always filter by `user_id`
- **Error Handling**: Use structured error responses
- **Security**: Log all authentication events

## 📞 Support

### Documentation

- **Project Overview**: [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)
- **Development**: [DEVELOPMENT_SETUP.md](./DEVELOPMENT_SETUP.md)
- **Security**: [SECURITY.md](./SECURITY.md)
- **API Reference**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Deployment**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

### Community

- **GitHub Issues**: [Report issues](https://github.com/your-repo/issues)
- **Email**: api-support@yourcompany.com
- **Discord**: [Join our community](https://discord.gg/your-server)

## 📜 License

This project is open source under the MIT License. See [LICENSE](./LICENSE).

---

**Last Updated**: August 2025  
**MCP Protocol**: HTTP Streamable  
**Auth Provider**: Auth0 OAuth 2.0
