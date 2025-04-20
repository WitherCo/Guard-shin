# Contributing to Guard-shin

We love your input! We want to make contributing to Guard-shin as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Pull Requests

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Pull Request Guidelines

- Update the README.md with details of changes to the interface, if appropriate
- Update the documentation with details of any changes
- The PR should work on the main development branch
- Include tests that verify your changes if applicable
- Follow the existing code style and formatting conventions

## Development Setup

1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/yourusername/guard-shin.git
   cd guard-shin
   npm install
   ```

2. Create a `.env` file based on `.env.example` and fill in the required credentials

3. Set up the database:
   ```bash
   npm run db:push
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

- `/client` - Frontend React application
- `/server` - Backend Express application
- `/discord-bot` - Discord bot implementation
- `/shared` - Shared types, schemas, and utilities
- `/migrations` - Database migrations

## Coding Style

- TypeScript: Follow the ESLint configuration
- React components: Use function components with hooks
- CSS: Use Tailwind CSS utilities when possible
- Database: Use Drizzle ORM for database operations

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.