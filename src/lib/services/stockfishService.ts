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

type Score =
  | { type: "cp"; value: number; bound?: "lowerbound" | "upperbound" }
  | { type: "mate"; value: number; bound?: "lowerbound" | "upperbound" };

type InfoEventPayload = {
  op?: "info";
  id?: string;

  depth?: number;
  seldepth?: number;
  multipv?: number;

  score?: Score;
  wdl?: { win: number; draw: number; loss: number };

  nodes?: number;
  nps?: number;
  time?: number;

  pv?: string[];

  // fields from engine may still include:
  type?: string; // analysis:info forwarded through proxy/api
};

type BestmovePayload = {
  op?: "bestmove";
  id?: string;
  bestmove?: string;
  ponder?: string;
  type?: string; // analysis:bestmove forwarded through proxy/api
};

function formatInfoLine(d: InfoEventPayload) {
  const parts: string[] = [];
  if (typeof d.depth === "number") parts.push(`depth ${d.depth}`);
  if (typeof d.multipv === "number" && d.multipv !== 1)
    parts.push(`multipv ${d.multipv}`);

  if (d.score?.type === "cp")
    parts.push(`cp ${(d.score.value / 100).toFixed(2)}`);
  if (d.score?.type === "mate") parts.push(`mate ${d.score.value}`);

  if (d.wdl) parts.push(`wdl ${d.wdl.win} ${d.wdl.draw} ${d.wdl.loss}`);
  if (Array.isArray(d.pv) && d.pv.length) parts.push(`pv ${d.pv.join(" ")}`);

  return parts.length ? `info ${parts.join(" ")}` : "info";
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

    // (optionnel) si tu veux vraiment éviter une relance sur même FEN
    if (this.lastRequestedFen === fen) return;

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

    // (optionnel) multipv si tu veux l'exposer
    const multipv = 1;

    const url =
      `/api/proxy/stream?fen=${encodeURIComponent(fen)}` +
      `&movetime=${movetime}` +
      `&id=${id}` +
      `&multipv=${multipv}`;

    const isBlackToMove = fen.split(" ")[1] === "b";

    this.eventSource = new EventSource(url);

    this.eventSource.addEventListener("queued", () => {
      this.stockfishLines = ["Analyse en attente..."];
      this.notifyUpdate(true);
    });

    this.eventSource.addEventListener("status", (e) => {
      // Optionnel: tu peux afficher le status RUNNING/STOPPING/IDLE
      try {
        const data = JSON.parse((e as MessageEvent).data);
      } catch {}
    });

    this.eventSource.addEventListener("info", (e) => {
      let data: InfoEventPayload;
      try {
        data = JSON.parse((e as MessageEvent).data);
      } catch {
        return;
      }

      // Si multipv > 1, on ne garde que la ligne principale (multipv 1)
      if (typeof data.multipv === "number" && data.multipv !== 1) {
        return;
      }

      // Construit une ligne "lisible" pour ton tableau lines
      const prettyLine = formatInfoLine(data);
      this.stockfishLines = [...this.stockfishLines, prettyLine];

      // Depth
      if (typeof data.depth === "number") {
        this.depth = data.depth;
      }

      // WDL (win/draw/loss) : côté engine c'est généralement du point de vue du camp au trait.
      // Dans ton ancienne logique, tu swap selon black-to-move pour exposer whiteWin/blackWin.
      if (
        data.wdl &&
        Number.isFinite(data.wdl.win) &&
        Number.isFinite(data.wdl.draw) &&
        Number.isFinite(data.wdl.loss)
      ) {
        const win = data.wdl.win;
        const draw = data.wdl.draw;
        const loss = data.wdl.loss;

        if (isBlackToMove) {
          // "win" = black win, "loss" = white win
          this.wdl = { whiteWin: loss, draw, blackWin: win };
        } else {
          // "win" = white win, "loss" = black win
          this.wdl = { whiteWin: win, draw, blackWin: loss };
        }
      }

      // Evaluation: score cp en pawns
      if (data.score?.type === "cp" && Number.isFinite(data.score.value)) {
        // Stockfish cp est généralement du point de vue du camp au trait.
        // Si tu veux une éval "positive = avantage blanc", tu peux inverser quand c'est noir au trait :
        const cp = data.score.value;
        const pawns = cp / 100;

        // Choix: conserver "du point de vue du camp au trait" (ancien comportement implicite),
        // ou convertir en "blanc positif":
        const normalized = isBlackToMove ? -pawns : pawns;

        this.evaluation = normalized;
      }

      // PV
      if (Array.isArray(data.pv) && data.pv.length > 0) {
        this.principalVariation = data.pv.join(" ");
      }

      this.notifyUpdate(true);
    });

    this.eventSource.addEventListener("bestmove", (e) => {
      let data: BestmovePayload;
      try {
        data = JSON.parse((e as MessageEvent).data);
      } catch {
        this.close();
        return;
      }

      this.bestmove = data.bestmove ?? "";

      // Sécurité: si PV existe mais ne commence pas par bestmove, on recolle
      if (this.bestmove && this.principalVariation) {
        const pvMoves = this.principalVariation.trim().split(/\s+/);
        if (pvMoves.length > 0 && pvMoves[0] !== this.bestmove) {
          pvMoves[0] = this.bestmove;
          this.principalVariation = pvMoves.join(" ");
        }
      }

      this.notifyUpdate(false);
      this.close();
    });

    this.eventSource.addEventListener("error", (e) => {
      // Si le serveur SSE envoie event:error, ce handler se déclenche aussi.
      // Tu peux parser e.data si c'est un MessageEvent, mais EventSource native
      // déclenche souvent error sans payload exploitable.
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
