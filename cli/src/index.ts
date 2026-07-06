#!/usr/bin/env node

// cli/src/index.ts
import { Command } from 'commander';
import chalk from 'chalk';
import { registerLoginCommand } from './commands/login.js';
import { registerWorkspaceCommands } from './commands/workspace.js';
import { registerApiCommands } from './commands/api.js';
import { registerImportCommand } from './commands/import.js';
import { config, getApiUrl, getToken, getApiKey, getCurrentWorkspace, clearConfig } from './config.js';

const program = new Command();

program
  .name('mock-api')
  .description('CLI for Mock API Studio')
  .version('1.0.0');

// Register commands
registerLoginCommand(program);
registerWorkspaceCommands(program);
registerApiCommands(program);
registerImportCommand(program);

// Config command
program
  .command('config')
  .description('Show current configuration')
  .action(() => {
    console.log(chalk.cyan('Current Configuration:'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`API URL:           ${getApiUrl()}`);
    console.log(`Token:             ${getToken() ? chalk.green('Set') : chalk.red('Not set')}`);
    console.log(`API Key:           ${getApiKey() ? chalk.green('Set') : chalk.red('Not set')}`);
    console.log(`Current Workspace: ${getCurrentWorkspace() || chalk.gray('None')}`);
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.gray(`Config file: ${config.path}`));
  });

// Logout command
program
  .command('logout')
  .description('Clear authentication credentials')
  .action(() => {
    clearConfig();
    console.log(chalk.green('✓ Logged out successfully!'));
  });

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

