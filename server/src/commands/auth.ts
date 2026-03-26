import { RegData, User } from '../types';
import { getState } from '../state';
import { WebSocket } from 'ws';

export const auth = (data: RegData, ws: WebSocket) => {
  const state = getState();

  if (state.users.has(ws)) {
    const user = state.users.get(ws)!;
    ws.send(
      JSON.stringify({
        type: 'reg',
        data: {
          name: user.name,
          index: user.index,
        },
        id: 0,
      }),
    );

    return;
  }

  const newUser: User = {
    name: data.name,
    password: data.password,
    index: crypto.randomUUID(),
    ws,
  };

  getState().users.set(ws, newUser);

  ws.send(
    JSON.stringify({
      type: 'reg',
      data: {
        name: newUser.name,
        index: newUser.index,
      },
      id: 0,
    }),
  );
};
