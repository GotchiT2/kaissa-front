import { Chess } from 'chess.js';

export interface FenParseResult {
  fen: string;
  moveNumber: number;
  sideToMove: 'w' | 'b';
  startingPly: number;
  isValid: boolean;
  error?: string;
}

export function parseFEN(fen: string): FenParseResult {
  try {
    const fenParts = fen.trim().split(/\s+/);
    
    if (fenParts.length !== 6) {
      return {
        fen,
        moveNumber: 1,
        sideToMove: 'w',
        startingPly: 1,
        isValid: false,
        error: 'Format FEN invalide : doit contenir 6 parties séparées par des espaces'
      };
    }

    const chess = new Chess();
    
    try {
      chess.load(fen);
    } catch (error) {
      return {
        fen,
        moveNumber: 1,
        sideToMove: 'w',
        startingPly: 1,
        isValid: false,
        error: error instanceof Error ? error.message : 'FEN invalide'
      };
    }

    const sideToMove = fenParts[1] as 'w' | 'b';
    const moveNumber = parseInt(fenParts[5], 10);

    if (isNaN(moveNumber) || moveNumber < 1) {
      return {
        fen,
        moveNumber: 1,
        sideToMove,
        startingPly: 1,
        isValid: false,
        error: 'Numéro de coup invalide'
      };
    }

    const startingPly = sideToMove === 'w' 
      ? (moveNumber * 2) - 1 
      : moveNumber * 2;

    return {
      fen,
      moveNumber,
      sideToMove,
      startingPly,
      isValid: true
    };
  } catch (error) {
    return {
      fen,
      moveNumber: 1,
      sideToMove: 'w',
      startingPly: 1,
      isValid: false,
      error: error instanceof Error ? error.message : 'Erreur lors du parsing du FEN'
    };
  }
}

export interface FenGameMetadata {
  blancNom: string;
  noirNom: string;
  blancElo?: number;
  noirElo?: number;
  event?: string;
  site?: string;
  datePartie?: Date;
  resultat: 'BLANCS' | 'NOIRS' | 'NULLE' | 'INCONNU';
}

export function createGameFromFEN(
  fen: string,
  metadata: FenGameMetadata
) {
  const fenParse = parseFEN(fen);
  
  if (!fenParse.isValid) {
    throw new Error(fenParse.error || 'FEN invalide');
  }

  const chess = new Chess(fen);

  return {
    ...metadata,
    startingFen: fen,
    startingPly: fenParse.startingPly,
    moves: [],
    parsedMoves: [],
  };
}
