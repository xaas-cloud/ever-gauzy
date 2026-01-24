const fs = require('fs');
const path = require('path');

// Directories to skip during scanning
const SKIP_DIRS = new Set([
	'node_modules',
	'.git',
	'.next',
	'dist',
	'build',
	'.nuxt',
	'.cache',
	'coverage',
	'tmp',
	'temp'
]);

// Package patterns to skip (UI packages not needed for API)
// Only exact UI packages from /packages and /packages/plugins directories
const SKIP_PACKAGES = new Set([
	// Core UI packages
	'desktop-ui-lib',
	'ui-auth',
	'ui-core',
	'ui-config',

	// Plugin UI packages
	'videos-ui',
	'public-layout-ui',
	'posthog-ui',
	'onboarding-ui',
	'maintenance-ui',
	'legal-ui',
	'job-search-ui',
	'job-proposal-ui',
	'job-employee-ui',
	'job-matching-ui',
	'integration-zapier-ui',
	'integration-upwork-ui',
	'integration-make-com-ui',
	'integration-hubstaff-ui',
	'integration-github-ui',
	'integration-ai-ui',
	'integration-activepieces-ui'
]);

/**
 * Safely read and parse a package.json file
 * @param {string} filePath - Path to package.json
 * @returns {Object|null} Parsed package.json or null if read/parse fails
 */
function readPackageJson(filePath) {
	try {
		const content = fs.readFileSync(filePath, 'utf-8');
		return JSON.parse(content);
	} catch {
		return null;
	}
}

/**
 * Check if package should be skipped (UI packages, etc.)
 * @param {string} packageName - Package name
 * @returns {boolean} True if package should be skipped
 */
function shouldSkipPackage(packageName) {
	const lowerName = packageName.toLowerCase();
	for (const pattern of SKIP_PACKAGES) {
		if (lowerName.includes(pattern)) {
			return true;
		}
	}
	return false;
}

/**
 * Recursively collects all package directories with package.json files
 * and returns CopyWebpackPlugin-compatible patterns.
 * Optimized for speed with early exits, minimal file system calls, and UI package filtering.
 *
 * @param {string} distPackagesDir - Source directory containing built packages.
 * @param {string} targetNodeModulesDir - Destination directory inside dist/apps/api.
 * @returns {Array} Array of copy patterns for CopyWebpackPlugin.
 */
function getCopyPatterns(distPackagesDir, targetNodeModulesDir) {
	// Early exit if source doesn't exist
	if (!fs.existsSync(distPackagesDir)) {
		return [];
	}

	// Ensure the target directory exists
	if (!fs.existsSync(targetNodeModulesDir)) {
		fs.mkdirSync(targetNodeModulesDir, { recursive: true });
	}

	const patterns = [];
	let skippedCount = 0;

	const scanDir = (dir, depth = 0) => {
		// Limit recursion depth to prevent scanning deeply nested non-package directories
		if (depth > 5) {
			return;
		}

		let entries;
		try {
			// Use withFileTypes to get directory info in single call (more efficient)
			entries = fs.readdirSync(dir, { withFileTypes: true });
		} catch {
			// Skip unreadable directories
			return;
		}

		for (const entry of entries) {
			// Skip hidden directories and common non-package directories
			if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) {
				continue;
			}

			// Skip symlinks to prevent circular references
			if (entry.isSymbolicLink?.()) {
				continue;
			}

			if (!entry.isDirectory()) {
				continue;
			}

			const fullPath = path.join(dir, entry.name);
			const packageJsonPath = path.join(fullPath, 'package.json');

			// Check if this directory is a package
			if (fs.existsSync(packageJsonPath)) {
				// Read and parse package.json only once
				const packageJson = readPackageJson(packageJsonPath);

				if (packageJson?.name) {
					const packageName = (packageJson.name || '').split('/').pop() || '';

					// Skip UI packages not needed for API
					if (shouldSkipPackage(packageName)) {
						skippedCount++;
						continue;
					}

					if (packageName) {
						patterns.push({
							from: fullPath,
							to: path.join(targetNodeModulesDir, packageName),
							globOptions: {
								ignore: ['**/node_modules/**']
							}
						});
					}
				}
				// Don't recurse into package directories
				continue;
			}

			// Recurse into subdirectories only if not a package
			scanDir(fullPath, depth + 1);
		}
	};

	scanDir(distPackagesDir);

	// Log skipped UI packages info
	if (skippedCount > 0) {
		console.log(`   Skipped ${skippedCount} UI package(s)`);
	}

	return patterns;
}

module.exports = { getCopyPatterns };
