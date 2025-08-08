# Specification Version Control MCP Server

## Overview

An Auth0-authenticated Model Context Protocol (MCP) server for managing technical specifications with version control capabilities, deployed on Cloudflare Workers with HTTP Streamable transport.

## Key Features

### 🔐 **Security & Authentication**

- **Auth0 OAuth 2.0 with PKCE** - Industry-standard authentication flow
- **User Data Isolation** - Each user has a private workspace
- **JWT Token Validation** - Secure token-based authentication
- **Manual Logout** - Users can explicitly clear authentication state
- **Permission-based Access** - Role-based tool access control

### 📝 **Specification Management**

- **Full CRUD Operations** - Create, read, update, delete specifications
- **Version Control** - Track specification versions and changes
- **Advanced Search** - Search by title, content, or tags
- **Comparison Tools** - Compare different specification versions
- **Monthly Reports** - Activity and usage analytics
- **Tag-based Organization** - Categorize specifications with tags

### 🚀 **Technical Architecture**

- **HTTP Streamable Transport** - Modern MCP protocol implementation
- **Cloudflare Workers** - Serverless edge computing platform
- **D1 Database** - SQLite-compatible database for data storage
- **KV Storage** - Key-value storage for OAuth state management
- **TypeScript** - Type-safe development with Zod validation

## Production Deployment

### Live Server

- **URL**: `https://specification-mcp-auth0.<your-subdomain>.workers.dev/mcp`
- **Status**: Active and production-ready
- **Transport**: HTTP Streamable
- **Authentication**: Auth0 OAuth 2.0

### Database

- **Type**: Cloudflare D1 (SQLite-compatible)
- **Name**: `specifications-prod`
- **Features**: User isolation, full-text search, version tracking

### Auth0 Configuration

- **Domain**: `YOUR_TENANT.auth0.com`
- **Application Type**: Regular Web Application
- **Flow**: Authorization Code with PKCE
- **Scopes**: `openid profile email read:specifications write:specifications delete:specifications compare:versions`

## Available Tools

| Tool                           | Description                   | Parameters                                           |
| ------------------------------ | ----------------------------- | ---------------------------------------------------- |
| `create_specification`         | Create new specification      | `title`, `content`, `version`, `tags`, `description` |
| `list_specifications`          | List user's specifications    | `limit`, `offset`                                    |
| `get_specification`            | Get specific specification    | `id`                                                 |
| `update_specification`         | Update existing specification | `id`, `title`, `content`, `version`, `tags`          |
| `delete_specification`         | Delete specification          | `id`                                                 |
| `search_specifications`        | Search specifications         | `query`, `limit`                                     |
| `compare_specifications`       | Compare two specifications    | `id1`, `id2`                                         |
| `monthly_specification_report` | Generate activity report      | `month` (YYYY-MM)                                    |
| `logout`                       | Clear authentication state    | None                                                 |

## Security Model

### Data Privacy

- **User Isolation**: All database queries filter by `user_id`
- **No Cross-Contamination**: Users cannot access others' data
- **Audit Trail**: All actions are logged with user context

### Authentication Flow

1. User accesses MCP tool → Authentication required
2. Redirect to Auth0 consent screen
3. User approves permissions
4. Auth0 redirects with authorization code
5. Server exchanges code for tokens
6. User can access tools with valid tokens

### Token Management

- **Access Token**: 15 minutes (configurable)
- **Refresh Token**: 1 hour (configurable)
- **Storage**: Encrypted in Cloudflare KV
- **Rotation**: Automatic refresh token rotation

## Use Cases

### Individual Developers

- **Personal Specification Library**: Store and version your technical specs
- **Research Notes**: Keep track of requirements and design decisions
- **Project Documentation**: Maintain living documentation with version history

### Teams (Future Enhancement)

- **Collaborative Specs**: Share specifications within teams
- **Review Process**: Track changes and approvals
- **Knowledge Base**: Centralized technical documentation

## Integration

### Claude Desktop

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

### Direct HTTP API

```bash
curl -X POST https://specification-mcp-auth0.<your-subdomain>.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"method": "list_specifications", "params": {"limit": 10}}'
```

## Project Structure

```
specification-cloudflare-mcp/
├── src/
│   ├── index-auth0-streamable.ts    # Main MCP server
│   ├── auth.ts                      # OAuth authentication logic
│   └── types.ts                     # TypeScript definitions
├── migrations/                      # Database schema migrations
├── wrangler-auth0.toml             # Cloudflare configuration
├── wrangler-auth0.jsonc            # Cloudflare configuration (with comments)
├── deploy-auth0.sh                 # Deployment script
└── documentation/                  # Project documentation
```

## Contributing

1. **Development Setup**: Follow `DEVELOPMENT_SETUP.md`
2. **Security Guidelines**: See `SECURITY.md`
3. **API Documentation**: Reference `API_DOCUMENTATION.md`
4. **Deployment Guide**: Check `DEPLOYMENT_GUIDE.md`

## License

This project is configured for production use with Auth0 and Cloudflare Workers.

---

**Need Help?**

- Auth0 Documentation: https://auth0.com/docs
- Cloudflare Workers: https://developers.cloudflare.com/workers
- MCP Protocol: https://modelcontextprotocol.io
