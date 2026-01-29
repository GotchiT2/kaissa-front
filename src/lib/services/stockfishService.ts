export interface WDLData {
  whiteWin: number;
  draw: number;
  blackWin: number;
}

export interface StockfishAnalysis {
  lines: string[];
  bestmove: string;
  isAnalyzing: boolean;
  wdl: WDLData | null;
  depth: number | null;
  version: string;
  evaluation: number | null;
  principalVariation: string | null;
}

export class StockfishService {
  private eventSource: EventSource | null = null;
  private analyzeTimer: number | null = null;
  private lastRequestedFen: string | null = null;
  private onUpdate: (analysis: StockfishAnalysis) => void;
  private stockfishLines: string[] = [];
  private bestmove: string = "";
  private wdl: WDLData | null = null;
  private depth: number | null = null;
  private version: string = "Stockfish 17.1";
  private evaluation: number | null = null;
  private principalVariation: string | null = null;

  constructor(onUpdate: (analysis: StockfishAnalysis) => void) {
    this.onUpdate = onUpdate;
  }

  analyze(fen: string, movetime: number = 1000, delay: number = 300): void {
    this.cancelAnalysis();

    this.stockfishLines = [];
    this.bestmove = "";
    this.wdl = null;
    this.depth = null;
    this.evaluation = null;
    this.principalVariation = null;
    this.notifyUpdate(true);

    if (this.lastRequestedFen === fen) {
      return;
    }

    this.analyzeTimer = window.setTimeout(() => {
      this.startAnalysis(fen, movetime);
    }, delay);
  }

  cancelAnalysis(): void {
    if (this.analyzeTimer) {
      clearTimeout(this.analyzeTimer);
      this.analyzeTimer = null;
    }
    this.close();
  }

  destroy(): void {
    this.cancelAnalysis();
  }

  private startAnalysis(fen: string, movetime: number): void {
    this.lastRequestedFen = fen;

    const id = crypto.randomUUID();
    const url = `/api/proxy/stream?fen=${encodeURIComponent(fen)}&movetime=${movetime}&id=${id}`;

    this.eventSource = new EventSource(url);

    this.eventSource.addEventListener("queued", () => {
      this.stockfishLines = ["Analyse en attente..."];
      this.notifyUpdate(true);
    });

    this.eventSource.addEventListener("info", (e) => {
      const data = JSON.parse((e as MessageEvent).data);
      const line = data.line;
      this.stockfishLines = [...this.stockfishLines, line];

      if (line.includes("info depth")) {
        const depthMatch = line.match(/depth\s+(\d+)/);
        if (depthMatch) {
          this.depth = parseInt(depthMatch[1]);
        }

        const wdlMatch = line.match(/wdl\s+(\d+)\s+(\d+)\s+(\d+)/);
        if (wdlMatch) {
          this.wdl = {
            whiteWin: parseInt(wdlMatch[1]),
            draw: parseInt(wdlMatch[2]),
            blackWin: parseInt(wdlMatch[3]),
          };
        }

        const cpMatch = line.match(/cp\s+(-?\d+)/);
        if (cpMatch) {
          this.evaluation = parseInt(cpMatch[1]) / 100;
        }

        const pvMatch = line.match(/ pv\s+(.+)$/);
        if (pvMatch) {
          this.principalVariation = pvMatch[1].trim();
        }
      }

      this.notifyUpdate(true);
    });

    this.eventSource.addEventListener("bestmove", (e) => {
      const data = JSON.parse((e as MessageEvent).data);
      const bestmoveLine = data.line;
      const bestmoveMatch = bestmoveLine.match(/bestmove\s+(\S+)/);
      this.bestmove = bestmoveMatch ? bestmoveMatch[1] : bestmoveLine;

      if (this.bestmove && this.principalVariation) {
        const firstPvMove = this.principalVariation.trim().split(/\s+/)[0];
        if (firstPvMove !== this.bestmove) {
          this.principalVariation =
            this.bestmove +
            (this.principalVariation
              ? " " + this.principalVariation.split(/\s+/).slice(1).join(" ")
              : "");
        }
      }

      this.notifyUpdate(false);
      this.close();
    });

    this.eventSource.addEventListener("error", (e) => {
      console.error("Erreur EventSource:", e);
      this.close();
    });
  }

  private notifyUpdate(isAnalyzing: boolean): void {
    this.onUpdate({
      lines: this.stockfishLines,
      bestmove: this.bestmove,
      isAnalyzing,
      wdl: this.wdl,
      depth: this.depth,
      version: this.version,
      evaluation: this.evaluation,
      principalVariation: this.principalVariation,
    });
  }

  private close(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
