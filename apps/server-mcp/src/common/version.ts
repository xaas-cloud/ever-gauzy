import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

/**
 * @description
 * Current version of the Ever Gauzy Server.
 *
 * @example
 * ```
 * import { version } from './version';
 *
 * console.log('Ever Gauzy Server MCP Version:', version);
 * ```
 *
 * @since 0.1.0
 */

/**
 * Reads the version from package.json using fs.readFileSync
 * This approach works in ES modules without using import assertions
 */
function getVersion(): string {
	try {
		// Get the current directory for ES modules
		const __filename = fileURLToPath(import.meta.url);
		const __dirname = dirname(__filename);

		// Read package.json from the build directory (copied during build)
		// Path from build/src/common/version.js to build/package.json
		const packageJsonPath = join(__dirname, '../../../package.json');
		const packageJsonContent = readFileSync(packageJsonPath, 'utf8');
		const packageJson = JSON.parse(packageJsonContent);

		return packageJson.version;
	} catch (error) {
		console.error('Failed to read version from package.json:', error);
		return '0.1.0'; // fallback version
	}
}

export const version: string = getVersion();

// Additional version info
export const versionInfo = {
	version,
	name: 'Gauzy MCP Server',
	description: 'Model Context Protocol server for Ever Gauzy',
	author: 'Ever Co. LTD',
	license: 'AGPL-3.0'
};
