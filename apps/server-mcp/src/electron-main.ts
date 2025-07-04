// Import logging for electron and override default console logging (CommonJS module)
import log from 'electron-log';
console.log = log.log;
Object.assign(console, log.functions);

import { app, BrowserWindow, shell, ipcMain, Menu, Tray, nativeImage, dialog, nativeTheme, screen } from 'electron';
import type { BrowserWindow as BrowserWindowType, Tray as TrayType } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import titlebarPkg from 'custom-electron-titlebar/main';
const { setupTitlebar } = titlebarPkg;
// Remote module not needed for this simple MCP server app

// Import environment
import { environment } from './environments/environment.js';

// Import electron-store (CommonJS module)
import Store from 'electron-store';

// Import MCP Server Manager
import { McpServerManager } from './instance/mcp-server-manager.js';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Setup titlebar
setupTitlebar();

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

let mainWindow: BrowserWindowType | null = null;
let tray: TrayType | null = null;
let mcpServerManager: McpServerManager | null = null;
const store = new Store();

// Set environment variables
process.env = Object.assign(process.env, environment);

// the folder where all app data will be stored (e.g. sqlite DB, settings, cache, etc)
process.env.GAUZY_USER_PATH = app.getPath('userData');
log.info(`GAUZY_USER_PATH: ${process.env.GAUZY_USER_PATH}`);

// Set app name
app.setName(process.env.NAME || 'Gauzy MCP Server');

/* Setting the app user model id for the app. */
if (process.platform === 'win32') {
	app.setAppUserModelId(process.env.APP_ID || 'com.ever.gauzy.mcp');
}

// Set unlimited listeners
ipcMain.setMaxListeners(0);

// Handle app events
app.whenReady().then(async () => {
	try {
		log.info('App is ready');

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

		// Setup auto-updater event listeners
		setupAutoUpdater();

		// Handle auto-updater
		if (environment.production) {
			autoUpdater.checkForUpdatesAndNotify();
		}
	} catch (error) {
		log.error('Error during app initialization:', error);
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
	} else if (mainWindow) {
		// If window exists but is hidden, show it
		mainWindow.show();
		mainWindow.focus();
	}
});

app.on('before-quit', async () => {
	if (mcpServerManager) {
		await mcpServerManager.stop();
	}
});

// Remote module not needed - removed for simplicity

