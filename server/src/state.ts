import { Game, User } from "./types";
import { WebSocket } from "ws";

const state: State = {
  users: new Map(),
  games: new Map(),
};

export const getState = (): State => state;

export interface State {
  users: Map<WebSocket, User>;
  games: Map<string, Game>;
}
