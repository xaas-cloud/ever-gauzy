import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiClient } from '../common/api-client.js';

export const registerTaskTools = (server: McpServer) => {
	// Get tasks tool
	server.tool(
		'get_tasks',
		'Get list of tasks for an organization or project',
		{
			organizationId: z.string().describe('The organization ID'),
			tenantId: z.string().optional().describe('The tenant ID'),
			projectId: z.string().optional().describe('Filter by project ID'),
			employeeId: z.string().optional().describe('Filter by employee ID'),
			status: z.string().optional().describe('Filter by task status'),
			page: z.number().optional().describe('Page number for pagination'),
			limit: z.number().optional().describe('Number of items per page')
		},
		async ({ organizationId, tenantId, projectId, employeeId, status, page = 1, limit = 10 }) => {
			try {
				const params = {
					organizationId,
					...(tenantId && { tenantId }),
					...(projectId && { projectId }),
					...(employeeId && { employeeId }),
					...(status && { status }),
					page,
					limit
				};

				const response = await apiClient.get('/api/tasks', { params });

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(response, null, 2)
						}
					]
				};
			} catch (error) {
				console.error('Error fetching tasks:', error);
				throw new Error('Failed to fetch tasks');
			}
		}
	);

	// Create task tool
	server.tool(
		'create_task',
		'Create a new task',
		{
			title: z.string().describe('Task title'),
			organizationId: z.string().describe('The organization ID'),
			tenantId: z.string().optional().describe('The tenant ID'),
			projectId: z.string().optional().describe('The project ID'),
			description: z.string().optional().describe('Task description'),
			status: z.string().optional().describe('Task status'),
			priority: z.string().optional().describe('Task priority'),
			size: z.string().optional().describe('Task size'),
			dueDate: z.string().optional().describe('Task due date (ISO format)'),
			estimate: z.number().optional().describe('Task estimate in hours'),
			members: z
				.array(
					z.object({
						id: z.string()
					})
				)
				.optional()
				.describe('Task members')
		},
		async (params) => {
			try {
				const taskData = {
					...params,
					dueDate: params.dueDate ? new Date(params.dueDate) : undefined
				};

				const response = await apiClient.post('/api/tasks', taskData);

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(response, null, 2)
						}
					]
				};
			} catch (error) {
				console.error('Error creating task:', error);
				throw new Error('Failed to create task');
			}
		}
	);

	// Get task by ID tool
	server.tool(
		'get_task',
		'Get a specific task by ID',
		{
			id: z.string().describe('The task ID'),
			relations: z.array(z.string()).optional().describe('Relations to include')
		},
		async ({ id, relations }) => {
			try {
				const params = {
					...(relations && { relations })
				};

				const response = await apiClient.get(`/api/tasks/${id}`, { params });

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(response, null, 2)
						}
					]
				};
			} catch (error) {
				console.error('Error fetching task:', error);
				throw new Error('Failed to fetch task');
			}
		}
	);

	// Update task tool
	server.tool(
		'update_task',
		'Update an existing task',
		{
			id: z.string().describe('The task ID'),
			title: z.string().optional().describe('Task title'),
			description: z.string().optional().describe('Task description'),
			status: z.string().optional().describe('Task status'),
			priority: z.string().optional().describe('Task priority'),
			size: z.string().optional().describe('Task size'),
			dueDate: z.string().optional().describe('Task due date (ISO format)'),
			estimate: z.number().optional().describe('Task estimate in hours')
		},
		async ({ id, ...updateData }) => {
			try {
				const taskData = {
					...updateData,
					dueDate: updateData.dueDate ? new Date(updateData.dueDate) : undefined
				};

				const response = await apiClient.put(`/api/tasks/${id}`, taskData);

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(response, null, 2)
						}
					]
				};
			} catch (error) {
				console.error('Error updating task:', error);
				throw new Error('Failed to update task');
			}
		}
	);

	// Delete task tool
	server.tool(
		'delete_task',
		'Delete a task by ID',
		{
			id: z.string().describe('The task ID')
		},
		async ({ id }) => {
			try {
				const response = await apiClient.delete(`/api/tasks/${id}`);

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify({ success: true, message: 'Task deleted successfully' }, null, 2)
						}
					]
				};
			} catch (error) {
				console.error('Error deleting task:', error);
				throw new Error('Failed to delete task');
			}
		}
	);
};
