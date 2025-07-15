#!/bin/bash

# Deploy script for Auth0-authenticated MCP server

echo "🔐 Deploying Auth0-authenticated MCP Server..."

# Check if wrangler is installed
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js"
    exit 1
fi

# Check if logged in to Cloudflare
if ! npx wrangler whoami &> /dev/null; then
    echo "❌ Not logged in to Cloudflare. Please run: npx wrangler login"
    exit 1
fi

# Check if Auth0 configuration exists
if [ ! -f "wrangler-auth0.toml" ]; then
    echo "❌ wrangler-auth0.toml not found. Please create it from the template."
    exit 1
fi

# Check for Auth0 credentials
if grep -q "your-tenant.auth0.com" wrangler-auth0.toml; then
    echo "❌ Auth0 credentials not configured in wrangler-auth0.toml"
    echo "Please update AUTH0_DOMAIN, AUTH0_CLIENT_ID, and AUTH0_CLIENT_SECRET"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create KV namespace if it doesn't exist
echo "🗄️ Setting up KV namespace..."
KV_ID=$(npx wrangler kv namespace list | grep "SPECIFICATION_MCP_OAUTH" | grep -o '"id":[^,]*' | cut -d'"' -f4)

if [ -z "$KV_ID" ]; then
    echo "Creating new KV namespace..."
    KV_OUTPUT=$(npx wrangler kv namespace create "SPECIFICATION_MCP_OAUTH")
    KV_ID=$(echo "$KV_OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
    
    if [ -n "$KV_ID" ]; then
        echo "✅ Created KV namespace with ID: $KV_ID"
        echo "Please update the KV namespace ID in wrangler-auth0.toml"
        echo "id = \"$KV_ID\""
    fi
else
    echo "✅ KV namespace already exists: $KV_ID"
fi

# Run database migrations
echo "🗄️ Running database migrations..."
npx wrangler d1 execute specifications-prod --file=./migrations/0001_create_specifications_prod_schema.sql -c wrangler-auth0.toml || echo "⚠️  Schema may already exist"

# Deploy to Cloudflare
echo "🚀 Deploying to Cloudflare Workers..."
npm run deploy:auth0

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Update your Auth0 application with the Worker URL"
    echo "2. Configure your MCP client with the HTTP streamable endpoint"
    echo "3. Test authentication by connecting to the server"
    echo ""
    echo "🔗 Your MCP server endpoint: https://specification-mcp-server-auth0.<your-subdomain>.workers.dev/mcp"
else
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi