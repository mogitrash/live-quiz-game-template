import { getState } from "../state";
import { CreateGameData, Game, JoinGameData, WSMessage } from "../types";
import ws, { WebSocket } from "ws";

const ROOM_CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const updatePlayers = (game: Game, ws: WebSocket) => {
  const state = getState();

  const response: WSMessage = {
    type: "update_players",
    data: game.players,
    id: 0,
  };

  state.users.forEach((user) => {
    if (user.ws && user.ws !== ws) {
      user.ws.send(JSON.stringify(response));
    }
  });
};

const generateRoomCode = (): string => {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ROOM_CODE_ALPHABET[bytes[i]! % ROOM_CODE_ALPHABET.length];
  }
  return code;
};

export const createGame = (data: CreateGameData, ws: WebSocket) => {
  const state = getState();

  const user = state.users.get(ws);

  if (!user) {
    return;
  }

  const newGame: Game = {
    id: crypto.randomUUID(),
    hostId: user.index,
    code: generateRoomCode(),
    questions: data.questions,
    players: [],
    currentQuestion: 0,
    status: "waiting",
    playerAnswers: new Map(),
  };

  state.games.set(newGame.id, newGame);

  const response: WSMessage = {
    type: "game_created",
    data: {
      gameId: newGame.id,
      code: newGame.code,
    },
    id: 0,
  };

  ws.send(JSON.stringify(response));
};

export const joinGame = (data: JoinGameData, ws: WebSocket) => {
  const state = getState();

  const user = state.users.get(ws);

  if (!user) {
    return;
  }

  getState().games.forEach((game) => {
    if (game.code === data.code) {
      game.players.push({
        name: user.name,
        index: user.index,
        score: 0,
      });

      const personalRes: WSMessage = {
        type: "game_joined",
        data: {
          gameId: game.id,
        },
        id: 0,
      };

      ws.send(JSON.stringify(personalRes));

      const broadcastRes: WSMessage = {
        type: "player_joined",
        data: {
          playerName: user.name,
          playerCount: game.players.length,
        },
        id: 0,
      };

      state.users.forEach((user) => {
        if (user.ws && user.ws !== ws) {
          user.ws.send(JSON.stringify(broadcastRes));
          updatePlayers(game, user.ws);
        }
      });

      updatePlayers(game, ws);
    }
  });
};
