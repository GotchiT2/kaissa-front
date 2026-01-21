import { calculateWinPercentages } from "$lib/utils/statistics";

export interface BestMove {
  coup: string;
  nbParties: string;
  statsVictoires: [number, number, number];
  elo: number | null;
}

export async function fetchBestMoves(
  collectionId: string,
  hashPosition: string
): Promise<BestMove[]> {
  try {
    const response = await fetch(
      `/api/collections/${collectionId}/position-moves?hashPosition=${hashPosition}`
    );
    const data = await response.json();
    return data.moves.map((move: any) => ({
      coup: move.coup,
      nbParties: move.nbParties.toString(),
      statsVictoires: calculateWinPercentages(
        move.victoiresBlancs,
        move.victoiresNoirs,
        move.nulles
      ),
      elo: move.eloMoyen
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des coups:', error);
    return [];
  }
}
