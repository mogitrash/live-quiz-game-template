import { WebSocket } from "ws";
import { RegData, User, WSMessage } from "./types";

import { auth } from "./commands/auth";
import { createGame, joinGame } from "./commands/game-management";
import { answerQuestion, startGame } from "./commands/game-play";

export const route = (ws: WebSocket, message: WSMessage) => {
  const { data } = message;

  switch (message.type) {
    case "reg":
      auth(data, ws);
      break;
    case "create_game":
      createGame(data, ws);
      break;
    case "join_game":
      joinGame(data, ws);
      break;
    case "start_game":
      startGame(data, ws);
      break;
    case "answer":
      answerQuestion(data, ws);
      break;
  }
};
