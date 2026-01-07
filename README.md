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

### When running locally
- If accessing the site without SSL and through the server IP (not localhost) then functionality such as ServiceWorkers and camera access will be disallowed. Therefore change chrome flags as indicated here: https://docs.vdo.ninja/common-errors-and-known-issues/cant-load-camera-from-non-ssl-host

## Deployment

This project is deployed to GitHub Pages with support for both main deployment and PR previews. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for details on the deployment strategy.