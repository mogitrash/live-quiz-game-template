import { RegData, User } from '../types';
import { getState } from '../state';
import { WebSocket } from 'ws';

export const auth = (regData: RegData, ws: WebSocket) => {
  const state = getState();

  if (state.users.has(regData.name)) {
    const user = state.users.get(regData.name)!;
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
    name: regData.name,
    password: regData.password,
    index: crypto.randomUUID(),
    ws,
  };

  getState().users.set(newUser.name, newUser);

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
