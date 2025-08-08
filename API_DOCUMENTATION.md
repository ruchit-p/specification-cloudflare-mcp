# API Documentation

## Overview

This document provides comprehensive API documentation for the Specification Version Control MCP Server. The server implements the Model Context Protocol (MCP) with HTTP Streamable transport and provides 9 tools for managing technical specifications.

## Base URL

```
https://specification-mcp-auth0.<your-subdomain>.workers.dev/mcp
```

## Authentication

All API endpoints require authentication using Auth0 OAuth 2.0 with PKCE flow.

### Authentication Flow

1. **Initial Request**: When accessing any tool without authentication, you'll be redirected to Auth0
2. **Consent Screen**: Approve requested permissions
3. **Token Exchange**: Server exchanges authorization code for tokens
4. **Authenticated Access**: Use tokens for subsequent requests

### Token Format

```http
Authorization: Bearer <access_token>
```

### Scopes

- `openid` - OpenID Connect
- `profile` - User profile information
- `email` - User email address
- `read:specifications` - Read specifications
- `write:specifications` - Create and update specifications
- `delete:specifications` - Delete specifications
- `compare:versions` - Compare specification versions

## MCP Protocol

All requests follow the JSON-RPC 2.0 specification:

```json
{
  "jsonrpc": "2.0",
  "method": "tool_name",
  "params": {
    "parameter": "value"
  },
  "id": "unique_request_id"
}
```

### Success Response

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"success\": true, \"data\": {...}}"
      }
    ]
  },
  "id": "unique_request_id"
}
```

### Error Response

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32600,
    "message": "Authentication required",
    "data": {
      "details": "User must be authenticated to access this tool"
    }
  },
  "id": "unique_request_id"
}
```

## Available Tools

### 1. create_specification

Create a new technical specification.

**Method**: `create_specification`

**Parameters**:

- `title` (string, required): Specification title
- `content` (string, required): Specification content in markdown
- `version` (string, optional): Version number (default: "1.0.0")
- `tags` (array of strings, optional): Tags for categorization
- `description` (string, optional): Brief description

**Example Request**:

```json
{
  "jsonrpc": "2.0",
  "method": "create_specification",
  "params": {
    "title": "API Specification v2.0",
    "content": "# API Specification\n\n## Overview\n...",
    "version": "2.0.0",
    "tags": ["api", "backend", "v2"],
    "description": "New API specification for version 2.0"
  },
  "id": "1"
}
```

**Example Response**:

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"success\": true, \"id\": 42}"
      }
    ]
  },
  "id": "1"
}
```

### 2. list_specifications

List all specifications for the authenticated user.

**Method**: `list_specifications`

**Parameters**:

- `limit` (number, optional): Maximum number of results (default: 10)
- `offset` (number, optional): Offset for pagination (default: 0)

**Example Request**:

```json
{
  "jsonrpc": "2.0",
  "method": "list_specifications",
  "params": {
    "limit": 20,
    "offset": 0
  },
  "id": "2"
}
```

**Example Response**:

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"specifications\": [{\"id\": 1, \"title\": \"API Spec\", \"version\": \"1.0.0\", \"tags\": [\"api\"], \"created_at\": \"2025-01-01T00:00:00Z\", \"updated_at\": \"2025-01-01T00:00:00Z\"}]}"
      }
    ]
  },
  "id": "2"
}
```

### 3. get_specification

Get a specific specification by ID.

**Method**: `get_specification`

**Parameters**:

- `id` (number, required): Specification ID

**Example Request**:

```json
{
  "jsonrpc": "2.0",
  "method": "get_specification",
  "params": {
    "id": 42
  },
  "id": "3"
}
```

