export interface Game {
  id: string;
  whitePlayer: string;
  blackPlayer: string;
  tournament: string | null;
  date: Date | null;
  whiteElo: number | null;
  blackElo: number | null;
  moves: string;
  result: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Collection {
  id: string;
  title: string;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
  games: CollectionGame[];
}

export interface CollectionGame {
  id: string;
  collectionId: string;
  gameId: string;
  game: Game;
  addedAt: Date;
}

export interface CollectionWithGames extends Collection {
  games: CollectionGame[];
}

export interface CreateGameData {
  whitePlayer: string;
  blackPlayer: string;
  tournament?: string;
  date?: Date;
  whiteElo?: number;
  blackElo?: number;
  moves: string;
  result?: string;
}

export interface GameRow {
  whitePlayer: string;
  blackPlayer: string;
  tournament: string;
  date: string;
  whiteElo: number;
  blackElo: number;
  result: string;
}
