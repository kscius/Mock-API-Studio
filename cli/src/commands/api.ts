// cli/src/commands/api.ts
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { apiClient } from '../api-client';
import { getCurrentWorkspace } from '../config';

export function registerApiCommands(program: Command) {
  const api = program
    .command('api')
    .description('Manage APIs');

  // List APIs
  api
    .command('list')
    .alias('ls')
    .description('List all APIs')
    .option('-w, --workspace <id>', 'Filter by workspace ID')
    .action(async (options) => {
      try {
        const workspaceId = options.workspace || getCurrentWorkspace();
        const spinner = ora('Fetching APIs...').start();
        const apis = await apiClient.listApis(workspaceId);
        spinner.stop();

        if (apis.length === 0) {
          console.log(chalk.yellow('No APIs found.'));
          return;
        }

        const table = new Table({
          head: ['Name', 'Slug', 'Version', 'Endpoints', 'Status'].map(h => chalk.cyan(h)),
          colWidths: [30, 25, 12, 12, 10],
        });

        apis.forEach((apiDef: any) => {
          table.push([
            apiDef.name,
            apiDef.slug,
            apiDef.version || '1.0.0',
            apiDef.endpoints?.length || 0,
            apiDef.isActive ? chalk.green('Active') : chalk.red('Inactive'),
          ]);
        });

        console.log(table.toString());
        console.log(chalk.gray(`\nTotal: ${apis.length} API(s)`));
      } catch (error: any) {
        console.error(chalk.red('✗ Failed to fetch APIs:'), error.response?.data?.message || error.message);
        process.exit(1);
      }
    });

  // Create API
  api
    .command('create')
    .description('Create a new API')
    .option('-n, --name <name>', 'API name')
    .option('-s, --slug <slug>', 'API slug')
    .option('-w, --workspace <id>', 'Workspace ID')
    .option('-v, --version <version>', 'API version', '1.0.0')
    .option('-d, --description <description>', 'API description')
    .action(async (options) => {
      try {
        const inquirer = require('inquirer');
        
        const workspaceId = options.workspace || getCurrentWorkspace();
        
        if (!workspaceId) {
          console.error(chalk.red('✗ No workspace selected. Use "mock-api workspace select <slug>" first.'));
          process.exit(1);
        }

        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'API name:',
            when: !options.name,
            validate: (input: string) => input.length > 0 || 'Name is required',
          },
          {
            type: 'input',
            name: 'slug',
            message: 'API slug:',
            when: !options.slug,
            validate: (input: string) => /^[a-z0-9-]+$/.test(input) || 'Slug must contain only lowercase letters, numbers, and hyphens',
          },
          {
            type: 'input',
            name: 'description',
            message: 'Description (optional):',
            when: !options.description,
          },
        ]);

        const data = {
          workspaceId,
          name: options.name || answers.name,
          slug: options.slug || answers.slug,
          version: options.version,
          basePath: '/',
          description: options.description || answers.description,
        };

        const spinner = ora('Creating API...').start();
        const apiDef = await apiClient.createApi(data);
        spinner.succeed(chalk.green(`✓ API "${apiDef.name}" created!`));
        
        console.log(chalk.gray(`ID: ${apiDef.id}`));
        console.log(chalk.gray(`Slug: ${apiDef.slug}`));
        console.log(chalk.gray(`Mock URL: ${chalk.blue(`http://localhost:3000/mock/${apiDef.slug}`)}`));
      } catch (error: any) {
        console.error(chalk.red('✗ Failed to create API:'), error.response?.data?.message || error.message);
        process.exit(1);
      }
    });

  // Delete API
  api
    .command('delete <id>')
    .description('Delete an API')
    .action(async (id: string) => {
      try {
        const inquirer = require('inquirer');
        
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Are you sure you want to delete this API?',
            default: false,
          },
        ]);

        if (!confirm) {
          console.log(chalk.yellow('Cancelled.'));
          return;
        }

        const spinner = ora('Deleting API...').start();
        await apiClient.deleteApi(id);
        spinner.succeed(chalk.green('✓ API deleted successfully!'));
      } catch (error: any) {
        console.error(chalk.red('✗ Failed to delete API:'), error.response?.data?.message || error.message);
        process.exit(1);
      }
    });
}