**Example Response**:

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"id\": 42, \"title\": \"API Specification\", \"content\": \"# API Spec...\", \"version\": \"1.0.0\", \"tags\": [\"api\"], \"description\": \"API docs\", \"user_id\": \"auth0|123\", \"created_at\": \"2025-01-01T00:00:00Z\", \"updated_at\": \"2025-01-01T00:00:00Z\"}"
      }
    ]
  },
  "id": "3"
}
```

### 4. update_specification

Update an existing specification.

**Method**: `update_specification`

**Parameters**:

- `id` (number, required): Specification ID
- `title` (string, optional): New title
- `content` (string, optional): New content
- `version` (string, optional): New version
- `tags` (array of strings, optional): New tags

**Example Request**:

```json
{
  "jsonrpc": "2.0",
  "method": "update_specification",
  "params": {
    "id": 42,
    "title": "Updated API Specification",
    "version": "1.1.0",
    "tags": ["api", "backend", "updated"]
  },
  "id": "4"
}
```

**Example Response**:

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"success\": true, \"message\": \"Specification updated successfully\"}"
      }
    ]
  },
  "id": "4"
}
```

### 5. delete_specification

Delete a specification.

**Method**: `delete_specification`

**Parameters**:

- `id` (number, required): Specification ID to delete

**Example Request**:

```json
{
  "jsonrpc": "2.0",
  "method": "delete_specification",
  "params": {
    "id": 42
  },
  "id": "5"
}
```

**Example Response**:

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"success\": true, \"message\": \"Specification deleted successfully\"}"
      }
    ]
  },
  "id": "5"
}
```

### 6. search_specifications

Search specifications by content or title.

**Method**: `search_specifications`

**Parameters**:

- `query` (string, required): Search query
- `limit` (number, optional): Maximum results (default: 10)

**Example Request**:

```json
{
  "jsonrpc": "2.0",
  "method": "search_specifications",
  "params": {
    "query": "API authentication",
    "limit": 5
  },
  "id": "6"
}
```

**Example Response**:

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"results\": [{\"id\": 1, \"title\": \"API Auth Spec\", \"version\": \"1.0.0\", \"tags\": [\"auth\"], \"created_at\": \"2025-01-01T00:00:00Z\"}], \"count\": 1, \"query\": \"API authentication\"}"
      }
    ]
  },
  "id": "6"
}
```

### 7. compare_specifications

Compare two specification versions and highlight differences.

**Method**: `compare_specifications`

**Parameters**:

- `id1` (number, required): ID of first specification
- `id2` (number, required): ID of second specification

**Example Request**:

```json
{
  "jsonrpc": "2.0",
  "method": "compare_specifications",
  "params": {
    "id1": 42,
    "id2": 43
  },
  "id": "7"
}
```

**Example Response**:

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"specification1\": {\"id\": 42, \"title\": \"API v1\", \"version\": \"1.0.0\"}, \"specification2\": {\"id\": 43, \"title\": \"API v2\", \"version\": \"2.0.0\"}, \"differences\": {\"title\": true, \"content\": true, \"version\": true, \"tags\": false}}"
      }
    ]
  },
  "id": "7"
}
```

### 8. monthly_specification_report

Generate a monthly report of specification activities.

**Method**: `monthly_specification_report`

**Parameters**:

- `month` (string, required): Month in YYYY-MM format

**Example Request**:

```json
{
  "jsonrpc": "2.0",
  "method": "monthly_specification_report",
  "params": {
    "month": "2025-01"
  },
  "id": "8"
}
```

**Example Response**:

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"month\": \"2025-01\", \"created\": 5, \"updated\": 3, \"total_activity\": 8, \"period\": {\"start\": \"2025-01-01\", \"end\": \"2025-01-31\"}}"
      }
    ]
  },
  "id": "8"
}
```

### 9. logout

Logout and clear authentication state.

**Method**: `logout`

**Parameters**: None

**Example Request**:

```json
{
  "jsonrpc": "2.0",
  "method": "logout",
  "params": {},
  "id": "9"
}
```

**Example Response**:

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"success\": true, \"message\": \"Successfully logged out. You will need to re-authenticate for the next request.\", \"logged_out_user\": \"auth0|123456789\"}"
      }
    ]
  },
  "id": "9"
}
```

## Error Codes

### Common Error Codes

| Code   | Message                 | Description                                  |
| ------ | ----------------------- | -------------------------------------------- |
| -32700 | Parse error             | Invalid JSON was received                    |
| -32600 | Invalid Request         | The JSON sent is not a valid Request object  |
| -32601 | Method not found        | The method does not exist / is not available |
| -32602 | Invalid params          | Invalid method parameter(s)                  |
| -32603 | Internal error          | Internal JSON-RPC error                      |
| -32000 | Authentication required | User must be authenticated                   |
| -32001 | Permission denied       | User lacks required permissions              |
| -32002 | Resource not found      | Requested resource does not exist            |
| -32003 | Database error          | Database operation failed                    |
| -32004 | Validation error        | Input validation failed                      |

### Authentication Errors

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32000,
    "message": "Authentication required",
    "data": {
      "details": "User must be authenticated to create specifications"
    }
  },
  "id": "1"
}
```

