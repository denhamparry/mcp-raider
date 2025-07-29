# mcp-raider

A Model Context Protocol (MCP) server that provides debugging and process
management tools for local development environments.

## Overview

mcp-raider is designed to be a debugging tool that allows interaction with
processes and applications running on the same machine as the MCP server. It
provides tools for process discovery, environment inspection, file manipulation,
and process management.

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

## Available Tools

1. **`get_raider_status`** - Simple health check tool
2. **`get_process_id`** - Find processes by searching with multiple string
   filters
3. **`get_environment_variables`** - Extract environment variables from a
   specific process
4. **`luck_about_and_find_out_output_string_names`** - Scan Node.js files for
   template literal variables
5. **`luck_about_and_find_out_replace_string_values`** - Replace template
   literal variables in Node.js files
6. **`luck_about_and_find_out_process_kill`** - Terminate processes by PID

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
