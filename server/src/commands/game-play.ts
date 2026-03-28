import { getState } from "../state";
import { AnswerData, Game, StartGameData, WSMessage } from "../types";
import { WebSocket } from "ws";

const incrementQuestion = (game: Game) => {
  game.currentQuestion++;
  sendCurrentQuestion(game);
};

const sendQuestionBroadcast = (game: Game) => {
  const state = getState();
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

        const timeRemaining = Math.floor((Date.now() - answer.timestamp) / 1000);

        const pointsEarned = calcQuestionPoints(timeRemaining, currentQuestion.timeLimitSec);

        player.score += pointsEarned;
        player.answeredCorrectly = answer.answerIndex === currentQuestion.correctIndex;
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

  state.users.forEach((user) => {
    if (user.ws) {
      user.ws.send(JSON.stringify(questionBroadcast));
    }
  });
};

const sendCurrentQuestion = (game: Game) => {
  const state = getState();

  const currentQuestion = game.questions[game.currentQuestion];
  const questionBroadcast: WSMessage = {
    type: "question",
    data: currentQuestion,
    id: 0,
  };

  state.users.forEach((user) => {
    if (user.ws) {
      user.ws.send(JSON.stringify(questionBroadcast));
    }
  });

  game.questionTimer = setTimeout(() => {
    sendQuestionBroadcast(game);
  }, currentQuestion.timeLimitSec * 1000);
};

const calcQuestionPoints = (timeRemaining: number, timeLimit: number) => {
  return 10 * (timeRemaining / timeLimit);
};

export const startGame = (startGameData: StartGameData, ws: WebSocket) => {
  const state = getState();

  const game = state.games.get(startGameData.gameId);

  if (!game) {
    return;
  }

  game.status = "in_progress";

  sendCurrentQuestion(game);
};

export const answerQuestion = (answerData: AnswerData, ws: WebSocket) => {
  const state = getState();
  const game = state.games.get(answerData.gameId);
  const user = state.users.get(ws);

  if (!game || !user || game.status !== "in_progress") {
    return;
  }

  const player = game.players.find((player) => player.index === user.index);

  if (!player) {
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
};
