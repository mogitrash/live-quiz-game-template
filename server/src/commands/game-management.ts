import { getState } from '../state';
import { CreateGameData, Game, WSMessage } from '../types';
import { WebSocket } from 'ws';

export const createGame = (data: CreateGameData, ws: WebSocket) => {
  const state = getState();

  const user = state.users.get(ws);

  if (!user) {
    return;
  }

  const newGame: Game = {
    id: crypto.randomUUID(),
    hostId: user.index,
    code: (crypto.getRandomValues(new Uint32Array(1))[0] % 10000).toString().padStart(4, '0'),
    questions: data.questions,
    players: [],
    currentQuestion: 0,
    status: 'waiting',
    playerAnswers: new Map(),
  };

  state.games.set(newGame.id, newGame);

  const response: WSMessage = {
    type: 'game_created',
    data: {
      gameId: newGame.id,
      code: newGame.code,
    },
    id: 0,
  };

  ws.send(JSON.stringify(response));
};
