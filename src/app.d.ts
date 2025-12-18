// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  interface GameRow {
    id: string;
    white: string;
    whiteElo: number;
    black: string;
    blackElo: number;
    result: "1-0" | "0-1" | "½-½";
    date: string;
    tournament: string;
    notation: string;
  }

  type Color = "w" | "b";
  type PieceType = "p" | "n" | "b" | "r" | "q" | "k";

  interface Piece {
    color: Color;
    type: PieceType;
  }

  interface Deplacement {
    san: string;
    piece: Piece;
  }

  interface Cell {
    square: string;
    piece: Piece | null;
  }
}

export {};
