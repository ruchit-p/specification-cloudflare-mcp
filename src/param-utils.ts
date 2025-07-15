/**
 * Utility functions for handling MCP parameter passing issues
 */

/**
 * Extract parameters from various possible MCP parameter structures
 * MCP clients may pass parameters in different formats
 */
export function extractMCPParams(rawParams: any): Record<string, any> {
  console.log('[extractMCPParams] Raw params:', JSON.stringify(rawParams));
  
  // If no params, return empty object
  if (!rawParams) {
    return {};
  }
  
  // If params is already a plain object with our expected properties
  if (typeof rawParams === 'object' && !Array.isArray(rawParams)) {
    // IMPORTANT: Filter out metadata fields that are not actual parameters
    const metadata = ['signal', 'requestId', '_meta', '_context'];
    
    // Check if this looks like it only contains metadata (no actual params)
    const keys = Object.keys(rawParams);
    const hasOnlyMetadata = keys.length > 0 && keys.every(key => metadata.includes(key));
    
    if (hasOnlyMetadata) {
      console.log('[extractMCPParams] Detected metadata-only object, parameters might be missing');
      // This suggests the actual parameters weren't passed correctly by the client
      return {};
    }
    
    // Check if parameters are nested in a 'params' property
    if (rawParams.params && typeof rawParams.params === 'object') {
      return rawParams.params;
    }
    
    // Check if parameters are nested in an 'arguments' property
    if (rawParams.arguments && typeof rawParams.arguments === 'object') {
      return rawParams.arguments;
    }
    
    // Check if this is a JSON-RPC style request
    if (rawParams.method && rawParams.params) {
      return rawParams.params;
    }
    
    // Filter out metadata fields and return the rest
    const filtered: Record<string, any> = {};
    for (const [key, value] of Object.entries(rawParams)) {
      if (!metadata.includes(key)) {
        filtered[key] = value;
      }
    }
    
    return filtered;
  }
  
  // If params is a string, try to parse it as JSON
  if (typeof rawParams === 'string') {
    try {
      const parsed = JSON.parse(rawParams);
      return extractMCPParams(parsed); // Recursively extract from parsed object
    } catch (e) {
      console.error('[extractMCPParams] Failed to parse string params:', e);
      return {};
    }
  }
  
  // For any other type, return empty object
  return {};
}

/**
 * Safely get a string parameter with default value
 */
export function getStringParam(params: Record<string, any>, key: string, defaultValue: string = ''): string {
  const value = params[key];
  if (typeof value === 'string') {
    return value;
  }
  if (value === null || value === undefined) {
    return defaultValue;
  }
  // Try to convert to string
  return String(value);
}

/**
 * Safely get a number parameter with default value
 */
export function getNumberParam(params: Record<string, any>, key: string, defaultValue: number = 0): number {
  const value = params[key];
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

/**
 * Safely get an array parameter with default value
 */
export function getArrayParam(params: Record<string, any>, key: string, defaultValue: any[] = []): any[] {
  const value = params[key];
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }
  return defaultValue;
}