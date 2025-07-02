import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiClient } from '../common/api-client.js';

export const registerProjectTools = (server: McpServer) => {
	// Get projects tool
	server.tool(
		'get_projects',
		'Get list of projects for an organization',
		{
			organizationId: z.string().describe('The organization ID'),
			tenantId: z.string().optional().describe('The tenant ID'),
			page: z.number().optional().describe('Page number for pagination'),
			limit: z.number().optional().describe('Number of items per page')
		},
		async ({ organizationId, tenantId, page = 1, limit = 10 }) => {
			try {
				const params = {
					organizationId,
					...(tenantId && { tenantId }),
					page,
					limit
				};

				const response = await apiClient.get('/api/organization-project', { params });

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(response, null, 2)
						}
					]
				};
			} catch (error) {
				console.error('Error fetching projects:', error);
				throw new Error('Failed to fetch projects');
			}
		}
	);

	// Create project tool
	server.tool(
		'create_project',
		'Create a new project',
		{
			name: z.string().describe('Project name'),
			organizationId: z.string().describe('The organization ID'),
			tenantId: z.string().optional().describe('The tenant ID'),
			description: z.string().optional().describe('Project description'),
			code: z.string().optional().describe('Project code'),
			color: z.string().optional().describe('Project color'),
			billable: z.boolean().optional().describe('Whether the project is billable'),
			billingFlat: z.boolean().optional().describe('Whether to use flat billing'),
			public: z.boolean().optional().describe('Whether the project is public'),
			startDate: z.string().optional().describe('Project start date (ISO format)'),
			endDate: z.string().optional().describe('Project end date (ISO format)')
		},
		async (params) => {
			try {
				const projectData = {
					...params,
					startDate: params.startDate ? new Date(params.startDate) : undefined,
					endDate: params.endDate ? new Date(params.endDate) : undefined
				};

				const response = await apiClient.post('/api/organization-project', projectData);

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(response, null, 2)
						}
					]
				};
			} catch (error) {
				console.error('Error creating project:', error);
				throw new Error('Failed to create project');
			}
		}
	);

	// Get project by ID tool
	server.tool(
		'get_project',
		'Get a specific project by ID',
		{
			id: z.string().describe('The project ID'),
			relations: z.array(z.string()).optional().describe('Relations to include')
		},
		async ({ id, relations }) => {
			try {
				const params = {
					...(relations && { relations })
				};

				const response = await apiClient.get(`/api/organization-project/${id}`, { params });

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(response, null, 2)
						}
					]
				};
			} catch (error) {
				console.error('Error fetching project:', error);
				throw new Error('Failed to fetch project');
			}
		}
	);

	// Update project tool
	server.tool(
		'update_project',
		'Update an existing project',
		{
			id: z.string().describe('The project ID'),
			name: z.string().optional().describe('Project name'),
			description: z.string().optional().describe('Project description'),
			code: z.string().optional().describe('Project code'),
			color: z.string().optional().describe('Project color'),
			billable: z.boolean().optional().describe('Whether the project is billable'),
			public: z.boolean().optional().describe('Whether the project is public'),
			startDate: z.string().optional().describe('Project start date (ISO format)'),
			endDate: z.string().optional().describe('Project end date (ISO format)')
		},
		async ({ id, ...updateData }) => {
			try {
				const projectData = {
					...updateData,
					startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
					endDate: updateData.endDate ? new Date(updateData.endDate) : undefined
				};

				const response = await apiClient.put(`/api/organization-project/${id}`, projectData);

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(response, null, 2)
						}
					]
				};
			} catch (error) {
				console.error('Error updating project:', error);
				throw new Error('Failed to update project');
			}
		}
	);
};
