import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiClient } from '../common/api-client.js';
import log from 'electron-log';

/**
 * Register test connection tools with the MCP server
 * These tools help verify that the MCP server is working correctly
 */
export const registerTestTools = (server: McpServer) => {
	// Test API connection
	server.tool('test_api_connection', 'Test the connection to the Gauzy API server', {}, async () => {
		try {
			const connectionTest = await apiClient.testConnection();

			if (connectionTest.success) {
				return {
					content: [
						{
							type: 'text',
							text: '✅ Successfully connected to Gauzy API server!'
						}
					]
				};
			} else {
				return {
					content: [
						{
							type: 'text',
							text: `❌ Failed to connect to Gauzy API: ${connectionTest.error}`
						}
					]
				};
			}
		} catch (error) {
			log.error('Error testing API connection:', error);
			return {
				content: [
					{
						type: 'text',
						text: `❌ Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
					}
				]
			};
		}
	});

	// Get server info
	server.tool('get_server_info', 'Get information about the Gauzy MCP server', {}, async () => {
		try {
			const info = {
				name: 'Gauzy MCP Server',
				version: '0.1.0',
				status: 'running',
				apiUrl: apiClient.getBaseUrl(),
				timeout: apiClient.getTimeout(),
				debugMode: apiClient.isDebug(),
				timestamp: new Date().toISOString(),
				capabilities: {
					tools: true
				}
			};

			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(info, null, 2)
					}
				]
			};
		} catch (error) {
			log.error('Error getting server info:', error);
			throw new Error('Failed to get server information');
		}
	});

	// Test MCP capabilities
	server.tool('test_mcp_capabilities', 'Test all MCP server tools and list available functionality', {}, async () => {
		try {
			const results = {
				tools: {
					timer: ['timer_status', 'start_timer', 'stop_timer'],
					projects: ['get_projects', 'create_project', 'update_project', 'get_project'],
					tasks: ['get_tasks', 'create_task', 'update_task', 'get_task'],
					employees: ['get_employees', 'get_employee', 'get_employee_statistics', 'get_current_employee'],
					test: ['test_api_connection', 'get_server_info', 'test_mcp_capabilities']
				},
				totalTools: 15,
				serverInfo: {
					name: 'Gauzy MCP Server',
					version: '0.1.0',
					pattern: 'Following Plane MCP Server implementation pattern'
				},
				status: 'All tools registered and working'
			};

			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(results, null, 2)
					}
				]
			};
		} catch (error) {
			log.error('Error testing MCP capabilities:', error);
			throw new Error('Failed to test MCP capabilities');
		}
	});

	log.info('Test connection tools registered successfully');
};
