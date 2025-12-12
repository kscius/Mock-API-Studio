// cli/src/commands/login.ts
import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { apiClient } from '../api-client';
import { setToken } from '../config';

export function registerLoginCommand(program: Command) {
  program
    .command('login')
    .description('Login to Mock API Studio')
    .option('-e, --email <email>', 'Email address')
    .option('-p, --password <password>', 'Password')
    .option('--api-key <key>', 'Use API key instead of email/password')
    .action(async (options) => {
      try {
        if (options.apiKey) {
          // Use API key
          const { setApiKey } = require('../config');
          setApiKey(options.apiKey);
          console.log(chalk.green('✓ API key saved successfully!'));
          return;
        }

        // Prompt for credentials if not provided
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'email',
            message: 'Email:',
            when: !options.email,
            validate: (input) => input.includes('@') || 'Please enter a valid email',
          },
          {
            type: 'password',
            name: 'password',
            message: 'Password:',
            when: !options.password,
            mask: '*',
          },
        ]);

        const email = options.email || answers.email;
        const password = options.password || answers.password;

        const spinner = ora('Logging in...').start();

        const result = await apiClient.login(email, password);
        
        setToken(result.accessToken || result.token);
        
        spinner.succeed(chalk.green('✓ Login successful!'));
        console.log(chalk.gray(`Logged in as: ${email}`));
      } catch (error: any) {
        console.error(chalk.red('✗ Login failed:'), error.response?.data?.message || error.message);
        process.exit(1);
      }
    });
}

