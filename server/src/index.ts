import { WebSocketServer, WebSocket, RawData } from 'ws';
import { WSMessage } from './types';
import { route } from './routing';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// WebSocket server
const wss = new WebSocketServer({ port: PORT });

const registerWsListener = (ws: WebSocket) => {
  ws.on('message', (message: RawData) => {
    route(ws, JSON.parse(message.toString()) as WSMessage);
  });
};

wss.on('connection', (ws) => registerWsListener(ws));
