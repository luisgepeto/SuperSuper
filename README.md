# SuperSuper - Your trusted supermarket companion!

A web application that allows users to compare products while shopping in a supermarket. The application is hosted locally on the user's home network and supports offline functionality.

## Features

- Product comparison while shopping
- Offline functionality
- Local network hosting
- Modern, clean UI design

## Technology Stack

- **Frontend**: React with Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local or remote)

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

## Project Structure

```
SuperSuper/
├── src/                 # Frontend source code
│   ├── App.jsx         # Main React component
│   ├── main.jsx        # React entry point
│   └── index.css       # Global styles with Tailwind
├── server/             # Backend source code
│   └── index.js        # Express server
├── public/             # Static files
├── docs/               # Documentation
└── package.json        # Project dependencies and scripts
```

## Contributing

Please follow the coding standards outlined in the project:

- Use semicolons at the end of each statement
- Use single quotes for strings
- Use function-based components in React
- Use arrow functions for callbacks
- Maintain modern and clean design principles

## License

ISC