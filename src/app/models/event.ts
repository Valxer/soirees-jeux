import { User } from "../services/auth.service";

export interface GameEvent {
  id: number;
  name: string;
  date: string;
  max_players: number;
  current_players: number;
  participants: User[];
}