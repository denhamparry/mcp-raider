import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createRaiderServer } from "./server-tools.js";

// Create server instance
const server = createRaiderServer();

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Raider MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
