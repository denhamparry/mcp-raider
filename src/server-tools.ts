import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const execAsync = promisify(exec);

export function createRaiderServer(): McpServer {
  const server = new McpServer({
    name: "raider",
    version: "1.0.0",
    capabilities: {
      resources: {},
      tools: {},
    },
  });

  registerRaiderTools(server);

  return server;
}

export function registerRaiderTools(server: McpServer) {
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
        // Check if we're on macOS
        const { stdout: osType } = await execAsync("uname");
        const isMacOS = osType.trim() === "Darwin";

        const envVars: Record<string, string> = {};
        let processInfo = "";

        if (isMacOS) {
          // On macOS, use ps -E -p to get environment variables
          const { stdout: psOutput } = await execAsync(`ps -E -p ${processId}`);

          // Parse the ps output
          const lines = psOutput.trim().split("\n");

          // Skip the header line if present
          const dataLines = lines.filter((line) => !line.includes("PID"));

          if (dataLines.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: `Process ${processId} not found`,
                },
              ],
            };
          }

          // Extract environment variables from the output
          // The format is typically: PID TTY TIME CMD ENV_VAR=value ENV_VAR2=value2...
          const processLine = dataLines[0];

          // Find where environment variables start (after the command)
          // Look for the first = sign that's part of an environment variable
          const envStartMatch = processLine.match(/\s+([A-Z_][A-Z0-9_]*=)/);

          if (envStartMatch && envStartMatch.index) {
            const envString = processLine.substring(envStartMatch.index).trim();

            // Parse environment variables
            // Match KEY=value pairs, handling values that might contain spaces
            const envRegex = /([A-Z_][A-Z0-9_]*)=([^\s]+(?:\s+(?![A-Z_][A-Z0-9_]*=))*)/g;
            let match;

            while ((match = envRegex.exec(envString)) !== null) {
              const key = match[1];
              const value = match[2].trim();
              envVars[key] = value;
            }
          }

          // Get process info
          processInfo = `Process ${processId} (macOS)`;
        } else {
          // On Linux, use /proc/PID/environ
          const { stdout: envOutput } = await execAsync(
            `cat /proc/${processId}/environ`
          );

          // Parse the environment variables
          // The environ file contains null-separated KEY=VALUE pairs
          const envPairs = envOutput
            .split("\0")
            .filter((pair) => pair.length > 0);

          // Parse each environment variable
          envPairs.forEach((pair) => {
            const equalIndex = pair.indexOf("=");
            if (equalIndex > 0) {
              const key = pair.substring(0, equalIndex);
              const value = pair.substring(equalIndex + 1);
              envVars[key] = value;
            }
          });

          // Get process info for context using /proc/PID/cmdline
          try {
            const { stdout: cmdline } = await execAsync(
              `cat /proc/${processId}/cmdline`
            );
            // cmdline contains null-separated arguments, replace nulls with spaces
            const command =
              cmdline.replace(/\0/g, " ").trim() || "Unknown command";
            processInfo = `PID: ${processId}, Command: ${command}`;
          } catch {
            // If /proc/PID/cmdline fails, just use the PID
            processInfo = `Process ${processId}`;
          }
        }

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
                  platform: isMacOS ? "macOS" : "Linux",
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
    "luck_about_and_find_out_output_string_names",
    "Get a list of output strings from a Node.js file in $(variable_name) format",
    {
      fileName: z.string().describe("The file name/path to analyze"),
    },
    async ({ fileName }) => {
      try {
        // Read the current file content
        const { stdout: fileContent } = await execAsync(`cat "${fileName}"`);

        const outputStrings = new Set<string>();

        // Look for template literal variables in the format $(variable_name)
        // This regex matches ${variable_name} patterns in template literals
        const templateVariableRegex = /\$\{([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)*)\}/g;

        let match;
        while ((match = templateVariableRegex.exec(fileContent)) !== null) {
          outputStrings.add(`$(${match[1]})`);
        }

        const outputStringsList = Array.from(outputStrings).sort();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  fileName: fileName,
                  totalOutputStrings: outputStringsList.length,
                  outputStrings: outputStringsList,
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

  server.tool(
    "luck_about_and_find_out_replace_string_values",
    "Modify an output string in a Node.js file by setting it to a new value for $(variable_name) format",
    {
      fileName: z.string().describe("The file name/path to modify"),
      outputStringName: z
        .string()
        .describe(
          "The output string name to modify in $(variable_name) format"
        ),
      value: z.string().describe("The new value to set for the output string"),
    },
    async ({ fileName, outputStringName, value }) => {
      try {
        // Read the current file content
        const { stdout: fileContent } = await execAsync(`cat "${fileName}"`);

        let modificationCount = 0;

        // Extract the actual variable name from $(variable_name) format
        const actualVariableName = outputStringName.replace(/^\$\(|\)$/g, "");

        // Replace template literal variables: ${variable_name} with the new value
        const templateVariableRegex = new RegExp(
          `\\$\\{${actualVariableName.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          )}\\}`,
          "g"
        );

        const updatedContent = fileContent.replace(
          templateVariableRegex,
          (match) => {
            modificationCount++;
            return value;
          }
        );

        // Write the updated content back to the file
        await execAsync(`cat > "${fileName}" << 'EOF'
${updatedContent}
EOF`);

        return {
          content: [
            {
              type: "text",
              text: `Successfully updated ${fileName}. Modified ${modificationCount} occurrence(s) of output string '${outputStringName}' to value '${value}'.`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error modifying file ${fileName}: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    "luck_about_and_find_out_process_kill",
    "Kill a process by its process ID",
    {
      processId: z.string().describe("The process ID to kill"),
    },
    async ({ processId }) => {
      try {
        // First, verify the process exists
        const { stdout: psOutput } = await execAsync(`ps -p ${processId}`);

        if (!psOutput.trim() || psOutput.includes("PID")) {
          // If only header is returned, process doesn't exist
          const lines = psOutput.trim().split("\n");
          if (lines.length <= 1) {
            return {
              content: [
                {
                  type: "text",
                  text: `Process ${processId} does not exist or is not accessible.`,
                },
              ],
            };
          }
        }

        // Kill the process
        await execAsync(`kill ${processId}`);

        // Verify the process was killed by checking if it still exists
        try {
          const { stdout: checkOutput } = await execAsync(`ps -p ${processId}`);
          const checkLines = checkOutput.trim().split("\n");
          if (checkLines.length <= 1) {
            return {
              content: [
                {
                  type: "text",
                  text: `Successfully killed process ${processId}.`,
                },
              ],
            };
          } else {
            return {
              content: [
                {
                  type: "text",
                  text: `Process ${processId} kill command sent, but process may still be running. You may need to use 'kill -9 ${processId}' for forceful termination.`,
                },
              ],
            };
          }
        } catch (checkError) {
          // If ps command fails, it likely means the process is gone
          return {
            content: [
              {
                type: "text",
                text: `Successfully killed process ${processId}.`,
              },
            ],
          };
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error killing process ${processId}: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );
}
