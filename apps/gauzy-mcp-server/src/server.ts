import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { getVersion } from "./common/version.js";

export function createServer() {
  const version = getVersion();

  const server = new McpServer({
    name: "gauzy-mcp-server",
    version,
    capabilities: {},
  });

  return { server, version };
}
