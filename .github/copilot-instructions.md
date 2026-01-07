# Project Overview

The SuperSuper project is a web application that allows users to compare products while shopping in a supermarket. This application will be hosted locally on the user's home network (self-hosted) and supports offline functionality. It is built using React and Node.js, and uses MongoDB for data storage. 

## Folder Structure

- `/src`: Contains the source code for the frontend.
  - `/components`: Reusable React components
  - `/pages`: Page-level components for routing
  - `/hooks`: Custom React hooks
  - `/services`: API and external service integrations
- `/server`: Contains the source code for the Node.js backend.
- `/public`: Static assets served by the application

## Libraries and Frameworks

- React and Tailwind CSS for the frontend.
- Node.js and Express for the backend.
- MongoDB for data storage.
- Vite for development and build tooling.
- React Router for client-side routing.

## Build and Development Commands

- `npm install` - Install all dependencies
- `npm run dev` - Start both frontend (port 3000) and backend (port 5000) in development mode
- `npm run dev:frontend` - Start only the frontend development server
- `npm run dev:backend` - Start only the backend development server
- `npm run build` - Build the frontend for production
- `npm start` - Start the production server

### Testing

- Currently no automated tests are configured. When adding tests in the future, follow these conventions:
  - Use Jest or Vitest for unit testing
  - Place test files adjacent to the code being tested with `.test.js` or `.test.jsx` extension
  - Write tests for all new features and bug fixes

## Coding Standards

### JavaScript/JSX

- Use semicolons at the end of each statement.
- Use single quotes for strings.
- Use `const` by default; use `let` only when reassignment is necessary. Never use `var`.
- Use arrow functions for callbacks and function expressions.
- Use destructuring for props and function parameters.
- Prefer template literals over string concatenation.

### React

- Use function-based components only. Do not use class components.
- Use arrow functions for component definitions: `const Component = () => { ... }`.
- Export components as default at the end of the file.
- Use React hooks for state management and side effects.
- Keep components focused and single-purpose. Extract complex logic into custom hooks.
- Props should be destructured in the function signature.

### File Naming

- Use PascalCase for component files: `ComponentName.jsx`
- Use camelCase for utility files and hooks: `useCustomHook.js`, `apiService.js`
- Use `.jsx` extension for files containing JSX, `.js` for plain JavaScript

### Import Organization

- Group imports in this order:
  1. External dependencies (React, third-party libraries)
  2. Internal components
  3. Hooks
  4. Services/utilities
  5. Styles
- Leave a blank line between groups

## UI Guidelines

- Application should have a modern and clean design.
- Application is optimized for mobile devices in portrait mode.
- Use Tailwind CSS utility classes for all styling. Do not write custom CSS unless absolutely necessary.
- Follow mobile-first responsive design principles.
- Use semantic HTML elements for accessibility.
- Ensure proper color contrast for text readability.
- Use Tailwind spacing scale consistently (px-4, py-3, etc.).

## Backend Conventions

### Express.js

- Use middleware in this order: helmet, cors, express.json, express.urlencoded, custom middleware
- Always include error handling middleware at the end of the middleware chain.
- API routes should be prefixed with `/api/`.
- Use proper HTTP status codes (200, 201, 400, 404, 500, etc.).

### Error Handling

- Always include try-catch blocks for async operations.
- Log errors to the console with appropriate context.
- Return user-friendly error messages in API responses.
- Never expose sensitive server details in error messages.

### Security

- Use helmet middleware for security headers.
- Enable CORS with appropriate configuration.
- Sanitize all user inputs before processing.
- Never commit secrets, API keys, or credentials to the repository.
- Use environment variables for configuration (store in `.env` file, which is gitignored).

## Database Conventions

- MongoDB is used for data persistence.
- Keep database connection logic separate from route handlers.
- Use proper error handling for all database operations.
- Close database connections properly on server shutdown.

## Offline Functionality

- The application is designed to work offline.
- Use service workers for offline caching (when implemented).
- Implement proper offline indicators to inform users of connection status.
- Handle network errors gracefully and provide clear feedback to users.
- Store critical data locally when offline and sync when connection is restored.

## Forbidden Patterns

- Do not use class components in React. Only use function components.
- Do not use `var` for variable declarations. Use `const` or `let`.
- Do not use inline styles in JSX. Use Tailwind CSS classes.
- Do not hardcode URLs or configuration values. Use environment variables.
- Do not ignore error handling. Always handle errors appropriately.
- Do not commit `node_modules`, `dist`, or other build artifacts.
- Do not use emojis in code comments or log messages (UI display is acceptable per component design).

## Dependency Management

- Only add new dependencies when absolutely necessary.
- Prefer well-maintained, popular libraries with active communities.
- Review security advisories before adding new dependencies.
- Keep dependencies up to date, but test thoroughly after updates.
- Document why a dependency was added if it's not obvious.

## Git Workflow

- Write clear, descriptive commit messages.
- Keep commits focused on a single change or feature.
- Do not commit sensitive data, credentials, or API keys.
- Review `.gitignore` to ensure build artifacts and dependencies are excluded.

## Agent Response Formatting

- Responses should avoid using emojis in explanations and code comments.
- Provide clear, concise explanations for code changes.
- Include context for why a particular approach was chosen when relevant.