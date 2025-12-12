// cli/src/commands/workspace.ts
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { apiClient } from '../api-client';
import { setCurrentWorkspace, getCurrentWorkspace } from '../config';

export function registerWorkspaceCommands(program: Command) {
  const workspace = program
    .command('workspace')
    .description('Manage workspaces');

  // List workspaces
  workspace
    .command('list')
    .alias('ls')
    .description('List all workspaces')
    .action(async () => {
      try {
        const spinner = ora('Fetching workspaces...').start();
        const workspaces = await apiClient.listWorkspaces();
        spinner.stop();

        if (workspaces.length === 0) {
          console.log(chalk.yellow('No workspaces found.'));
          return;
        }

        const table = new Table({
          head: ['ID', 'Name', 'Slug', 'APIs', 'Status'].map(h => chalk.cyan(h)),
          colWidths: [38, 25, 20, 8, 10],
        });

        const currentWorkspace = getCurrentWorkspace();

        workspaces.forEach((ws: any) => {
          const isCurrent = ws.id === currentWorkspace;
          const name = isCurrent ? chalk.green(`${ws.name} (current)`) : ws.name;
          table.push([
            ws.id,
            name,
            ws.slug,
            ws._count?.apiDefinitions || 0,
            ws.isActive ? chalk.green('Active') : chalk.red('Inactive'),
          ]);
        });

        console.log(table.toString());
      } catch (error: any) {
        console.error(chalk.red('✗ Failed to fetch workspaces:'), error.response?.data?.message || error.message);
        process.exit(1);
      }
    });

  // Select workspace
  workspace
    .command('select <slug>')
    .description('Select a workspace to work with')
    .action(async (slug: string) => {
      try {
        const spinner = ora('Fetching workspaces...').start();
        const workspaces = await apiClient.listWorkspaces();
        spinner.stop();

        const workspace = workspaces.find((ws: any) => ws.slug === slug);

        if (!workspace) {
          console.error(chalk.red(`✗ Workspace "${slug}" not found.`));
          process.exit(1);
        }

        setCurrentWorkspace(workspace.id);
        console.log(chalk.green(`✓ Workspace "${workspace.name}" selected.`));
      } catch (error: any) {
        console.error(chalk.red('✗ Failed to select workspace:'), error.response?.data?.message || error.message);
        process.exit(1);
      }
    });

  // Create workspace
  workspace
    .command('create')
    .description('Create a new workspace')
    .option('-n, --name <name>', 'Workspace name')
    .option('-s, --slug <slug>', 'Workspace slug')
    .option('-d, --description <description>', 'Workspace description')
    .action(async (options) => {
      try {
        const inquirer = require('inquirer');
        
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Workspace name:',
            when: !options.name,
            validate: (input: string) => input.length > 0 || 'Name is required',
          },
          {
            type: 'input',
            name: 'slug',
            message: 'Workspace slug:',
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
          name: options.name || answers.name,
          slug: options.slug || answers.slug,
          description: options.description || answers.description,
        };

        const spinner = ora('Creating workspace...').start();
        const workspace = await apiClient.createWorkspace(data);
        spinner.succeed(chalk.green(`✓ Workspace "${workspace.name}" created!`));
        
        console.log(chalk.gray(`ID: ${workspace.id}`));
        console.log(chalk.gray(`Slug: ${workspace.slug}`));
      } catch (error: any) {
        console.error(chalk.red('✗ Failed to create workspace:'), error.response?.data?.message || error.message);
        process.exit(1);
      }
    });
}

