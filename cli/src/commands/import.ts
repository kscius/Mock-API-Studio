// cli/src/commands/import.ts
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { apiClient } from '../api-client';
import { getCurrentWorkspace } from '../config';
import * as path from 'path';
import * as fs from 'fs';

export function registerImportCommand(program: Command) {
  program
    .command('import <file>')
    .description('Import OpenAPI specification')
    .option('-w, --workspace <id>', 'Workspace ID')
    .option('--dry-run', 'Preview import without creating resources')
    .action(async (file: string, options) => {
      try {
        const workspaceId = options.workspace || getCurrentWorkspace();
        
        if (!workspaceId) {
          console.error(chalk.red('✗ No workspace selected. Use "mock-api workspace select <slug>" first.'));
          process.exit(1);
        }

        const filePath = path.resolve(file);
        
        if (!fs.existsSync(filePath)) {
          console.error(chalk.red(`✗ File not found: ${filePath}`));
          process.exit(1);
        }

        const spinner = ora('Importing OpenAPI specification...').start();
        
        const result = await apiClient.importOpenApi(filePath, workspaceId);
        
        spinner.succeed(chalk.green('✓ OpenAPI import successful!'));
        
        console.log(chalk.gray('\nImported:'));
        console.log(chalk.gray(`  API: ${result.name || result.api?.name}`));
        console.log(chalk.gray(`  Endpoints: ${result.endpoints?.length || 0}`));
        
        if (options.dryRun) {
          console.log(chalk.yellow('\n(Dry run - no resources were created)'));
        }
      } catch (error: any) {
        console.error(chalk.red('✗ Import failed:'), error.response?.data?.message || error.message);
        process.exit(1);
      }
    });
}

