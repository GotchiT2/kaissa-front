// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    interface Locals {
      user: import("lucia").User | null;
      session: import("lucia").Session | null;
    }
  }

  interface GameRow {
    id: string;
    whitePlayer: string;
    whiteElo: number;
    blackPlayer: string;
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

declare module "lucia" {
  interface Register {
    Lucia: import("$lib/server/auth").Auth;
  }
  
  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    nationality: string;
    language: string;
  }
}

export {};
