# mcp-raider

A Model Context Protocol (MCP) server that provides low-level system debugging
and process manipulation capabilities for local development environments.

## Overview

mcp-raider is a powerful debugging and system introspection tool that exposes
direct access to process management, environment variable extraction, and
runtime code modification capabilities through the MCP protocol. It's designed
for advanced debugging scenarios where you need to inspect running processes,
extract sensitive configuration data, or dynamically modify application behavior
without restarts.

**⚠️ Security Warning**: This tool provides unrestricted access to system
processes and can read/modify any accessible files. Only use in trusted,
isolated development environments. Never deploy to production or expose to
untrusted networks.

## Technical Capabilities

### Process Discovery & Management

- **Multi-filter process search**: Find processes using multiple grep filters
  simultaneously, parsing full process information including PID, CPU/memory
  usage, user, and command line arguments
- **Cross-platform process termination**: Kill processes by PID with
  verification of termination status

### Environment Variable Extraction

- **Runtime configuration harvesting**: Extract complete environment variables
  from any running process (requires appropriate permissions)
- **Cross-platform support**: Automatically detects and uses platform-specific
  methods:
  - Linux: Reads from `/proc/[PID]/environ`
  - macOS: Uses `ps -E -p` for environment extraction
- **Structured output**: Returns parsed JSON with all environment variables,
  useful for extracting API keys, database credentials, and configuration from
  running services

### Dynamic Code Modification

- **Template literal scanning**: Identify all template literal variables in
  JavaScript/Node.js files using `${variable}` syntax
- **Hot-patching capabilities**: Replace template literal values in running
  application code without restarts
- **Pattern matching**: Uses regex-based scanning to find and catalog all
  dynamic strings in JavaScript codebases

## Use Cases

### Security Research & Penetration Testing

- Extract credentials and secrets from running processes
- Identify misconfigurations in development environments
- Audit environment variable exposure across services

### Advanced Debugging

- Inspect process state without attaching debuggers
- Compare environment configurations between working and failing instances
- Track down configuration-related bugs by examining runtime values

### Development Operations

- Hot-patch configuration values for testing
- Kill hung processes programmatically
- Discover resource-consuming processes with detailed metrics

### Dynamic Testing

- Modify application behavior by changing template literals
- Test different configuration scenarios without redeployment
- Inject test values into running applications

## Installation

### From npm

```bash
npm install -g mcp-raider
```

### From source

```bash
git clone https://github.com/denhamparry/mcp-raider.git
cd mcp-raider
npm install
npm run build
```

## Docker Usage

### Prerequisites

- Docker installed on your system
- Task (taskfile) installed for convenient commands (optional but recommended)

### Building and Running with Docker

1. **Set Docker Registry (optional)**

   ```bash
   export DOCKER_REGISTRY=your-registry.com/your-username
   # Or use Docker Hub by default
   ```

2. **Build the Docker image**

   ```bash
   task build
   # Or without Task:
   docker build -t ${DOCKER_REGISTRY:-docker.io}/mcp-raider:latest .
   ```

3. **Push to registry**

   ```bash
   task push
   # Or without Task:
   docker push ${DOCKER_REGISTRY:-docker.io}/mcp-raider:latest
   ```

4. **Run the container**

   ```bash
   task run
   # Or without Task:
   docker run -it --rm ${DOCKER_REGISTRY:-docker.io}/mcp-raider:latest
   ```

### Available Task Commands

- `task build` - Build Docker image
- `task push` - Build and push image to registry
- `task run` - Run Docker container
- `task run-local` - Run with local development settings (mounts current
  directory)
- `task shell` - Run container with shell access for debugging
- `task clean` - Remove Docker image

### Custom Image Tags

```bash
# Build with custom tag
IMAGE_TAG=v1.0.0 task build

# Use custom registry and tag
DOCKER_REGISTRY=myregistry.com/myuser IMAGE_TAG=dev task push
```

## MCP Tools API

### `get_raider_status`

Simple health check that returns "hacking away" - useful for verifying MCP
server connectivity.

### `get_process_id`

**Parameters**: `searchStrings: string[]` Executes
`ps auxww | grep [filter1] | grep [filter2] ...` to find processes matching all
provided filters. Returns detailed process information including:

- PID, user, CPU/memory usage percentages
- Virtual/resident memory sizes
- TTY, process state, start time
- Full command line with arguments

### `get_environment_variables`

**Parameters**: `processId: string` Extracts complete environment variable set
from a running process:

- Linux: Reads `/proc/[PID]/environ` (null-separated KEY=VALUE pairs)
- macOS: Parses `ps -E -p [PID]` output
- Returns JSON structure with all environment variables, process info, and
  platform details

### `luck_about_and_find_out_output_string_names`

**Parameters**: `fileName: string` Scans JavaScript/TypeScript files for
template literal variables using regex:
`/\$\{([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)*)\}/g` Returns all
unique variable names found in `$(variable)` format.

### `luck_about_and_find_out_replace_string_values`

**Parameters**: `fileName: string, outputStringName: string, value: string`
Performs in-place modification of JavaScript files by replacing template literal
values:

- Accepts variable names in `$(variable)` format
- Replaces all occurrences of `${variable}` with the provided value
- Uses shell heredoc for safe file writing

### `luck_about_and_find_out_process_kill`

**Parameters**: `processId: string` Terminates a process using standard POSIX
signals:

- Verifies process existence before attempting termination
- Sends SIGTERM by default
- Validates termination success and suggests `kill -9` if process persists

## Technical Architecture

### Transport Layers

The server implements two transport mechanisms:

- **stdio transport** (`src/index.ts`): Traditional MCP communication over
  standard input/output streams
- **HTTP transport** (`src/http.ts`): RESTful endpoint at `/mcp` (POST) using
  streamable HTTP transport on port 3001

### Implementation Details

- Built on `@modelcontextprotocol/sdk` v1.16.0
- All system operations use Node.js `child_process.exec()` with promisified
  wrappers
- Cross-platform compatibility through runtime OS detection (`uname` check)
- Stateless HTTP mode creates new server instances per request
- All tools return structured JSON responses wrapped in MCP content format

### Security Considerations

- **No sandboxing**: Direct execution of system commands without isolation
- **No authentication**: Transport layers have no built-in auth mechanisms
- **File system access**: Unrestricted read/write to any accessible paths
- **Process access**: Can read memory-mapped files and environ data
- **Command injection risk**: User inputs passed to shell commands

## MCP Configuration

Add to your MCP settings configuration:

```json
{
  "mcpServers": {
    "raider": {
      "command": "raider"
    }
  }
}
```

For Docker usage:

```json
{
  "mcpServers": {
    "raider": {
      "command": "docker",
      "args": ["run", "-it", "--rm", "your-registry.com/mcp-raider:latest"]
    }
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

## License

MIT
