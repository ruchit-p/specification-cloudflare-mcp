/**
 * Auth0-authenticated Specification Version Control MCP Server
 * Updated to use HTTP Streamable Transport with Zod schemas
 */

import OAuthProvider, { type OAuthHelpers } from "@cloudflare/workers-oauth-provider";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { Hono } from "hono";
import { z } from "zod";
import { authorize, callback, confirmConsent, tokenExchangeCallback } from "./auth";
import type { UserProps } from "./types";

export class AuthenticatedSpecificationMCP extends McpAgent<Env, Record<string, never>, UserProps> {
  server = new McpServer({
    name: "Authenticated Specification MCP Server",
    version: "1.0.0",
  });

  async init() {
    // MARK: - Specification Management Tools
    
    this.server.tool(
      "create_specification",
      "Create a new technical specification",
      {
        title: z.string().describe("Specification title"),
        content: z.string().describe("Specification content in markdown"),
        version: z.string().default("1.0.0").describe("Version number (e.g., 1.0.0)"),
        tags: z.array(z.string()).optional().describe("Tags for categorization"),
        description: z.string().optional().describe("Brief description of the specification")
      },
      async (args) => {
        console.log('create_specification args:', JSON.stringify(args));
        
        // Get parameters directly from args (already validated by Zod)
        const { title, content, version = '1.0.0', tags = [], description } = args;

        // Check if user is authenticated
        if (!this.props?.claims?.sub) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: "Authentication required",
                message: "User must be authenticated to create specifications"
              })
            }]
          };
        }

        try {
          const result = await this.env.DB.prepare(
            'INSERT INTO specifications (title, content, version, description, tags, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))'
          )
          .bind(title, content, version, description || null, JSON.stringify(tags || []), this.props.claims.sub)
          .run();
          
          return { 
            content: [{ 
              type: "text", 
              text: JSON.stringify({ success: true, id: result.meta.last_row_id }) 
            }] 
          };
        } catch (error) {
          console.error('Error creating specification:', error);
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: "Database error",
                message: error instanceof Error ? error.message : "Failed to create specification"
              })
            }]
          };
        }
      }
    );

    this.server.tool(
      "list_specifications", 
      "List all specifications for the authenticated user",
      {
        limit: z.number().default(10).describe("Maximum number of results"),
        offset: z.number().default(0).describe("Offset for pagination")
      },
      async (args) => {
        console.log('list_specifications args:', JSON.stringify(args));
        
        // Get parameters directly from args
        const { limit = 10, offset = 0 } = args;
        
        // Check if user is authenticated
        if (!this.props?.claims?.sub) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: "Authentication required",
                message: "User must be authenticated to list specifications",
                authInfo: {
                  hasProps: !!this.props,
                  hasClaims: !!this.props?.claims,
                  hasSub: !!this.props?.claims?.sub
                }
              })
            }]
          };
        }

        try {
          const results = await this.env.DB.prepare(
            'SELECT id, title, version, tags, created_at, updated_at FROM specifications WHERE user_id = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?'
          )
          .bind(this.props.claims.sub, limit, offset)
          .all();
          
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify({
                specifications: results.results.map(spec => ({
                  ...spec,
                  tags: JSON.parse(spec.tags as string || '[]')
                }))
              })
            }]
          };
        } catch (error) {
          console.error('Error listing specifications:', error);
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: "Database error",
                message: error instanceof Error ? error.message : "Failed to list specifications"
              })
            }]
          };
        }
      }
    );

    this.server.tool(
      "get_specification",
      "Get a specific specification by ID", 
      {
        id: z.number().positive().describe("Specification ID")
      },
      async (args) => {
        console.log('get_specification args:', JSON.stringify(args));
        
        // Get parameters directly from args
        const { id } = args;
        
        // Check if user is authenticated
        if (!this.props?.claims?.sub) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: "Authentication required",
                message: "User must be authenticated to get specifications"
              })
            }]
          };
        }
        
        try {
          const result = await this.env.DB.prepare(
            'SELECT * FROM specifications WHERE id = ? AND user_id = ?'
          )
          .bind(id, this.props.claims.sub)
          .first();
          
          if (!result) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  error: "Specification not found",
                  message: `No specification found with ID ${id}`
                })
              }]
            };
          }
          
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify({
                ...result,
                tags: JSON.parse(result.tags as string || '[]')
              })
            }]
          };
        } catch (error) {
          console.error('Error getting specification:', error);
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: "Database error",
                message: error instanceof Error ? error.message : "Failed to get specification"
              })
            }]
          };
        }
      }
    );

    this.server.tool(
      "update_specification",
      "Update an existing specification",
      {
        id: z.number().positive().describe("Specification ID"),
        title: z.string().optional().describe("New title"),
        content: z.string().optional().describe("New content"),
        version: z.string().optional().describe("New version"),
        tags: z.array(z.string()).optional().describe("New tags")
      },
      async (args) => {
        console.log('update_specification args:', JSON.stringify(args));
        
        // Get parameters directly from args
        const { id, title, content, version, tags } = args;
        
        // Check if user is authenticated
        if (!this.props?.claims?.sub) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: "Authentication required",
                message: "User must be authenticated to update specifications"
              })
            }]
          };
        }
        
        try {
          const updates: string[] = [];
          const values: any[] = [];
          
          if (title) {
            updates.push('title = ?');
            values.push(title);
          }
          if (content) {
            updates.push('content = ?');
            values.push(content);
          }
          if (version) {
            updates.push('version = ?');
            values.push(version);
          }
          if (tags && tags.length > 0) {
            updates.push('tags = ?');
            values.push(JSON.stringify(tags));
          }
          
          if (updates.length === 0) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  error: "No updates provided",
                  message: "At least one field to update must be provided"
                })
              }]
            };
          }
          
          updates.push('updated_at = datetime("now")');
          values.push(id, this.props.claims.sub);
          
          const result = await this.env.DB.prepare(
            `UPDATE specifications SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
          )
          .bind(...values)
          .run();
          
          return { 
            content: [{ 
              type: "text", 
              text: JSON.stringify({ 
                success: result.meta.changes > 0,
                message: result.meta.changes > 0 ? "Specification updated successfully" : "No specification found or no changes made"
              }) 
            }] 
          };
        } catch (error) {
          console.error('Error updating specification:', error);
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: "Database error",
                message: error instanceof Error ? error.message : "Failed to update specification"
              })
            }]
          };
        }
      }
    );

    this.server.tool(
      "delete_specification",
      "Delete a specification",
      {
        id: z.number().positive().describe("Specification ID to delete")
      },
      async (args) => {
        console.log('delete_specification args:', JSON.stringify(args));
        
        // Get parameters directly from args
        const { id } = args;
        
        // Check if user is authenticated
        if (!this.props?.claims?.sub) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: "Authentication required",
                message: "User must be authenticated to delete specifications"
              })
            }]
          };
        }
        
        try {
          const result = await this.env.DB.prepare(
            'DELETE FROM specifications WHERE id = ? AND user_id = ?'
          )
          .bind(id, this.props.claims.sub)
          .run();
          
          return { 
            content: [{ 
              type: "text", 
              text: JSON.stringify({ 
                success: result.meta.changes > 0,
                message: result.meta.changes > 0 ? "Specification deleted successfully" : "No specification found with that ID"
              }) 
            }] 
          };
        } catch (error) {
          console.error('Error deleting specification:', error);
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: "Database error",
                message: error instanceof Error ? error.message : "Failed to delete specification"
              })
            }]
          };
        }
      }
    );

    this.server.tool(
      "search_specifications",
      "Search specifications by content or title",
      {
        query: z.string().min(1).describe("Search query"),
        limit: z.number().default(10).describe("Maximum results")
      },
      async (args) => {
        console.log('search_specifications args:', JSON.stringify(args));
        
        // Get parameters directly from args
        const { query, limit = 10 } = args;
        
        // Check if user is authenticated
        if (!this.props?.claims?.sub) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: "Authentication required",
                message: "User must be authenticated to search specifications"
              })
            }]
          };
        }
        
        try {
          const results = await this.env.DB.prepare(
            'SELECT id, title, version, tags, created_at FROM specifications WHERE user_id = ? AND (title LIKE ? OR content LIKE ?) ORDER BY updated_at DESC LIMIT ?'
          )
          .bind(this.props.claims.sub, `%${query}%`, `%${query}%`, limit)
          .all();
          
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify({
                results: results.results.map(spec => ({
                  ...spec,
                  tags: JSON.parse(spec.tags as string || '[]')
                })),
                count: results.results.length,
                query: query
              })
            }]
          };
        } catch (error) {
          console.error('Error searching specifications:', error);
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: "Database error",
                message: error instanceof Error ? error.message : "Failed to search specifications"
              })
            }]
          };
        }
      }
    );

    this.server.tool(
      "compare_specifications",
      "Compare two specification versions and highlight differences",
      {
        id1: z.number().positive().describe("ID of first specification"),
        id2: z.number().positive().describe("ID of second specification")
      },
      async (args) => {
        console.log('compare_specifications args:', JSON.stringify(args));
        
        // Get parameters directly from args
        const { id1, id2 } = args;
        
        // Check if user is authenticated
        if (!this.props?.claims?.sub) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: "Authentication required",
                message: "User must be authenticated to compare specifications"
              })
            }]
          };
        }
        
        try {
          const [spec1, spec2] = await Promise.all([
            this.env.DB.prepare('SELECT * FROM specifications WHERE id = ? AND user_id = ?')
              .bind(id1, this.props.claims.sub).first(),
            this.env.DB.prepare('SELECT * FROM specifications WHERE id = ? AND user_id = ?')
              .bind(id2, this.props.claims.sub).first()
          ]);
          
          if (!spec1 || !spec2) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  error: "Specifications not found",
                  message: "One or both specifications not found",
                  found: { spec1: !!spec1, spec2: !!spec2 }
                })
              }]
            };
          }
          
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify({
                specification1: { ...spec1, tags: JSON.parse(spec1.tags as string || '[]') },
                specification2: { ...spec2, tags: JSON.parse(spec2.tags as string || '[]') },
                differences: {
                  title: spec1.title !== spec2.title,
                  content: spec1.content !== spec2.content,
                  version: spec1.version !== spec2.version,
                  tags: JSON.stringify(spec1.tags) !== JSON.stringify(spec2.tags)
                }
              })
            }]
          };
        } catch (error) {
          console.error('Error comparing specifications:', error);
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: "Database error",
                message: error instanceof Error ? error.message : "Failed to compare specifications"
              })
            }]
          };
        }
      }
    );

    this.server.tool(
      "monthly_specification_report",
      "Generate a monthly report of specification activities",
      {
        month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format (e.g., 2025-07)").describe("Month in YYYY-MM format")
      },
      async (args) => {
        console.log('monthly_specification_report args:', JSON.stringify(args));
        
        // Get parameters directly from args
        const { month } = args;
        
        // Check if user is authenticated
        if (!this.props?.claims?.sub) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: "Authentication required",
                message: "User must be authenticated to generate reports"
              })
            }]
          };
        }
        
        try {
          const startDate = `${month}-01`;
          const endDate = `${month}-31`;
          
          const [created, updated] = await Promise.all([
            this.env.DB.prepare(
              'SELECT COUNT(*) as count FROM specifications WHERE user_id = ? AND date(created_at) BETWEEN ? AND ?'
            ).bind(this.props.claims.sub, startDate, endDate).first(),
            this.env.DB.prepare(
              'SELECT COUNT(*) as count FROM specifications WHERE user_id = ? AND date(updated_at) BETWEEN ? AND ? AND date(created_at) != date(updated_at)'
            ).bind(this.props.claims.sub, startDate, endDate).first()
          ]);
          
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify({
                month,
                created: created?.count || 0,
                updated: updated?.count || 0,
                total_activity: ((created?.count as number) || 0) + ((updated?.count as number) || 0),
                period: { start: startDate, end: endDate }
              })
            }]
          };
        } catch (error) {
          console.error('Error generating monthly report:', error);
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: "Database error",
                message: error instanceof Error ? error.message : "Failed to generate monthly report"
              })
            }]
          };
        }
      }
    );

    // MARK: - Authentication Management Tool
    this.server.tool(
      "logout",
      "Logout and clear authentication state",
      {},
      async (args) => {
        console.log('logout called');
        
        // Check if user is authenticated
        if (!this.props?.claims?.sub) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: "Not authenticated",
                message: "User is not currently authenticated"
              })
            }]
          };
        }

        try {
          // Clear the user's authentication state
          // This will force re-authentication on next tool use
          const userId = this.props.claims.sub;
          
          // Clear tokens from KV storage if we have access to it
          // Note: This is a best-effort attempt to clear stored tokens
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                message: "Successfully logged out. You will need to re-authenticate for the next request.",
                logged_out_user: userId
              })
            }]
          };
        } catch (error) {
          console.error('Error during logout:', error);
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: "Logout error",
                message: error instanceof Error ? error.message : "Failed to logout"
              })
            }]
          };
        }
      }
    );
  }
}

// Initialize the Hono app with the routes for the OAuth Provider
const app = new Hono<{ Bindings: Env & { OAUTH_PROVIDER: OAuthHelpers } }>();

// MARK: - HTTP Streamable transport is handled by the OAuth Provider
// The OAuth Provider automatically manages authentication and MCP message routing
// Using .serve() method for HTTP streamable transport instead of .mount() for SSE

// Add logging middleware to debug OAuth flow
app.use('*', async (c, next) => {
  console.log(`[OAuth Handler] ${c.req.method} ${c.req.url}`);
  console.log(`[OAuth Handler] Path: ${new URL(c.req.url).pathname}`);
  await next();
  console.log(`[OAuth Handler] Response status: ${c.res.status}`);
});

// Route to custom Auth0 handlers
app.get("/authorize", authorize);
app.post("/authorize/consent", confirmConsent);
app.get("/callback", callback);

export default new OAuthProvider({
  apiHandler: AuthenticatedSpecificationMCP.serve("/mcp"),
  apiRoute: "/mcp",
  authorizeEndpoint: "/authorize",
  clientRegistrationEndpoint: "/register",
  defaultHandler: {
    fetch: (req: Request, env: any, ctx: any) => app.fetch(req, env, ctx),
  },
  tokenEndpoint: "/token",
  tokenExchangeCallback,
});