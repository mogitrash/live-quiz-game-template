import { RegData, User } from "../types";
import { getState } from "../state";
import { WebSocket } from "ws";

const credentialKey = (name: string, password: string) => `${name}::${password}`;

export const auth = (data: RegData, ws: WebSocket) => {
  const state = getState();

  if (state.users.has(ws)) {
    const user = state.users.get(ws)!;
    ws.send(
      JSON.stringify({
        type: "reg",
        data: {
          name: user.name,
          index: user.index,
          error: false,
          errorText: "",
        },
        id: 0,
      }),
    );

    return;
  }

  const name = typeof data?.name === "string" ? data.name : "";
  const password = typeof data?.password === "string" ? data.password : "";

  const key = credentialKey(name, password);
  const existing = state.accountsByCredentials.get(key);

  let index: string;
  if (existing) {
    index = existing.index;
    const staleSockets: WebSocket[] = [];
    for (const [oldWs, u] of state.users.entries()) {
      if (u.index === index) {
        staleSockets.push(oldWs);
      }
    }
    for (const oldWs of staleSockets) {
      state.users.delete(oldWs);
    }
  } else {
    index = crypto.randomUUID();
    state.accountsByCredentials.set(key, { index, name });
  }

  const user: User = {
    name,
    password,
    index,
    ws,
  };

  state.users.set(ws, user);

  ws.send(
    JSON.stringify({
      type: "reg",
      data: {
        name: user.name,
        index: user.index,
        error: false,
        errorText: "",
      },
      id: 0,
    }),
  );
};
