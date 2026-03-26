import { WebSocket } from 'ws';
import { RegData, User, WSMessage } from './types';
import { getState } from './state';
import { auth } from './commands/auth';

export const route = (ws: WebSocket, message: WSMessage) => {
  const { data } = message;

  switch (message.type) {
    case 'reg':
      auth(data, ws);
      break;
    case 'create_game':
      break;
    case 'join_game':
      break;
    case 'start_game':
      break;
  }
};
