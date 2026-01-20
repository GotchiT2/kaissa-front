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
  nom: string;
  creatorId: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  parties: CollectionGame[];
}

export interface CollectionGame {
  id: string;
  collectionId: string;
  gameId: string;
  game: Game;
  addedAt: Date;
}

export interface CollectionWithGames extends Collection {
  parties: CollectionGame[];
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
  id: string;
  whitePlayer: string;
  whiteElo: number;
  blackPlayer: string;
  blackElo: number;
  result: "1-0" | "0-1" | "½-½";
  date: string;
  tournament: string;
  notation: string;
  isInAnalysis: boolean;
  tagIds: string[];
}
