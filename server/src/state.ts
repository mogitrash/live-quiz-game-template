import { User } from './types';

const state: State = {
  users: new Map(),
};

export const getState = (): State => state;

export interface State {
  users: Map<string, User>;
}
