import { WebSocketServer, WebSocket, RawData } from "ws";
import { WSMessage } from "./types";
import { route } from "./routing";
import { getState } from "./state";
import { updatePlayers } from "./commands/game-management";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// WebSocket server
const wss = new WebSocketServer({ port: PORT });

const registerWsListener = (ws: WebSocket) => {
  ws.on("message", (message: RawData) => {
    route(ws, JSON.parse(message.toString()) as WSMessage);
  });

  ws.on("close", () => {
    const state = getState();
    const user = state.users.get(ws);
    const index = user?.index;

    state.users.delete(ws);

    if (!index) {
      return;
    }

    state.games.forEach((game) => {
      game.players = game.players.filter((player) => player.index !== index);
      updatePlayers(game);
    });
  });
};

wss.on("listening", () => {
  console.log(`Server is listening on port ${PORT}`);
});

wss.on("connection", (ws) => registerWsListener(ws));
