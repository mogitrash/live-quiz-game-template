import { getState } from "../state";
import { CreateGameData, Game, JoinGameData, WSMessage } from "../types";
import { WebSocket } from "ws";
import { isQuestionsValid } from "../utils";

const ROOM_CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export const updatePlayers = (game: Game) => {
  const state = getState();

  const response: WSMessage = {
    type: "update_players",
    data: game.players,
    id: 0,
  };

  const playerIndexSet = new Set(game.players.map((p) => p.index));

  state.users.forEach((user) => {
    const inLobby = user.index === game.hostId || playerIndexSet.has(user.index);
    if (inLobby && user.ws) {
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

  const questions = data?.questions;
  if (!isQuestionsValid(questions)) {
    return;
  }

  const newGame: Game = {
    id: crypto.randomUUID(),
    hostId: user.index,
    code: generateRoomCode(),
    questions,
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

  const code = typeof data?.code === "string" ? data.code.trim().toUpperCase() : "";

  for (const game of state.games.values()) {
    if (game.code !== code) {
      continue;
    }

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

    state.users.forEach((u) => {
      if (u.ws && u.ws !== ws) {
        u.ws.send(JSON.stringify(broadcastRes));
      }
    });

    updatePlayers(game);
    return;
  }
};
