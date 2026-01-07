# SuperSuper - Your trusted supermarket companion!

A web application that allows users to compare products while shopping in a supermarket. The application is hosted locally on the user's home network and supports offline functionality.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/luisgepeto/SuperSuper.git
cd SuperSuper
```

2. Install dependencies:
```bash
npm install
```

3. Start the development servers:
```bash
npm run dev
```

This will start both the frontend (port 3000) and backend (port 5000) servers.

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:frontend` - Start only frontend development server
- `npm run dev:backend` - Start only backend development server
- `npm run build` - Build the frontend for production
- `npm start` - Start the production server

## Deployment

### GitHub Pages

The application is automatically deployed to GitHub Pages when changes are pushed to the `main` branch. The deployed site is available at:

**https://luisgepeto.github.io/SuperSuper/**

The deployment process:
1. Builds the application using Vite
2. Adjusts asset paths to work with GitHub Pages subdirectory
3. Creates a 404.html for SPA routing support
4. Deploys to the `gh-pages` branch

You can also manually trigger a deployment by running the workflow from the Actions tab.

### Local Development

The application works seamlessly both locally and on GitHub Pages without any code changes. When running locally:
- Assets are served from root path (`/`)
- No special configuration needed

When deployed to GitHub Pages:
- Assets are automatically adjusted to use the `/SuperSuper/` base path
- Service Worker registration is updated accordingly
- Client-side routing works via 404.html fallback

### When running locally
- If accessing the site without SSL and through the server IP (not localhost) then functionality such as ServiceWorkers and camera access will be disallowed. Therefore change chrome flags as indicated here: https://docs.vdo.ninja/common-errors-and-known-issues/cant-load-camera-from-non-ssl-host