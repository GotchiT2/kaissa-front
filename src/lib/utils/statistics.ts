export interface WinStatistics {
  whitePct: number;
  drawPct: number;
  blackPct: number;
}

export function calculateWinPercentages(
  whiteWins: number,
  blackWins: number,
  draws: number
): [number, number, number] {
  const total = whiteWins + blackWins + draws;
  if (total === 0) {
    return [0, 0, 0];
  }
  return [
    Math.round((whiteWins / total) * 100),
    Math.round((draws / total) * 100),
    Math.round((blackWins / total) * 100)
  ];
}
