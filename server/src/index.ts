import { WebSocketServer, WebSocket } from 'ws';
import { WSMessage } from './types';
import { route } from './routing';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// WebSocket server
const wss = new WebSocketServer({ port: PORT });

const registerWsListener = (ws: WebSocket) => {
  ws.on('message', (message: WSMessage) => {
    route(ws, message);
  });
};

wss.on('connection', (ws) => registerWsListener);
