import { Chess } from 'chess.js';

export interface ParsedMove {
  uci: string;
  san: string;
  fen: string;
  ply: number;
}

export interface ParsedGame {
  blancNom: string;
  noirNom: string;
  blancElo?: number;
  noirElo?: number;
  event?: string;
  site?: string;
  datePartie?: Date;
  resultat: 'BLANCS' | 'NOIRS' | 'NULLE' | 'INCONNU';
  moves: string;
  parsedMoves: ParsedMove[];
}

export function parsePGNFile(pgnContent: string): ParsedGame[] {
  const games: ParsedGame[] = [];
  const gameRegex = /\[Event\s+"[^"]*"\][\s\S]*?(?=\[Event\s+|$)/g;
  const matches = pgnContent.match(gameRegex);

  if (!matches) {
    throw new Error('Aucune partie trouvée dans le fichier PGN');
  }

  for (const gameText of matches) {
    try {
      const chess = new Chess();
      
      const headers: Record<string, string> = {};
      const headerRegex = /\[(\w+)\s+"([^"]*)"\]/g;
      let match;
      while ((match = headerRegex.exec(gameText)) !== null) {
        headers[match[1]] = match[2];
      }

      const movesMatch = gameText.match(/\]\s*([\s\S]+)/);
      const movesText = movesMatch ? movesMatch[1].trim() : '';

      chess.loadPgn(gameText);

      const parsedMoves: ParsedMove[] = [];
      const history = chess.history({ verbose: true });
      
      chess.reset();
      
      for (let i = 0; i < history.length; i++) {
        const move = history[i];
        const uci = move.from + move.to + (move.promotion || '');
        chess.move(move.san);
        
        parsedMoves.push({
          uci,
          san: move.san,
          fen: chess.fen(),
          ply: i + 1
        });
      }

      const blancNom = headers['White'] || 'Inconnu';
      const noirNom = headers['Black'] || 'Inconnu';
      const blancElo = headers['WhiteElo'] ? parseInt(headers['WhiteElo']) : undefined;
      const noirElo = headers['BlackElo'] ? parseInt(headers['BlackElo']) : undefined;
      const event = headers['Event'] || undefined;
      const site = headers['Site'] || undefined;

      let datePartie: Date | undefined;
      if (headers['Date'] && headers['Date'] !== '????.??.??') {
        const dateParts = headers['Date'].split('.');
        if (dateParts.length === 3 && dateParts[0] !== '????') {
          try {
            datePartie = new Date(
              parseInt(dateParts[0]),
              parseInt(dateParts[1]) - 1,
              parseInt(dateParts[2])
            );
          } catch {
            datePartie = undefined;
          }
        }
      }

      let resultat: 'BLANCS' | 'NOIRS' | 'NULLE' | 'INCONNU' = 'INCONNU';
      const resultHeader = headers['Result'];
      if (resultHeader === '1-0') {
        resultat = 'BLANCS';
      } else if (resultHeader === '0-1') {
        resultat = 'NOIRS';
      } else if (resultHeader === '1/2-1/2') {
        resultat = 'NULLE';
      }

      games.push({
        blancNom,
        noirNom,
        blancElo,
        noirElo,
        event,
        site,
        datePartie,
        resultat,
        moves: movesText,
        parsedMoves,
      });
    } catch (error) {
      console.error('Erreur lors du parsing d\'une partie:', error);
    }
  }

  return games;
}
