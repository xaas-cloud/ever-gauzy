# Gauzy MCP Server

A Model Context Protocol (MCP) server implementation for Ever Gauzy as an Electron desktop application. This server provides AI assistants like Claude with access to Gauzy's time tracking, project management, task management, and employee management capabilities.

Following the [Plane MCP Server](https://github.com/makeplane/plane-mcp-server) implementation pattern for clean, tool-focused MCP integration.

## Features

### 🛠️ Tools

-   **Timer Management**: Start, stop, and check timer status
-   **Project Management**: Create, update, and retrieve project information
-   **Task Management**: Manage tasks and assignments
-   **Employee Management**: Access employee data and statistics
-   **Connection Testing**: Verify API connectivity and server status

## Architecture

This application combines:

1. **Electron Desktop App**: Provides a user interface for managing the MCP server
2. **MCP Server**: Implements the Model Context Protocol for AI assistant integration
3. **Gauzy API Integration**: Connects to your Gauzy backend for data access

## Installation & Setup

### Prerequisites

-   Node.js 18+ and Yarn
-   Running Gauzy backend server
-   (Optional) Claude for Desktop for testing

### 1. Build the Application

```bash
# From the project root
yarn nx build server-mcp --configuration=production
```

### 2. Environment Configuration

Create a `.env` file in the `apps/server-mcp` directory:

```env
# Gauzy API Configuration
GAUZY_API_URL=http://localhost:3000
API_TIMEOUT=30000

# Authentication (if required)
# GAUZY_API_TOKEN=your-api-token-here

# Default Organization and Tenant IDs
GAUZY_DEFAULT_ORGANIZATION_ID=your-org-id
GAUZY_DEFAULT_TENANT_ID=your-tenant-id

# Debug Settings
GAUZY_MCP_DEBUG=false
NODE_ENV=production
```

### 3. Running the Application

#### As Electron Desktop App

```bash
yarn start
```

#### As Standalone MCP Server (for Claude Desktop)

```bash
yarn start:mcp-stdio
```

#### Development Mode

```bash
yarn dev        # Electron app
yarn dev:mcp    # MCP server only
```

## Integration with Claude for Desktop

To use this MCP server with Claude for Desktop, add the following to your Claude configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
	"mcpServers": {
		"gauzy": {
			"command": "node",
			"args": ["/absolute/path/to/ever-gauzy/apps/server-mcp/build/instance/mcp-server.js"],
			"env": {
				"GAUZY_API_URL": "http://localhost:3000",
				"GAUZY_DEFAULT_TENANT_ID": "your-tenant-id"
			}
		}
	}
}
```

## Usage Examples

### With Claude for Desktop

Once configured, you can ask Claude questions like:

-   "What's my current timer status?"
-   "Show me a summary of time tracked today"
-   "Create a new task for the mobile app project"
-   "List all active projects in the organization"
-   "Get employee statistics for this month"

## Available Tools

### Timer Tools

-   `timer_status` - Get current timer status
-   `start_timer` - Start a new timer
-   `stop_timer` - Stop the running timer

### Project Tools

-   `get_projects` - List organization projects
-   `get_project` - Get specific project details
-   `create_project` - Create a new project
-   `update_project` - Update project information

### Task Tools

-   `get_tasks` - List tasks
-   `get_task` - Get specific task details
-   `create_task` - Create a new task
-   `update_task` - Update task information

### Employee Tools

-   `get_employees` - List employees
-   `get_employee` - Get specific employee details
-   `get_employee_statistics` - Get employee time tracking statistics
-   `get_current_employee` - Get current authenticated employee

### Test Tools

-   `test_api_connection` - Test connection to Gauzy API
-   `get_server_info` - Get MCP server information
-   `test_mcp_capabilities` - List all available tools

## Development

### Project Structure

```
apps/server-mcp/
├── src/
│   ├── instance/            # MCP server implementation
│   │   ├── mcp-server.ts    # Main MCP server
│   │   └── mcp-server-manager.ts # Server lifecycle management
│   ├── tools/              # MCP tool implementations
│   │   ├── timer.ts
│   │   ├── projects.ts
│   │   ├── tasks.ts
│   │   ├── employees.ts
│   │   └── test-connection.ts
│   ├── common/            # Shared utilities
│   ├── preload/           # Electron preload scripts
│   ├── environments/      # Environment configurations
│   └── electron-main.ts   # Electron main process
├── package.json
└── README.md
```

### Adding New Tools

1. Create a new tool file in `src/tools/`
2. Implement the tool following the MCP SDK patterns
3. Register the tool in `src/instance/mcp-server.ts`

Example:

```typescript
// src/tools/my-tool.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiClient } from '../common/api-client.js';

export const registerMyTool = (server: McpServer) => {
	server.tool(
		'my_tool_name',
		'Description of what the tool does',
		{
			param1: z.string().describe('Description of parameter')
		},
		async ({ param1 }) => {
			try {
				const response = await apiClient.get(`/api/my-endpoint/${param1}`);
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(response, null, 2)
						}
					]
				};
			} catch (error) {
				console.error('Error in my tool:', error);
				throw new Error('Failed to execute my tool');
			}
		}
	);
};
```

## Configuration

### Environment Variables

| Variable                        | Description              | Default                 |
| ------------------------------- | ------------------------ | ----------------------- |
| `GAUZY_API_URL`                 | Gauzy backend API URL    | `http://localhost:3000` |
| `API_TIMEOUT`                   | API request timeout (ms) | `30000`                 |
| `GAUZY_DEFAULT_ORGANIZATION_ID` | Default organization ID  | ``                      |
| `GAUZY_DEFAULT_TENANT_ID`       | Default tenant ID        | ``                      |
| `GAUZY_MCP_DEBUG`               | Enable debug logging     | `false`                 |
| `NODE_ENV`                      | Environment mode         | `production`            |

## Troubleshooting

### Common Issues

1. **Connection Failed**: Check that your Gauzy backend is running and accessible
2. **Authentication Errors**: Ensure API token is configured if required
3. **MCP Server Not Found**: Verify the build path in Claude Desktop configuration
4. **Tools Not Working**: Check the Gauzy API endpoints and permissions

### Debug Mode

Enable debug logging:

```env
GAUZY_MCP_DEBUG=true
NODE_ENV=development
```

### Logs

-   **Electron App**: Check the developer console in the Electron app
-   **MCP Server**: Logs are written to stderr when running standalone
-   **Claude Desktop**: Check `~/Library/Logs/Claude/mcp*.log` on macOS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

AGPL-3.0 - see LICENSE file for details

## Support

For issues and questions:

-   GitHub Issues: [ever-co/ever-gauzy](https://github.com/ever-co/ever-gauzy/issues)
-   Documentation: [gauzy.co](https://gauzy.co)
-   Community: [Discord](https://discord.gg/hKQfn4j)
