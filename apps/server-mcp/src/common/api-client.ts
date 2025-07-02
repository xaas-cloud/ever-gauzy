import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export class GauzyApiClient {
	private static instance: GauzyApiClient;
	private client: AxiosInstance;
	private token: string | null = null;

	private constructor() {
		// Get configuration from environment variables
		const baseUrl = this.getBaseUrl();
		const timeout = this.getTimeout();

		this.client = axios.create({
			baseURL: baseUrl,
			timeout,
			headers: {
				'Content-Type': 'application/json'
			}
		});

		// Add request interceptor to include auth token
		this.client.interceptors.request.use((config) => {
			if (this.token) {
				config.headers.Authorization = `Bearer ${this.token}`;
			}
			return config;
		});

		// Add response interceptor for error handling
		this.client.interceptors.response.use(
			(response) => response,
			(error) => {
				if (this.isDebug()) {
					console.error('API Client Error:', error.response?.data || error.message);
				}
				return Promise.reject(error);
			}
		);
	}

	public static getInstance(): GauzyApiClient {
		if (!GauzyApiClient.instance) {
			GauzyApiClient.instance = new GauzyApiClient();
		}
		return GauzyApiClient.instance;
	}

	public setToken(token: string): void {
		this.token = token;
	}

	public clearToken(): void {
		this.token = null;
	}

	public getBaseUrl(): string {
		return process.env.GAUZY_API_URL || process.env.API_BASE_URL || 'http://localhost:3000';
	}

	public getTimeout(): number {
		const timeoutValue = process.env.API_TIMEOUT || process.env.GAUZY_API_TIMEOUT;
		if (timeoutValue) {
			const parsed = parseInt(timeoutValue, 10);
			return isNaN(parsed) ? 30000 : parsed;
		}
		return 30000; // 30 seconds default
	}

	public isDebug(): boolean {
		return process.env.GAUZY_MCP_DEBUG === 'true' || process.env.NODE_ENV === 'development';
	}

	/**
	 * Set configuration for API client
	 */
	public configure(config: { baseUrl?: string; timeout?: number; token?: string }): void {
		if (config.baseUrl) {
			this.client.defaults.baseURL = config.baseUrl;
		}
		if (config.timeout) {
			this.client.defaults.timeout = config.timeout;
		}
		if (config.token) {
			this.setToken(config.token);
		}
	}

	public async get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
		const response = await this.client.get<T>(path, config);
		return response.data;
	}

	public async post<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
		const response = await this.client.post<T>(path, data, config);
		return response.data;
	}

	public async put<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
		const response = await this.client.put<T>(path, data, config);
		return response.data;
	}

	public async delete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
		const response = await this.client.delete<T>(path, config);
		return response.data;
	}

	public async patch<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
		const response = await this.client.patch<T>(path, data, config);
		return response.data;
	}

	/**
	 * Test the connection to the Gauzy API
	 */
	public async testConnection(): Promise<{ success: boolean; error?: string }> {
		try {
			await this.get('/api/health');
			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	}
}

// Export singleton instance
export const apiClient = GauzyApiClient.getInstance();
