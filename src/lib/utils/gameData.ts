import type { GameRow } from "$lib/types/chess.types";

export function formatMoves(coups: any[]): string {
  if (!coups || coups.length === 0) return '—';

  const moves = coups.slice(0, 8).map((coup, index) => {
    const moveNumber = Math.floor(index / 2) + 1;
    const move = coup.coupUci || '';

    if (index % 2 === 0) {
      return `${moveNumber}. ${move}`;
    } else {
      return move;
    }
  });

  return moves.join(' ');
}

export function normalizeResult(result: string | null | undefined): "1-0" | "0-1" | "½-½" {
  if (result === "BLANCS") return "1-0";
  if (result === "NOIRS") return "0-1";
  if (result === "NULLE") return "½-½";
  return "½-½";
}

export function transformPartieToGameRow(partie: any): GameRow {
  return {
    id: partie.id,
    whitePlayer: partie.blancNom || '?',
    blackPlayer: partie.noirNom || '?',
    tournament: partie.event || '?',
    date: partie.datePartie ? new Date(partie.datePartie).toLocaleDateString() : '?',
    whiteElo: partie.blancElo || 0,
    blackElo: partie.noirElo || 0,
    result: normalizeResult(partie.resultat),
    notation: formatMoves(partie.coups || []),
    isInAnalysis: partie.isInAnalysis || false,
    tagIds: partie.tags?.map((t: any) => t.tagId) || [],
  };
}
