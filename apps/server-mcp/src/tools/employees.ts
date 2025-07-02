import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiClient } from '../common/api-client.js';

export const registerEmployeeTools = (server: McpServer) => {
	// Get employees tool
	server.tool(
		'get_employees',
		'Get list of employees for an organization',
		{
			organizationId: z.string().describe('The organization ID'),
			tenantId: z.string().optional().describe('The tenant ID'),
			page: z.number().optional().describe('Page number for pagination'),
			limit: z.number().optional().describe('Number of items per page'),
			search: z.string().optional().describe('Search term for employee name or email')
		},
		async ({ organizationId, tenantId, page = 1, limit = 10, search }) => {
			try {
				const params = {
					organizationId,
					...(tenantId && { tenantId }),
					page,
					limit,
					...(search && { search })
				};

				const response = await apiClient.get('/api/employee', { params });

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(response, null, 2)
						}
					]
				};
			} catch (error) {
				console.error('Error fetching employees:', error);
				throw new Error('Failed to fetch employees');
			}
		}
	);

	// Get employee by ID tool
	server.tool(
		'get_employee',
		'Get a specific employee by ID',
		{
			id: z.string().describe('The employee ID'),
			relations: z.array(z.string()).optional().describe('Relations to include')
		},
		async ({ id, relations }) => {
			try {
				const params = {
					...(relations && { relations })
				};

				const response = await apiClient.get(`/api/employee/${id}`, { params });

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(response, null, 2)
						}
					]
				};
			} catch (error) {
				console.error('Error fetching employee:', error);
				throw new Error('Failed to fetch employee');
			}
		}
	);

	// Get employee statistics tool
	server.tool(
		'get_employee_statistics',
		'Get statistics for an employee',
		{
			employeeId: z.string().describe('The employee ID'),
			organizationId: z.string().describe('The organization ID'),
			tenantId: z.string().optional().describe('The tenant ID'),
			startDate: z.string().optional().describe('Start date for statistics (ISO format)'),
			endDate: z.string().optional().describe('End date for statistics (ISO format)')
		},
		async ({ employeeId, organizationId, tenantId, startDate, endDate }) => {
			try {
				const params = {
					employeeId,
					organizationId,
					...(tenantId && { tenantId }),
					...(startDate && { startDate }),
					...(endDate && { endDate })
				};

				const response = await apiClient.get('/api/employee/statistics', { params });

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(response, null, 2)
						}
					]
				};
			} catch (error) {
				console.error('Error fetching employee statistics:', error);
				throw new Error('Failed to fetch employee statistics');
			}
		}
	);

	// Get current employee tool
	server.tool(
		'get_current_employee',
		'Get the current authenticated employee',
		{
			relations: z.array(z.string()).optional().describe('Relations to include')
		},
		async ({ relations }) => {
			try {
				const params = {
					...(relations && { relations })
				};

				const response = await apiClient.get('/api/employee/me', { params });

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(response, null, 2)
						}
					]
				};
			} catch (error) {
				console.error('Error fetching current employee:', error);
				throw new Error('Failed to fetch current employee');
			}
		}
	);

	// Update employee tool
	server.tool(
		'update_employee',
		'Update employee information',
		{
			id: z.string().describe('The employee ID'),
			firstName: z.string().optional().describe('Employee first name'),
			lastName: z.string().optional().describe('Employee last name'),
			email: z.string().optional().describe('Employee email'),
			phoneNumber: z.string().optional().describe('Employee phone number'),
			timeZone: z.string().optional().describe('Employee timezone'),
			startedWorkOn: z.string().optional().describe('Employee start date (ISO format)')
		},
		async ({ id, ...updateData }) => {
			try {
				const employeeData = {
					...updateData,
					startedWorkOn: updateData.startedWorkOn ? new Date(updateData.startedWorkOn) : undefined
				};

				const response = await apiClient.put(`/api/employee/${id}`, employeeData);

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(response, null, 2)
						}
					]
				};
			} catch (error) {
				console.error('Error updating employee:', error);
				throw new Error('Failed to update employee');
			}
		}
	);
};