### Validation Errors

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32004,
    "message": "Validation error",
    "data": {
      "details": "Title is required and must be a string"
    }
  },
  "id": "1"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Rate Limit**: 100 requests per minute per user
- **Burst Limit**: 20 requests per 10 seconds
- **Headers**: Rate limit information in response headers

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200
```

### Rate Limit Exceeded Response

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32005,
    "message": "Rate limit exceeded",
    "data": {
      "retry_after": 60
    }
  },
  "id": "1"
}
```

## Data Models

### Specification Object

```typescript
interface Specification {
  id: number;
  title: string;
  content: string;
  version: string;
  description?: string;
  tags: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
}
```

### Monthly Report Object

```typescript
interface MonthlyReport {
  month: string;
  created: number;
  updated: number;
  total_activity: number;
  period: {
    start: string;
    end: string;
  };
}
```

### Comparison Object

```typescript
interface Comparison {
  specification1: Specification;
  specification2: Specification;
  differences: {
    title: boolean;
    content: boolean;
    version: boolean;
    tags: boolean;
  };
}
```

## Client Libraries

### HTTP Client Example

```typescript
class SpecificationMCPClient {
  private baseUrl: string;
  private accessToken: string;

  constructor(baseUrl: string, accessToken: string) {
    this.baseUrl = baseUrl;
    this.accessToken = accessToken;
  }

  async createSpecification(params: CreateSpecificationParams): Promise<any> {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "create_specification",
        params,
        id: Math.random().toString(36),
      }),
    });

    return response.json();
  }

  async listSpecifications(
    params: ListSpecificationsParams = {}
  ): Promise<any> {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "list_specifications",
        params,
        id: Math.random().toString(36),
      }),
    });

    return response.json();
  }
}
```

### cURL Examples

```bash
# Create specification
curl -X POST https://specification-mcp-auth0.<your-subdomain>.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "method": "create_specification",
    "params": {
      "title": "Test Specification",
      "content": "# Test\n\nThis is a test specification.",
      "version": "1.0.0",
      "tags": ["test"]
    },
    "id": "1"
  }'

# List specifications
curl -X POST https://specification-mcp-auth0.<your-subdomain>.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "method": "list_specifications",
    "params": {"limit": 10},
    "id": "2"
  }'

# Search specifications
curl -X POST https://specification-mcp-auth0.<your-subdomain>.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "method": "search_specifications",
    "params": {"query": "test", "limit": 5},
    "id": "3"
  }'
```

## Webhook Integration

The API supports webhook notifications for specification events:

### Webhook Events

- `specification.created`
- `specification.updated`
- `specification.deleted`
- `user.logged_out`

### Webhook Payload

```json
{
  "event": "specification.created",
  "timestamp": "2025-01-01T00:00:00Z",
  "user_id": "auth0|123456789",
  "data": {
    "specification": {
      "id": 42,
      "title": "New Specification",
      "version": "1.0.0"
    }
  }
}
```

## Testing

### Test Environment

```
https://specification-mcp-auth0-test.<your-subdomain>.workers.dev/mcp
```

### Test Account

Use the test Auth0 tenant for development:

- **Domain**: `test-tenant.auth0.com`
- **Client ID**: `test-client-id`

### Integration Tests

```bash
# Run integration tests
npm run test:integration

# Run load tests
npm run test:load

# Run security tests
npm run test:security
```

## Support

For API support and questions:

- **Documentation**: This document
- **GitHub Issues**: [Report issues](https://github.com/your-repo/issues)
- **Email Support**: api-support@yourcompany.com
- **Discord**: Join our [Discord community](https://discord.gg/your-server)

---

**Last Updated**: January 2025
**API Version**: 1.0.0
**Document Version**: 1.0.0
