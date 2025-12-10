// backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.apiEndpoint.deleteMany();
  await prisma.apiDefinition.deleteMany();
  await prisma.workspace.deleteMany();

  // ========== Create Workspaces ==========
  const defaultWorkspace = await prisma.workspace.create({
    data: {
      name: 'Default Workspace',
      slug: 'default',
      description: 'Default workspace for demo APIs',
      isActive: true,
    },
  });

  const teamWorkspace = await prisma.workspace.create({
    data: {
      name: 'Team Sandbox',
      slug: 'team-sandbox',
      description: 'Sandbox workspace for team collaboration',
      isActive: true,
    },
  });

  console.log('✅ Created 2 workspaces');

  // ========== JSONPlaceholder-like API ==========
  const jsonPlaceholderApi = await prisma.apiDefinition.create({
    data: {
      workspaceId: defaultWorkspace.id,
      name: 'JSONPlaceholder',
      slug: 'jsonplaceholder',
      version: '1.0.0',
      basePath: '/',
      description: 'Free fake API for testing and prototyping',
      isActive: true,
      tags: ['demo', 'testing', 'json'],
    },
  });

  await prisma.apiEndpoint.createMany({
    data: [
      {
        apiId: jsonPlaceholderApi.id,
        method: 'GET',
        path: '/posts',
        summary: 'Get all posts',
        requestSchema: null,
        responses: [
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: [
              { id: 1, userId: 1, title: 'First Post', body: 'This is the first post content' },
              { id: 2, userId: 1, title: 'Second Post', body: 'This is the second post content' },
              { id: 3, userId: 2, title: 'Third Post', body: 'This is the third post content' },
            ],
            isDefault: true,
          },
        ],
        delayMs: 100,
        enabled: true,
      },
      {
        apiId: jsonPlaceholderApi.id,
        method: 'GET',
        path: '/posts/:id',
        summary: 'Get a post by ID',
        requestSchema: null,
        responses: [
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: { id: 1, userId: 1, title: 'Sample Post', body: 'This is a sample post content' },
            isDefault: true,
          },
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
            body: { error: 'Post not found' },
            isDefault: false,
          },
        ],
        delayMs: 50,
        enabled: true,
      },
      {
        apiId: jsonPlaceholderApi.id,
        method: 'POST',
        path: '/posts',
        summary: 'Create a new post',
        requestSchema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            body: { type: 'string' },
            userId: { type: 'number' },
          },
        },
        responses: [
          {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
            body: { id: 101, userId: 1, title: 'New Post', body: 'New post content' },
            isDefault: true,
          },
        ],
        delayMs: 200,
        enabled: true,
      },
      {
        apiId: jsonPlaceholderApi.id,
        method: 'GET',
        path: '/users',
        summary: 'Get all users',
        requestSchema: null,
        responses: [
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: [
              { id: 1, name: 'John Doe', email: 'john@example.com', username: 'johndoe' },
              { id: 2, name: 'Jane Smith', email: 'jane@example.com', username: 'janesmith' },
            ],
            isDefault: true,
          },
        ],
        delayMs: 100,
        enabled: true,
      },
    ],
  });

  console.log('✅ Created JSONPlaceholder API with 4 endpoints');

  // ========== GitHub-like API (in Team Sandbox workspace) ==========
  const githubApi = await prisma.apiDefinition.create({
    data: {
      workspaceId: teamWorkspace.id,
      name: 'GitHub Mock',
      slug: 'github',
      version: '1.0.0',
      basePath: '/',
      description: 'Mock GitHub API for testing',
      isActive: true,
      tags: ['demo', 'github', 'git'],
    },
  });

  await prisma.apiEndpoint.createMany({
    data: [
      {
        apiId: githubApi.id,
        method: 'GET',
        path: '/users/:username',
        summary: 'Get user by username',
        requestSchema: null,
        responses: [
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: {
              login: 'octocat',
              id: 1,
              name: 'The Octocat',
              bio: 'GitHub mascot',
              public_repos: 8,
              followers: 1000,
            },
            isDefault: true,
          },
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
            body: { message: 'Not Found' },
            isDefault: false,
          },
        ],
        delayMs: 150,
        enabled: true,
      },
      {
        apiId: githubApi.id,
        method: 'GET',
        path: '/repos/:owner/:repo',
        summary: 'Get repository',
        requestSchema: null,
        responses: [
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: {
              id: 1,
              name: 'sample-repo',
              full_name: 'octocat/sample-repo',
              description: 'A sample repository',
              private: false,
              stargazers_count: 100,
              forks_count: 50,
            },
            isDefault: true,
          },
        ],
        delayMs: 150,
        enabled: true,
      },
    ],
  });

  console.log('✅ Created GitHub Mock API with 2 endpoints');

  console.log('🌱 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

