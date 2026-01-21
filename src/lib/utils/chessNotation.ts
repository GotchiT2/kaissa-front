import { Chess } from "chess.js";

export interface GroupedMove {
  moveNumber: number;
  white: string;
  black: string;
  whiteIndex: number;
  blackIndex: number;
}

export function convertUciToSan(coups: Array<{ coupUci: string | null }>): string[] {
  const tempGame = new Chess();
  const movesInSan: string[] = [];

  for (const coup of coups) {
    if (coup.coupUci) {
      try {
        const move = tempGame.move({
          from: coup.coupUci.substring(0, 2),
          to: coup.coupUci.substring(2, 4),
          promotion: coup.coupUci.length > 4 ? coup.coupUci[4] : undefined
        });
        if (move) {
          movesInSan.push(move.san);
        }
      } catch (e) {
        console.error("Erreur lors de la conversion du coup:", coup.coupUci, e);
      }
    }
  }

  return movesInSan;
}

export function groupMovesByPair(moves: string[]): GroupedMove[] {
  const result: GroupedMove[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    result.push({
      moveNumber: i / 2 + 1,
      white: moves[i] ?? "",
      black: moves[i + 1] ?? "",
      whiteIndex: i + 1,
      blackIndex: i + 2
    });
  }
  return result;
}

export function rebuildGamePosition(moves: string[], targetIndex: number): Chess {
  const game = new Chess();
  for (let i = 0; i < targetIndex; i++) {
    if (moves[i]) {
      game.move(moves[i]);
    }
  }
  return game;
}