// Set security settings
app.commandLine.appendSwitch('disable-http2');
app.commandLine.appendSwitch('in-process-gpu');

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
		center: true,
		alwaysOnTop: false,
		skipTaskbar: false,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: path.join(__dirname, 'preload', 'preload.js'),
			webSecurity: true
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
						if (status && status.running) {
							statusDiv.className = 'status running';
							statusDiv.innerHTML = \`✅ Server Running<br>Version: \${status.version || 'Unknown'}\`;
						} else {
							statusDiv.className = 'status stopped';
							statusDiv.innerHTML = '❌ Server Stopped';
						}
					} catch (error) {
						console.error('Error getting status:', error);
						const statusDiv = document.getElementById('status');
						statusDiv.className = 'status stopped';
						statusDiv.innerHTML = '❌ Error getting status';
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
		if (mainWindow) {
			mainWindow.show();
			mainWindow.focus();
			if (process.platform === 'darwin') {
				app.dock.show();
			}
		}
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
						try {
							if (!mcpServerManager) {
								mcpServerManager = new McpServerManager();
							}
							await mcpServerManager.start();
							log.info('MCP Server started from menu');
						} catch (error) {
							log.error('Failed to start MCP Server from menu:', error);
						}
					}
				},
				{
					label: 'Stop MCP Server',
					click: async () => {
						try {
							if (mcpServerManager) {
								await mcpServerManager.stop();
								log.info('MCP Server stopped from menu');
							}
						} catch (error) {
							log.error('Failed to stop MCP Server from menu:', error);
						}
					}
				},
				{
					label: 'Restart MCP Server',
					click: async () => {
						try {
							if (mcpServerManager) {
								await mcpServerManager.stop();
								await mcpServerManager.start();
								log.info('MCP Server restarted from menu');
							}
						} catch (error) {
							log.error('Failed to restart MCP Server from menu:', error);
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
					try {
						const status = mcpServerManager?.getStatus();
						const message = status?.running
							? `✅ Server is running\nVersion: ${status.version || 'Unknown'}`
							: '❌ Server is stopped';

						await dialog.showMessageBox({
							type: 'info',
							title: 'MCP Server Status',
							message: message
						});
					} catch (error) {
						log.error('Error showing server status:', error);
						await dialog.showMessageBox({
							type: 'error',
							title: 'Error',
							message: 'Failed to get server status'
						});
					}
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

		// Add click handler to show/hide window
		tray.on('click', () => {
			if (mainWindow) {
				if (mainWindow.isVisible()) {
					mainWindow.hide();
				} else {
					mainWindow.show();
					mainWindow.focus();
				}
			}
		});
	} catch (error) {
		log.error('Failed to setup system tray:', error);
	}
}

function setupAutoUpdater(): void {
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
}

// IPC handlers using ES module patterns
ipcMain.handle('get-app-version', () => {
	try {
		return app.getVersion();
	} catch (error) {
		log.error('Error getting app version:', error);
		return 'Unknown';
	}
});

ipcMain.handle('get-saved-theme', () => {
	try {
		return store.get('theme', 'default');
	} catch (error) {
		log.error('Error getting saved theme:', error);
		return 'default';
	}
});

ipcMain.handle('save-theme', (_, theme: string) => {
	try {
		store.set('theme', theme);
		return true;
	} catch (error) {
		log.error('Error saving theme:', error);
		return false;
	}
});

ipcMain.handle('get-mcp-server-status', () => {
	try {
		return mcpServerManager?.getStatus() || { running: false, port: null, version: null };
	} catch (error) {
		log.error('Error getting MCP server status:', error);
		return { running: false, port: null, version: null };
	}
});

ipcMain.handle('start-mcp-server', async () => {
	try {
		if (!mcpServerManager) {
			mcpServerManager = new McpServerManager();
		}
		const result = await mcpServerManager.start();
		log.info('MCP Server started via IPC');
		return result;
	} catch (error) {
		log.error('Error starting MCP server via IPC:', error);
		return false;
	}
});

ipcMain.handle('stop-mcp-server', async () => {
	try {
		if (mcpServerManager) {
			const result = await mcpServerManager.stop();
			log.info('MCP Server stopped via IPC');
			return result;
		}
		return true;
	} catch (error) {
		log.error('Error stopping MCP server via IPC:', error);
		return false;
	}
});

ipcMain.handle('restart-mcp-server', async () => {
	try {
		if (mcpServerManager) {
			await mcpServerManager.stop();
			const result = await mcpServerManager.start();
			log.info('MCP Server restarted via IPC');
			return result;
		}
		return false;
	} catch (error) {
		log.error('Error restarting MCP server via IPC:', error);
		return false;
	}
});

ipcMain.handle('PREFERRED_THEME', () => {
	const setting = store.get('appSetting') as any;
	return !setting ? (nativeTheme.shouldUseDarkColors ? 'dark' : 'light') : setting.theme;
});

// Handle expand window functionality
ipcMain.on('expand_window', (event, arg) => {
	log.info('expand_window');

	try {
		const display = screen.getPrimaryDisplay();
		const { height, width } = display.workAreaSize;

		log.info('workAreaSize', { height, width });

		// Set the max height and width for default window
		const maxHeight = 480;
		const maxWidth = 640;

		if (!mainWindow) return;

		switch (process.platform) {
			case 'linux':
				{
					mainWindow.setMinimumSize(maxWidth, maxHeight);
					mainWindow.setSize(maxWidth, maxHeight, true);
					mainWindow.setResizable(false);
				}
				break;

			case 'darwin':
				{
					mainWindow.setSize(maxWidth, maxHeight, true);
					mainWindow.center();
				}
				break;

			default:
				{
					let calculatedX = (width - maxWidth) * 0.5;
					let calculatedY = (height - maxHeight) * 0.5;

					// Ensure x and y are not negative
					calculatedX = Math.max(0, calculatedX);
					calculatedY = Math.max(0, calculatedY);

					// Ensure window does not exceed screen bounds
					calculatedX = Math.min(calculatedX, width - maxWidth);
					calculatedY = Math.min(calculatedY, height - maxHeight);

					const bounds = {
						width: maxWidth,
						height: maxHeight,
						x: Math.round(calculatedX),
						y: Math.round(calculatedY)
					};

					log.info('Bounds', JSON.stringify(bounds));

					mainWindow.setBounds(bounds, true);
				}
				break;
		}
	} catch (err) {
		log.error('Error in expand_window', err);
	}
});
