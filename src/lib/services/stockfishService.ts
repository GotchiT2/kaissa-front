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
}

export class StockfishService {
  private eventSource: EventSource | null = null;
  private analyzeTimer: number | null = null;
  private lastRequestedFen: string | null = null;
  private onUpdate: (analysis: StockfishAnalysis) => void;
  private stockfishLines: string[] = [];
  private bestmove: string = "";
  private wdl: WDLData | null = null;

  constructor(onUpdate: (analysis: StockfishAnalysis) => void) {
    this.onUpdate = onUpdate;
  }

  analyze(fen: string, movetime: number = 1000, delay: number = 300): void {
    this.cancelAnalysis();

    this.stockfishLines = [];
    this.bestmove = "";
    this.notifyUpdate(true);

    if (this.lastRequestedFen === fen) {
      return;
    }

    this.analyzeTimer = window.setTimeout(() => {
      this.startAnalysis(fen, movetime);
    }, delay);
  }

  private startAnalysis(fen: string, movetime: number): void {
    this.lastRequestedFen = fen;

    const id = crypto.randomUUID();
    const url = `/api/proxy/stream?fen=${encodeURIComponent(fen)}&movetime=${movetime}&id=${id}`;

    console.log("Lancement de l'analyse Stockfish pour:", fen);

    this.eventSource = new EventSource(url);

    this.eventSource.addEventListener("queued", () => {
      console.log("Analyse en attente");
      this.stockfishLines = ["Analyse en attente..."];
      this.notifyUpdate(true);
    });

    this.eventSource.addEventListener("info", (e) => {
      const data = JSON.parse((e as MessageEvent).data);
      const line = data.line;
      this.stockfishLines = [...this.stockfishLines, line];
      
      if (line.includes("info depth")) {
        const wdlMatch = line.match(/wdl\s+(\d+)\s+(\d+)\s+(\d+)/);
        if (wdlMatch) {
          this.wdl = {
            whiteWin: parseInt(wdlMatch[1]),
            draw: parseInt(wdlMatch[2]),
            blackWin: parseInt(wdlMatch[3])
          };
        }
      }
      
      this.notifyUpdate(true);
    });

    this.eventSource.addEventListener("bestmove", (e) => {
      const data = JSON.parse((e as MessageEvent).data);
      console.log("Meilleur coup:", data.line);
      this.bestmove = data.line;
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
      wdl: this.wdl
    });
  }

  cancelAnalysis(): void {
    if (this.analyzeTimer) {
      clearTimeout(this.analyzeTimer);
      this.analyzeTimer = null;
    }
    this.close();
  }

  private close(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  destroy(): void {
    this.cancelAnalysis();
  }
}
