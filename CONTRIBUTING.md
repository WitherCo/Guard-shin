# Contributing to Guard-shin

Thank you for considering contributing to Guard-shin! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and considerate of others when contributing.

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

- Use the bug report template provided
- Include detailed steps to reproduce the issue
- Describe the behavior you observed and what you expected to see
- Include screenshots if possible
- Mention the browser/environment where you encountered the issue

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion, including completely new features and minor improvements to existing functionality.

- Use the feature request template provided
- Provide a clear and detailed explanation of the feature you want
- Explain why this enhancement would be useful to most Guard-shin users
- List examples of how this enhancement would work, if possible

### Code Contributions

#### Local Development

Want to contribute to the code? Here's how to set up Guard-shin for local development:

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```
   git clone https://github.com/witherco/guard-shin.git
   cd guard-shin
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Create a branch for your feature or fix:
   ```
   git checkout -b feature/amazing-feature
   ```
5. Make your changes
6. Run tests and ensure your code follows the style guidelines:
   ```
   npm run test
   npm run lint
   ```
7. Commit your changes:
   ```
   git commit -m "Add amazing feature"
   ```
8. Push to your fork:
   ```
   git push origin feature/amazing-feature
   ```
9. Submit a pull request to the main repository

#### Pull Request Process

1. Update the README.md or documentation with details of changes if appropriate
2. The PR should work in all supported browsers and environments
3. PRs will be merged once reviewed and approved by maintainers
4. You may merge the Pull Request once you have the sign-off of two other developers, or if you do not have permission to do that, you may request the second reviewer to merge it for you

## Styleguides

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

### JavaScript/TypeScript Styleguide

* Use 2 spaces for indentation
* Prefer `const` over `let` and avoid `var`
* Use JSDoc style comments for functions and classes
* Follow the ESLint configuration provided in the project

### CSS/SCSS Styleguide

* Follow the existing styling patterns in the codebase
* Use TailwindCSS classes where possible
* Avoid using !important unless absolutely necessary

## Additional Resources

* [Discord Server](https://discord.gg/g3rFbaW6gw)
* [Issue Tracker](https://github.com/witherco/guard-shin/issues)
* [Set up guide for GuardShin](./docs/SETUP.md)

Thank you for contributing to Guard-shin!