import type { Chess } from "chess.js";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

export function buildBoard(game: Chess) {
  return RANKS.map((rank) =>
    FILES.map((file) => {
      const square = `${file}${rank}` as string;
      const piece = game.get(square) as Piece | null;
      return { square, piece };
    }),
  );
}

export function pieceToUnicode(piece: Piece): string {
  const map = {
    w: { p: "♙", n: "♘", b: "♗", r: "♖", q: "♕", k: "♔" },
    b: { p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚" },
  };
  return map[piece.color][piece.type];
}

export function updateStatus(game: Chess): string {
  if (game.isCheckmate()) {
    return game.turn() === "w"
      ? "Échec et mat — les Blancs perdent"
      : "Échec et mat — les Noirs perdent";
  }

  if (game.isStalemate()) {
    return "Pat — match nul";
  }

  if (game.isDraw()) {
    return "Match nul";
  }

  if (game.isCheck()) {
    return game.turn() === "w"
      ? "Les Blancs sont en échec"
      : "Les Noirs sont en échec";
  }

  return game.turn() === "w" ? "Trait aux Blancs" : "Trait aux Noirs";
}

export interface CapturedPieces {
  white: { type: string; unicode: string }[];
  black: { type: string; unicode: string }[];
  whiteScore: number;
  blackScore: number;
  scoreDifference: number;
}

const PIECE_VALUES = {
  q: 10,
  r: 5,
  b: 3,
  n: 3,
  p: 1,
};

const PIECE_ORDER = ["q", "r", "b", "n", "p"];

export function calculateCapturedPieces(game: Chess): CapturedPieces {
  const initialPieces = {
    w: { q: 1, r: 2, b: 2, n: 2, p: 8 },
    b: { q: 1, r: 2, b: 2, n: 2, p: 8 },
  };

  const currentPieces = {
    w: { q: 0, r: 0, b: 0, n: 0, p: 0 },
    b: { q: 0, r: 0, b: 0, n: 0, p: 0 },
  };

  // Compter les pièces actuelles sur l'échiquier
  for (const rank of RANKS) {
    for (const file of FILES) {
      const square = `${file}${rank}`;
      const piece = game.get(square as any);
      if (piece && piece.type !== "k") {
        currentPieces[piece.color][piece.type as keyof typeof PIECE_VALUES]++;
      }
    }
  }

  // Calculer les pièces capturées (pièces manquantes pour chaque camp)
  const capturedByWhite: { type: string; unicode: string }[] = [];
  const capturedByBlack: { type: string; unicode: string }[] = [];

  for (const pieceType of PIECE_ORDER) {
    const blackMissing = initialPieces.b[pieceType as keyof typeof PIECE_VALUES] - currentPieces.b[pieceType as keyof typeof PIECE_VALUES];
    for (let i = 0; i < blackMissing; i++) {
      capturedByWhite.push({
        type: pieceType,
        unicode: pieceToUnicode({ type: pieceType, color: "b" } as Piece),
      });
    }

    const whiteMissing = initialPieces.w[pieceType as keyof typeof PIECE_VALUES] - currentPieces.w[pieceType as keyof typeof PIECE_VALUES];
    for (let i = 0; i < whiteMissing; i++) {
      capturedByBlack.push({
        type: pieceType,
        unicode: pieceToUnicode({ type: pieceType, color: "w" } as Piece),
      });
    }
  }

  // Calculer le score de matériel
  let whiteScore = 0;
  let blackScore = 0;

  for (const piece of capturedByWhite) {
    whiteScore += PIECE_VALUES[piece.type as keyof typeof PIECE_VALUES];
  }

  for (const piece of capturedByBlack) {
    blackScore += PIECE_VALUES[piece.type as keyof typeof PIECE_VALUES];
  }

  return {
    white: capturedByWhite,
    black: capturedByBlack,
    whiteScore,
    blackScore,
    scoreDifference: whiteScore - blackScore,
  };
}
