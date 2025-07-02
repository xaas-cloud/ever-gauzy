import { app, BrowserWindow, shell, ipcMain, Menu, Tray, nativeImage, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import { environment } from './environments/environment';
import * as log from 'electron-log';
import * as path from 'path';
import { default as Store } from 'electron-store';
import { createMcpServer } from './instance/mcp-server.js';
import { McpServerManager } from './instance/mcp-server-manager.js';

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let mcpServerManager: McpServerManager | null = null;
const store = new Store();

// Handle app events
app.whenReady().then(async () => {
	await createMainWindow();
	setupApplicationMenu();
	setupTray();

	// Initialize MCP Server
	try {
		mcpServerManager = new McpServerManager();
		await mcpServerManager.start();
		log.info('MCP Server started successfully');
	} catch (error) {
		log.error('Failed to start MCP Server:', error);
	}

	// Handle auto-updater
	if (environment.production) {
		autoUpdater.checkForUpdatesAndNotify();
	}
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', async () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		await createMainWindow();
	}
});

app.on('before-quit', async () => {
	if (mcpServerManager) {
		await mcpServerManager.stop();
	}
});

async function createMainWindow(): Promise<void> {
	// Create a simple status window for the MCP server
	mainWindow = new BrowserWindow({
		width: 600,
		height: 400,
		minWidth: 500,
		minHeight: 300,
		show: false,
		title: 'Gauzy MCP Server',
		icon: path.join(__dirname, 'favicon.ico'),
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: path.join(__dirname, 'preload', 'preload.js')
		}
	});

	// Create a simple HTML page for status display
	const htmlContent = `
		<!DOCTYPE html>
		<html>
		<head>
			<title>Gauzy MCP Server</title>
			<style>
				body {
					font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
					margin: 0; padding: 20px; background: #f5f5f5; color: #333;
				}
				.container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
				h1 { color: #2c3e50; margin-bottom: 20px; }
				.status { padding: 15px; border-radius: 5px; margin: 10px 0; }
				.status.running { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
				.status.stopped { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
				.info { background: #e2e3e5; padding: 15px; border-radius: 5px; margin: 10px 0; }
				.button {
					background: #007bff; color: white; border: none; padding: 10px 20px;
					border-radius: 5px; cursor: pointer; margin: 5px;
				}
				.button:hover { background: #0056b3; }
			</style>
		</head>
		<body>
			<div class="container">
				<h1>🚀 Gauzy MCP Server</h1>
				<div id="status" class="status stopped">
					Status: Loading...
				</div>
				<div class="info">
					<strong>What is this?</strong><br>
					This is the Gauzy Model Context Protocol (MCP) server. It provides AI assistants like Claude with access to your Gauzy data for time tracking, project management, and more.
				</div>
				<div class="info">
					<strong>How to use:</strong><br>
					1. Configure Claude Desktop with this server<br>
					2. Start asking Claude questions about your Gauzy data<br>
					3. Use the tray icon to manage the server
				</div>
				<button class="button" onclick="refreshStatus()">Refresh Status</button>
				<button class="button" onclick="openLogs()">View Logs</button>
			</div>
			<script>
				async function refreshStatus() {
					try {
						const status = await window.electronAPI.getMcpServerStatus();
						const statusDiv = document.getElementById('status');
						if (status.running) {
							statusDiv.className = 'status running';
							statusDiv.innerHTML = \`✅ Server Running<br>Version: \${status.version || 'Unknown'}\`;
						} else {
							statusDiv.className = 'status stopped';
							statusDiv.innerHTML = '❌ Server Stopped';
						}
					} catch (error) {
						console.error('Error getting status:', error);
					}
				}

				function openLogs() {
					alert('Check the console logs in the developer tools');
				}

				// Initial status check
				refreshStatus();

				// Refresh every 5 seconds
				setInterval(refreshStatus, 5000);
			</script>
		</body>
		</html>
	`;

	// Load the HTML content directly
	await mainWindow.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(htmlContent)}`);

	// Open DevTools in development
	if (!environment.production) {
		mainWindow.webContents.openDevTools();
	}

	// Show window when ready
	mainWindow.once('ready-to-show', () => {
		mainWindow?.show();
	});

	// Handle external links
	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url);
		return { action: 'deny' };
	});

	// Handle window closed
	mainWindow.on('closed', () => {
		mainWindow = null;
	});
}

function setupApplicationMenu(): void {
	const template: Electron.MenuItemConstructorOptions[] = [
		{
			label: 'File',
			submenu: [
				{
					label: 'Show Server Status',
					click: () => {
						if (mainWindow) {
							mainWindow.show();
							mainWindow.focus();
						}
					}
				},
				{ type: 'separator' },
				{
					label: 'Quit',
					accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
					click: () => {
						app.quit();
					}
				}
			]
		},
		{
			label: 'Server',
			submenu: [
				{
					label: 'Start MCP Server',
					click: async () => {
						if (!mcpServerManager) {
							mcpServerManager = new McpServerManager();
						}
						await mcpServerManager.start();
					}
				},
				{
					label: 'Stop MCP Server',
					click: async () => {
						if (mcpServerManager) {
							await mcpServerManager.stop();
						}
					}
				},
				{
					label: 'Restart MCP Server',
					click: async () => {
						if (mcpServerManager) {
							await mcpServerManager.stop();
							await mcpServerManager.start();
						}
					}
				}
			]
		},
		{
			label: 'View',
			submenu: [
				{ role: 'reload' },
				{ role: 'forceReload' },
				{ role: 'toggleDevTools' },
				{ type: 'separator' },
				{ role: 'resetZoom' },
				{ role: 'zoomIn' },
				{ role: 'zoomOut' },
				{ type: 'separator' },
				{ role: 'togglefullscreen' }
			]
		}
	];

	const menu = Menu.buildFromTemplate(template);
	Menu.setApplicationMenu(menu);
}

function setupTray(): void {
	try {
		// Try to create a simple tray icon
		const icon = nativeImage.createEmpty();
		tray = new Tray(icon);

		const contextMenu = Menu.buildFromTemplate([
			{
				label: 'Gauzy MCP Server',
				enabled: false
			},
			{ type: 'separator' },
			{
				label: 'Show Status',
				click: () => {
					if (mainWindow) {
						mainWindow.show();
						mainWindow.focus();
					}
				}
			},
			{
				label: 'Server Status',
				click: async () => {
					const status = mcpServerManager?.getStatus();
					const message = status?.running
						? `✅ Server is running\nVersion: ${status.version || 'Unknown'}`
						: '❌ Server is stopped';

					dialog.showMessageBox({
						type: 'info',
						title: 'MCP Server Status',
						message: message
					});
				}
			},
			{ type: 'separator' },
			{
				label: 'Quit',
				click: () => {
					app.quit();
				}
			}
		]);

		tray.setContextMenu(contextMenu);
		tray.setToolTip('Gauzy MCP Server');
	} catch (error) {
		log.error('Failed to setup system tray:', error);
	}
}

// IPC handlers
ipcMain.handle('get-app-version', () => {
	return app.getVersion();
});

ipcMain.handle('get-saved-theme', () => {
	return store.get('theme', 'default');
});

ipcMain.handle('save-theme', (_, theme: string) => {
	store.set('theme', theme);
	return true;
});

ipcMain.handle('get-mcp-server-status', () => {
	return mcpServerManager?.getStatus() || { running: false, port: null, version: null };
});

ipcMain.handle('start-mcp-server', async () => {
	if (!mcpServerManager) {
		mcpServerManager = new McpServerManager();
	}
	return await mcpServerManager.start();
});

ipcMain.handle('stop-mcp-server', async () => {
	if (mcpServerManager) {
		return await mcpServerManager.stop();
	}
	return true;
});

ipcMain.handle('restart-mcp-server', async () => {
	if (mcpServerManager) {
		await mcpServerManager.stop();
		return await mcpServerManager.start();
	}
	return false;
});

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
	log.info('Checking for update...');
});

autoUpdater.on('update-available', () => {
	log.info('Update available.');
});

autoUpdater.on('update-not-available', () => {
	log.info('Update not available.');
});

autoUpdater.on('error', (err) => {
	log.error('Error in auto-updater:', err);
});

autoUpdater.on('download-progress', (progressObj) => {
	let logMessage = `Download speed: ${progressObj.bytesPerSecond}`;
	logMessage += ` - Downloaded ${progressObj.percent}%`;
	logMessage += ` (${progressObj.transferred}/${progressObj.total})`;
	log.info(logMessage);
});

autoUpdater.on('update-downloaded', () => {
	log.info('Update downloaded');
	autoUpdater.quitAndInstall();
});
