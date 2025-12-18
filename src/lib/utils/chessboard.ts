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
