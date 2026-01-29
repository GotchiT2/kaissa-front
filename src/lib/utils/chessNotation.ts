import { Chess } from "chess.js";

export interface GroupedMove {
  moveNumber: number;
  white: string;
  black: string;
  whiteIndex: number;
  blackIndex: number;
  whiteNodeId?: string;
  blackNodeId?: string;
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

export function groupMovesByPair(moves: string[], coups?: Array<{ id: string }>): GroupedMove[] {
  const result: GroupedMove[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    result.push({
      moveNumber: i / 2 + 1,
      white: moves[i] ?? "",
      black: moves[i + 1] ?? "",
      whiteIndex: i + 1,
      blackIndex: i + 2,
      whiteNodeId: coups?.[i]?.id,
      blackNodeId: coups?.[i + 1]?.id
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

export function convertUciMoveToSan(uciMove: string, fen: string = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'): string {
  try {
    const game = new Chess(fen);
    const move = game.move({
      from: uciMove.substring(0, 2),
      to: uciMove.substring(2, 4),
      promotion: uciMove.length > 4 ? uciMove[4] : undefined
    });
    return move ? move.san : uciMove;
  } catch (e) {
    console.error("Erreur lors de la conversion du coup UCI vers SAN:", uciMove, e);
    return uciMove;
  }
}

export function convertUciSequenceToSan(uciSequence: string, fen: string = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'): string {
  try {
    const game = new Chess(fen);
    const uciMoves = uciSequence.trim().split(/\s+/);
    const formattedMoves: string[] = [];
    
    for (let i = 0; i < uciMoves.length; i++) {
      const uciMove = uciMoves[i];
      
      if (uciMove.length < 4) {
        continue;
      }
      
      const moveNumber = game.moveNumber();
      const isWhiteTurn = game.turn() === 'w';
      
      try {
        const move = game.move({
          from: uciMove.substring(0, 2),
          to: uciMove.substring(2, 4),
          promotion: uciMove.length > 4 ? uciMove[4] : undefined
        });
        
        if (move) {
          if (isWhiteTurn) {
            formattedMoves.push(`${moveNumber}.${move.san}`);
          } else {
            if (i === 0) {
              formattedMoves.push(`${moveNumber}...${move.san}`);
            } else {
              formattedMoves.push(move.san);
            }
          }
        }
      } catch (moveError) {
        console.warn(`Coup UCI invalide ignoré: ${uciMove}`, moveError);
        break;
      }
    }
    
    return formattedMoves.length > 0 ? formattedMoves.join(' ') : '';
  } catch (e) {
    console.error("Erreur lors de la conversion de la séquence UCI vers SAN:", uciSequence, e);
    return '';
  }
}
