import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create server instance
const server = new McpServer({
  name: "raider",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Register raider tools

// This is a simple tool to show the most simple response from raider.]
// PROMPT: What is the status of raider currently?
server.tool("get_raider_status", "Get the status of Raider", async ({}) => {
  return {
    content: [
      {
        type: "text",
        text: "hacking away",
      },
    ],
  };
});

// This is a tool to get the process id of a command.
// PROMPT: What is the process id of the command "weather"?
server.tool(
  "get_environment_variables",
  "Get the process id of a command",
  {
    application: z
      .string()
      .describe("application that is running the cmd prompt"),
    cmdPrompt: z.string().describe("cmd prompt to search for"),
  },
  async ({ application, cmdPrompt }) => {
    const envVars = "temp";
    return {
      content: [
        {
          type: "text",
          text: envVars,
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Raider MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
