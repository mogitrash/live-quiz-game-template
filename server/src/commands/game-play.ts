import { getState } from "../state";
import { AnswerData, Game, StartGameData, WSMessage } from "../types";
import { WebSocket } from "ws";

const broadcastToGamePlayers = (game: Game, message: WSMessage) => {
  const state = getState();
  const payload = JSON.stringify(message);
  const playerIndices = new Set(game.players.map((p) => p.index));

  state.users.forEach((user) => {
    if (!user.ws) {
      return;
    }
    if (user.index === game.hostId || playerIndices.has(user.index)) {
      user.ws.send(payload);
    }
  });
};

const BASE_POINTS = 1000;

const incrementQuestion = (game: Game) => {
  game.currentQuestion++;
  sendCurrentQuestion(game);
};

const sendQuestionBroadcast = (game: Game) => {
  const currentQuestion = game.questions[game.currentQuestion];
  const questionBroadcast: WSMessage = {
    type: "question_result",
    data: {
      questionIndex: game.currentQuestion,
      correctIndex: currentQuestion.correctIndex,
      playerResults: game.players.map((player) => {
        const answer = game.playerAnswers.get(player.index);

        if (!answer) {
          return {
            name: player.name,
            answered: false,
            correct: false,
            pointsEarned: 0,
            totalScore: player.score,
          };
        }

        const elapsedSec = Math.floor(
          (answer.timestamp - (game.questionStartTime ?? answer.timestamp)) / 1000,
        );
        const timeRemaining = Math.max(0, currentQuestion.timeLimitSec - elapsedSec);

        const correct = answer.answerIndex === currentQuestion.correctIndex;
        const pointsEarned = correct
          ? calcQuestionPoints(timeRemaining, currentQuestion.timeLimitSec)
          : 0;

        player.answeredCorrectly = correct;
        player.score += pointsEarned;
        return {
          name: player.name,
          answered: player.hasAnswered,
          correct: player.answeredCorrectly,
          pointsEarned: pointsEarned,
          totalScore: player.score,
        };
      }),
    },
    id: 0,
  };

  broadcastToGamePlayers(game, questionBroadcast);

  setTimeout(() => {
    if (game.currentQuestion === game.questions.length - 1) {
      sendGameFinishedBroadcast(game);
    } else {
      incrementQuestion(game);
      sendCurrentQuestion(game);
    }
  }, 5000);
};

const sendCurrentQuestion = (game: Game) => {
  game.playerAnswers = new Map();
  game.questionStartTime = Date.now();

  const currentQuestion = game.questions[game.currentQuestion];
  const questionBroadcast: WSMessage = {
    type: "question",
    data: {
      questionNumber: game.currentQuestion + 1,
      totalQuestions: game.questions.length,
      text: currentQuestion.text,
      options: currentQuestion.options,
      timeLimitSec: currentQuestion.timeLimitSec,
    },
    id: 0,
  };

  broadcastToGamePlayers(game, questionBroadcast);

  game.questionTimer = setTimeout(() => {
    sendQuestionBroadcast(game);
  }, currentQuestion.timeLimitSec * 1000);
};

const calcQuestionPoints = (timeRemainingSec: number, timeLimitSec: number) => {
  if (timeLimitSec <= 0) {
    return 0;
  }
  return Math.min(BASE_POINTS, Math.floor(BASE_POINTS * (timeRemainingSec / timeLimitSec)));
};

const sendGameFinishedBroadcast = (game: Game) => {
  const sortedPlayers = game.players.sort((a, b) => b.score - a.score);

  const gameFinishedBroadcast: WSMessage = {
    type: "game_finished",
    data: {
      scoreboard: sortedPlayers.map((player, index) => ({
        name: player.name,
        score: player.score,
        rank: index + 1,
      })),
    },
    id: 0,
  };
  game.status = "finished";

  broadcastToGamePlayers(game, gameFinishedBroadcast);
};

export const startGame = (startGameData: StartGameData, ws: WebSocket) => {
  const state = getState();

  const user = state.users.get(ws);
  if (!user) {
    return;
  }

  const gameId = typeof startGameData?.gameId === "string" ? startGameData.gameId.trim() : "";
  if (!gameId) {
    return;
  }

  const game = state.games.get(gameId);

  if (!game) {
    return;
  }

  if (game.hostId !== user.index) {
    return;
  }

  if (game.status !== "waiting" || game.questions.length === 0) {
    return;
  }

  game.status = "in_progress";

  sendCurrentQuestion(game);
};

export const answerQuestion = (answerData: AnswerData, ws: WebSocket) => {
  const state = getState();
  const user = state.users.get(ws);

  if (!user) {
    return;
  }

  const gameId = typeof answerData?.gameId === "string" ? answerData.gameId.trim() : "";
  if (!gameId) {
    return;
  }

  const game = state.games.get(gameId);

  if (!game || game.status !== "in_progress") {
    return;
  }

  const player = game.players.find((p) => p.index === user.index);

  if (!player) {
    return;
  }

  const qIndex = answerData?.questionIndex;
  if (typeof qIndex !== "number" || !Number.isInteger(qIndex) || qIndex !== game.currentQuestion) {
    return;
  }

  const currentQuestion = game.questions[game.currentQuestion];
  if (!currentQuestion) {
    return;
  }

  const answerIndex = answerData?.answerIndex;
  const optionCount = currentQuestion.options.length;
  if (
    typeof answerIndex !== "number" ||
    !Number.isInteger(answerIndex) ||
    answerIndex < 0 ||
    answerIndex >= optionCount
  ) {
    return;
  }

  player.hasAnswered = true;
  player.answerTime = Date.now();

  game.playerAnswers.set(user.index, {
    answerIndex: answerData.answerIndex,
    timestamp: Date.now(),
  });

  const response: WSMessage = {
    type: "answer_accepted",
    data: {
      questionIndex: game.currentQuestion,
    },
    id: 0,
  };

  ws.send(JSON.stringify(response));

  if (game.playerAnswers.size === game.players.length) {
    clearTimeout(game.questionTimer);
    sendQuestionBroadcast(game);
  }
};
