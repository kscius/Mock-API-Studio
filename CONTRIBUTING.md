# Contributing to Mock-API-Studio

Thank you for your interest in contributing to Mock-API-Studio! 🎉

## 🌍 Language

All code, comments, documentation, and communication must be in **English** to ensure accessibility for the global open-source community.

## 📋 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/mock-api-studio.git
   cd mock-api-studio
   ```
3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 🛠️ Development Setup

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Git

### Local Setup
```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Start databases
docker compose up db redis -d

# Backend
cd backend
cp .env.example .env
npm run prisma:migrate
npm run prisma:seed
npm run start:dev

# Frontend (new terminal)
cd frontend
cp .env.example .env
npm run dev
```

## 📝 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

body (optional)

footer (optional)
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```bash
git commit -m "feat(webhooks): add secret signing support"
git commit -m "fix(auth): resolve JWT token expiration issue"
git commit -m "docs(readme): update installation instructions"
```

## 🧪 Testing

Before submitting a PR, ensure all tests pass:

```bash
# Backend tests
cd backend
npm test
npm run test:cov

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

### Writing Tests

- **Unit tests**: Test individual functions/services
- **Integration tests**: Test module interactions
- **E2E tests**: Test complete user flows

Example:
```typescript
describe('WorkspacesService', () => {
  it('should create a workspace', async () => {
    const result = await service.create({
      name: 'Test Workspace',
      slug: 'test-workspace'
    });
    expect(result.slug).toBe('test-workspace');
  });
});
```

## 🎨 Code Style

### TypeScript
- Use TypeScript for all code
- Enable strict mode
- Define explicit types (avoid `any`)
- Use interfaces for object shapes

### Formatting
```bash
# Backend
cd backend
npm run lint
npm run format

# Frontend
cd frontend
npm run lint
```

### Naming Conventions
- **Files**: `kebab-case.ts`
- **Classes**: `PascalCase`
- **Functions/Variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Interfaces**: `PascalCase` (prefix with `I` optional)

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── [feature]/           # Feature modules
│   │   ├── dto/            # Data Transfer Objects
│   │   ├── [feature].service.ts
│   │   ├── [feature].controller.ts
│   │   ├── [feature].module.ts
│   │   └── [feature].service.spec.ts
│   ├── common/             # Shared modules
│   └── shared/             # Utilities

frontend/
├── src/
│   ├── api/                # API clients
│   ├── components/         # Reusable components
│   ├── contexts/           # React contexts
│   ├── pages/              # Page components
│   └── test/               # Test utilities
```

## 📚 Documentation

- Update README.md for new features
- Add JSDoc comments for public APIs
- Update API documentation
- Create examples for complex features

Example:
```typescript
/**
 * Creates a new webhook subscription
 * @param dto - Webhook creation data
 * @returns Created webhook with generated ID
 * @throws BadRequestException if URL is invalid
 */
async create(dto: CreateWebhookDto): Promise<Webhook> {
  // implementation
}
```

## 🔍 Pull Request Process

1. **Update documentation** if needed
2. **Add/update tests** for new features
3. **Ensure all tests pass**
4. **Update CHANGELOG.md**
5. **Create PR with description**:
   - What changes were made
   - Why these changes were needed
   - How to test the changes
   - Screenshots (for UI changes)

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How to test the changes

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Code follows style guidelines
```

## 🐛 Reporting Bugs

Use GitHub Issues with the bug template:

```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen

**Screenshots**
If applicable

**Environment**
- OS: [e.g., Ubuntu 22.04]
- Node version: [e.g., 20.10.0]
- Browser: [e.g., Chrome 120]
```

## 💡 Feature Requests

Use GitHub Issues with the feature template:

```markdown
**Is your feature request related to a problem?**
Description of the problem

**Describe the solution you'd like**
Clear description of the desired feature

**Describe alternatives you've considered**
Alternative solutions

**Additional context**
Any other context or screenshots
```

## 🏆 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in relevant documentation

## 📞 Questions?

- Open a GitHub Discussion
- Check existing issues
- Review documentation

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for making Mock-API-Studio better! 🚀
