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

// This is a tool to get process IDs by searching for multiple strings
// PROMPT: What are the process IDs for processes containing "node" and "mcp-weather"?
server.tool(
  "get_process_id",
  "Get process IDs by searching for multiple strings in process list",
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

      // Parse each process line and extract information
      const lines = psOutput.trim().split("\n");
      const processes = lines.map((line, index) => {
        const columns = line.trim().split(/\s+/);
        const user = columns[0];
        const pid = columns[1];
        const cpu = columns[2];
        const mem = columns[3];
        const vsz = columns[4];
        const rss = columns[5];
        const tty = columns[6];
        const stat = columns[7];
        const started = columns[8];
        const time = columns[9];
        const command = columns.slice(10).join(" ");

        return {
          index: index + 1,
          user,
          pid,
          cpu,
          mem,
          vsz,
          rss,
          tty,
          stat,
          started,
          time,
          command,
        };
      });

      // Format the output for display
      const processInfo = processes
        .map(
          (proc) =>
            `Process ${proc.index}:
  PID: ${proc.pid}
  User: ${proc.user}
  CPU: ${proc.cpu}%
  Memory: ${proc.mem}%
  Status: ${proc.stat}
  Started: ${proc.started}
  Time: ${proc.time}
  Command: ${proc.command}
  ---`
        )
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Found ${processes.length} matching process(es):\n\n${processInfo}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error searching for processes: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  }
);

// This is a tool to get the environment variables of a process by PID.
// PROMPT: What are the environment variables of process 23164?
server.tool(
  "get_environment_variables",
  "Get the environment variables of a process by process ID",
  {
    processId: z
      .string()
      .describe("Process ID to get environment variables for"),
  },
  async ({ processId }) => {
    try {
      // Get environment variables using ps eww
      const { stdout: envOutput } = await execAsync(`ps eww -p ${processId}`);

      // Parse the environment variables
      const envLines = envOutput.trim().split("\n");
      if (envLines.length < 2) {
        return {
          content: [
            {
              type: "text",
              text: `Could not retrieve environment variables for process ${processId}. Process may not exist.`,
            },
          ],
        };
      }

      // Extract environment variables from the command line
      const commandLine = envLines[1];

      // Split the command line to separate command from environment variables
      // Environment variables appear after the command and are in KEY=VALUE format
      const parts = commandLine.split(/\s+/);
      const envVars: Record<string, string> = {};

      // Look for environment variables in the format KEY=VALUE
      parts.forEach((part) => {
        if (part.includes("=") && /^[A-Z_][A-Z0-9_]*=/.test(part)) {
          const [key, ...valueParts] = part.split("=");
          envVars[key] = valueParts.join("=");
        }
      });

      // Also get basic process info from the first line
      const headerLine = envLines[0];
      const processInfo = envLines[1];

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                processId: processId,
                environmentVariables: envVars,
                processInfo: processInfo,
                totalEnvVars: Object.keys(envVars).length,
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
            text: `Error retrieving environment variables for process ${processId}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  }
);

// PROMPT: I'd like to luck about and find out the variable names for the file
// /Users/lewis/git/denhamparry/mcp-weather/build/index.js
server.tool(
  "luck_about_and_find_out_variables_names",
  "Get a list of variables from a Node.js file that can be modified",
  {
    fileName: z.string().describe("The file name/path to analyze"),
  },
  async ({ fileName }) => {
    try {
      // Read the current file content
      const { stdout: fileContent } = await execAsync(`cat "${fileName}"`);

      const variables = new Set<string>();
      const lines = fileContent.split("\n");

      // Look for variable declarations and assignments
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();

        // Skip comments and empty lines
        if (
          trimmedLine.startsWith("//") ||
          trimmedLine.startsWith("/*") ||
          !trimmedLine
        ) {
          return;
        }

        // Match variable declarations: const/let/var variableName = value
        const declareMatch = trimmedLine.match(
          /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/
        );
        if (declareMatch) {
          variables.add(declareMatch[1]);
        }

        // Match property assignments: object.property = value
        const propMatch = trimmedLine.match(
          /([a-zA-Z_$][a-zA-Z0-9_$]*\.[a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/
        );
        if (propMatch) {
          variables.add(propMatch[1]);
        }

        // Match simple assignments: variableName = value
        const assignMatch = trimmedLine.match(
          /^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/
        );
        if (assignMatch && !declareMatch) {
          variables.add(assignMatch[1]);
        }

        // Match function parameters and object properties with values
        const functionMatch = trimmedLine.match(
          /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*[0-9]/
        );
        if (functionMatch) {
          variables.add(functionMatch[1]);
        }
      });

      const variablesList = Array.from(variables).sort();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                fileName: fileName,
                totalVariables: variablesList.length,
                variables: variablesList,
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
            text: `Error analyzing file ${fileName}: ${
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
