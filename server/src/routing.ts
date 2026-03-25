import { WebSocket } from 'ws';
import { RegData, User, WSMessage } from './types';
import { getState } from './state';

export const registerUser = (regData: RegData, ws: WebSocket) => {
  const newUser: User = {
    name: regData.name,
    password: regData.password,
    index: crypto.randomUUID(),
    ws,
  };

  getState().users.set(newUser.name, newUser);
};

export const route = (ws: WebSocket, message: WSMessage) => {
  switch (message.type) {
    case 'reg':
      const { data } = message;

      registerUser(data, ws);
      break;
    case 'create_game':
      break;
    case 'join_game':
      break;
    case 'start_game':
      break;
  }
};
