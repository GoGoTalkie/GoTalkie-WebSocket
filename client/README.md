# React + TypeScript Frontend

This is the React + TypeScript frontend for the GoTalkie WebSocket Chat application.

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **WebSocket API** - Real-time communication

## Project Structure

```
client/
├── src/
│   ├── components/          # React components
│   │   ├── Login.tsx        # Login screen
│   │   ├── Sidebar.tsx      # Users & groups sidebar
│   │   ├── ChatArea.tsx     # Main chat interface
│   │   ├── Notification.tsx # Toast notifications
│   │   └── CreateGroupModal.tsx # Group creation dialog
│   ├── services/
│   │   └── websocket.ts     # WebSocket service class
│   ├── App.tsx              # Main application component
│   ├── App.css              # Application styles
│   ├── main.tsx             # Application entry point
│   ├── types.ts             # TypeScript type definitions
│   └── vite-env.d.ts        # Vite type declarations
├── public/                  # Static assets
├── index.html               # HTML template
├── package.json             # Dependencies & scripts
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite configuration
```

## Development

### Install Dependencies
```bash
npm install
```

### Start Dev Server
```bash
npm run dev
```
Runs on http://localhost:3000 with hot reload.

### Build for Production
```bash
npm run build
```
Outputs to `dist/` folder.

### Preview Production Build
```bash
npm run preview
```

### Lint Code
```bash
npm run lint
```

## Key Components

### App.tsx
Main application component that manages:
- WebSocket connection state
- User authentication
- Message routing
- Global state management

### WebSocket Service
Type-safe WebSocket client with methods for:
- Connection management
- Sending messages (private, group)
- Group operations (create, join)

### Component Hierarchy
```
App
├── Login (when not authenticated)
└── (when authenticated)
    ├── Sidebar
    │   ├── User List
    │   └── Group List
    ├── ChatArea
    │   ├── Message List
    │   └── Input Area
    ├── Notification
    └── CreateGroupModal
```

## WebSocket Integration

The app connects to `ws://localhost:8080/ws` and uses these message types:

```typescript
// Client → Server
{ type: "register", content: "username" }
{ type: "private", to: "user", content: "msg" }
{ type: "group_message", group_name: "group", content: "msg" }
{ type: "join_group", group_name: "group" }
{ type: "create_group", group_name: "group" }

// Server → Client
{ type: "register", content: "Registered as username" }
{ type: "client_list", clients: ["user1", "user2"] }
{ type: "group_list", groups: [{name: "group", members: [...]}] }
{ type: "private", from: "user", content: "msg" }
{ type: "group_message", from: "user", group_name: "group", content: "msg" }
{ type: "error", error: "error message" }
```

## Styling

All styles are in `App.css` using:
- Flexbox layout
- CSS animations
- Responsive design with media queries
- Modern UI patterns (cards, shadows, transitions)

## TypeScript Types

All message types and interfaces are defined in `types.ts`:
- `Message` - WebSocket message structure
- `Group` - Group information
- `Chat` - Current chat context
- `NotificationType` - Toast notification types

## Configuration

### Vite Config
- Dev server on port 3000
- WebSocket proxy to Go backend
- React plugin with Fast Refresh

### TypeScript Config
- Strict mode enabled
- Modern ES2020 target
- JSX support with React 18

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Modern browsers with WebSocket support

## Environment Variables

No environment variables needed. WebSocket URL is hardcoded for simplicity.
For production, you may want to use:

```typescript
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';
```

Then create `.env`:
```
VITE_WS_URL=ws://your-production-server.com/ws
```
