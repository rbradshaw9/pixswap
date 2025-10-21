# Contributing to PixSwap

Thank you for your interest in contributing to PixSwap! This document provides guidelines and instructions for contributing to the project.

## 📋 Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain professionalism in all interactions

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Docker and Docker Compose
- Git
- Basic knowledge of TypeScript, React, and Node.js

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/pixswap.git`
3. Install dependencies: `cd pixswap && npm install`
4. Set up environment variables (see README.md)
5. Start development environment: `docker-compose -f docker-compose.dev.yml up -d`

## 🏗️ Development Workflow

### Branch Naming
- `feature/feature-name` - New features
- `bugfix/issue-description` - Bug fixes
- `hotfix/critical-fix` - Critical production fixes
- `docs/documentation-update` - Documentation changes

### Commit Messages
Follow conventional commits format:
```
type(scope): description

feat(auth): add two-factor authentication
fix(api): resolve user profile update issue
docs(readme): update installation instructions
test(media): add upload validation tests
```

### Pull Request Process
1. Create a feature branch from `main`
2. Make your changes
3. Write/update tests
4. Ensure all tests pass
5. Update documentation if needed
6. Submit a pull request with:
   - Clear description of changes
   - Reference to related issues
   - Screenshots (if UI changes)

## 🧪 Testing

### Running Tests
```bash
# Backend tests
cd server && npm test

# Frontend tests  
cd client && npm test

# Integration tests
npm run test:integration
```

### Test Requirements
- All new features must include tests
- Maintain >80% code coverage
- Write both unit and integration tests
- Test error scenarios and edge cases

## 📝 Documentation

### Code Documentation
- Use JSDoc comments for functions
- Add inline comments for complex logic
- Update README.md for new features
- Include examples in API documentation

### API Documentation
When adding new endpoints:
1. Update the API section in README.md
2. Include request/response examples
3. Document all parameters and responses
4. Add error codes and messages

## 🎨 Code Style

### TypeScript Guidelines
- Use strict mode
- Prefer interfaces over types
- Use async/await over promises
- Follow naming conventions:
  - PascalCase for components/classes
  - camelCase for functions/variables
  - UPPER_CASE for constants

### React Guidelines
- Use functional components with hooks
- Implement proper error boundaries
- Use TypeScript for all props
- Follow the component structure:
  ```tsx
  // Imports
  // Types/Interfaces
  // Component
  // Default export
  ```

### Backend Guidelines
- Use Express.js best practices
- Implement proper error handling
- Use middleware for common functionality
- Follow RESTful API conventions

## 🔍 Code Review Process

### For Contributors
- Keep pull requests focused and small
- Write clear commit messages
- Respond to feedback promptly
- Test your changes thoroughly

### For Reviewers
- Be constructive and respectful
- Focus on code quality and maintainability
- Check for security issues
- Verify tests are adequate

## 🐛 Bug Reports

When reporting bugs, include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, browser, etc.)
- Screenshots or error logs

Use this template:
```markdown
**Bug Description**
Brief description of the bug

**Steps to Reproduce**
1. Go to...
2. Click on...
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: [e.g., macOS 12.0]
- Browser: [e.g., Chrome 96]
- Node version: [e.g., 18.12.0]

**Additional Context**
Any other relevant information
```

## 💡 Feature Requests

For new features:
- Check existing issues first
- Provide clear use case
- Consider implementation complexity
- Be open to alternative solutions

## 🚨 Security Issues

For security vulnerabilities:
- **DO NOT** create public issues
- Email security@pixswap.com
- Include detailed description
- Wait for confirmation before disclosure

## 📚 Resources

### Learning Resources
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://reactjs.org/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Express.js Guide](https://expressjs.com/en/guide/)

### Project-Specific Resources
- [Architecture Documentation](./docs/architecture.md)
- [API Documentation](./docs/api.md)
- [Database Schema](./docs/database.md)
- [Deployment Guide](./docs/deployment.md)

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Annual contributor appreciation posts

## 📞 Getting Help

- Join our Discord server: [discord.gg/pixswap]
- Check GitHub Discussions
- Read existing issues and PRs
- Ask questions in pull request comments

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to PixSwap! 🎉