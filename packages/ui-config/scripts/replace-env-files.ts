import * as path from 'path';
import * as fs from 'fs';

/**
 * Replaces the environment.ts file with environment.prod.ts if the environment is set to production.
 * For development builds, no replacement is necessary.
 */
function replaceEnvironmentFiles(): void {
	const env = process.env['NODE_ENV'] || 'development';
	const environmentsDir = path.resolve(__dirname, '../src/lib/environments');
	const sourceFile = path.join(environmentsDir, 'environment.prod.ts');
	const targetFile = path.join(environmentsDir, 'environment.ts');

	if (env === 'production') {
		// Validate source file exists
		if (!fs.existsSync(sourceFile)) {
			console.error(`Error: Source file not found: ${sourceFile}`);
			process.exit(1);
		}

		// Ensure target directory exists
		if (!fs.existsSync(environmentsDir)) {
			console.error(`Error: Environments directory not found: ${environmentsDir}`);
			process.exit(1);
		}

		try {
			fs.copyFileSync(sourceFile, targetFile);
			console.log(`✓ Replaced environment.ts with environment.prod.ts`);
		} catch (error) {
			console.error(`Error copying environment file: ${error instanceof Error ? error.message : String(error)}`);
			process.exit(1);
		}
	} else {
		console.log('Development build - using default environment.ts (no replacement needed)');
	}
}

// Execute the replacement
replaceEnvironmentFiles();
