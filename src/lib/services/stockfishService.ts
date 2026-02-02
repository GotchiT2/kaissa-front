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
  type?: string;
};

type BestmovePayload = {
  op?: "bestmove";
  id?: string;
  bestmove?: string;
  ponder?: string;
  type?: string;
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
  private controlWs: WebSocket | null = null;
  private eventSource: EventSource | null = null;
  private analyzeTimer: number | null = null;
  private lastRequestedFen: string | null = null;
  private currentSessionId: string | null = null;
  private reconnectTimer: number | null = null;
  private wsUrl: string;

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
    // Utiliser l'URL locale du proxy WebSocket
    this.wsUrl = `ws://${window.location.host}/ws/control`;
    this.initControlWebSocket();
  }

  analyze(fen: string, depth: number = 24, delay: number = 300): void {
    this.cancelAnalysis();

    this.stockfishLines = [];
    this.bestmove = "";
    this.wdl = null;
    this.depth = null;
    this.evaluation = null;
    this.principalVariation = null;
    this.notifyUpdate(true);

    if (this.lastRequestedFen === fen) return;

    this.analyzeTimer = window.setTimeout(() => {
      this.startAnalysis(fen, depth);
    }, delay);
  }

  cancelAnalysis(): void {
    if (this.analyzeTimer) {
      clearTimeout(this.analyzeTimer);
      this.analyzeTimer = null;
    }
    this.closeSSE();
  }

  destroy(): void {
    this.cancelAnalysis();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.controlWs) {
      this.controlWs.close();
      this.controlWs = null;
    }
  }

  async extendAnalysis(depth: number = 40): Promise<void> {
    if (!this.currentSessionId) {
      console.error("No active session to extend");
      return;
    }

    // Envoyer commande extend via control WS
    this.sendControlCommand({
      op: "extend",
      id: this.currentSessionId,
      depth,
    });

    // Ré-ouvrir SSE en mode subscribe si fermé
    if (
      !this.eventSource ||
      this.eventSource.readyState === EventSource.CLOSED
    ) {
      // On doit récupérer le FEN actuel pour le mode subscribe
      // Pour simplifier, on ré-ouvre juste le SSE en mode subscribe
      const url = `/api/proxy/stream?id=${this.currentSessionId}&mode=subscribe`;

      const isBlackToMove = this.lastRequestedFen?.split(" ")[1] === "b";

      this.eventSource = new EventSource(url);

      // Réattacher les listeners
      this.eventSource.addEventListener("info", (e) => {
        let data: InfoEventPayload;
        try {
          data = JSON.parse((e as MessageEvent).data);
        } catch {
          return;
        }

        if (typeof data.multipv === "number" && data.multipv !== 1) {
          return;
        }

        const prettyLine = formatInfoLine(data);
        this.stockfishLines = [...this.stockfishLines, prettyLine];

        if (typeof data.depth === "number") {
          this.depth = data.depth;
        }

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
            this.wdl = { whiteWin: loss, draw, blackWin: win };
          } else {
            this.wdl = { whiteWin: win, draw, blackWin: loss };
          }
        }

        if (data.score?.type === "cp" && Number.isFinite(data.score.value)) {
          const cp = data.score.value;
          const pawns = cp / 100;
          const normalized = isBlackToMove ? -pawns : pawns;
          this.evaluation = normalized;
        }

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
          return;
        }

        this.bestmove = data.bestmove ?? "";

        if (this.bestmove && this.principalVariation) {
          const pvMoves = this.principalVariation.trim().split(/\s+/);
          if (pvMoves.length > 0 && pvMoves[0] !== this.bestmove) {
            pvMoves[0] = this.bestmove;
            this.principalVariation = pvMoves.join(" ");
          }
        }

        this.notifyUpdate(false);
      });

      this.eventSource.addEventListener("error", (e) => {
        console.error("Erreur EventSource:", e);
      });
    }

    // Réinitialiser l'état pour indiquer que l'analyse reprend
    this.notifyUpdate(true);
  }

  private initControlWebSocket() {
    if (this.controlWs?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // Construire l'URL du proxy WebSocket
      // Par défaut, le proxy tourne sur le port 8080
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `wss://engineproxyez4zwitd-engine-proxy.functions.fnc.fr-par.scw.cloud`;

      console.log(`Connecting to control WebSocket: ${wsUrl}`);
      this.controlWs = new WebSocket(wsUrl);

      this.controlWs.onopen = () => {
        console.log("Control WebSocket connected");
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.controlWs.onclose = () => {
        console.log("Control WebSocket closed, reconnecting...");
        this.controlWs = null;
        // Reconnexion après 2 secondes
        this.reconnectTimer = window.setTimeout(() => {
          this.initControlWebSocket();
        }, 2000);
      };

      this.controlWs.onerror = (error) => {
        console.error("Control WebSocket error:", error);
      };

      this.controlWs.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          console.log("Control WS message:", msg);

          // Traiter tous les événements reçus via le WebSocket
          this.handleProxyMessage(msg);
        } catch (err) {
          console.error("Error parsing control WS message:", err);
        }
      };
    } catch (error) {
      console.error("Failed to create control WebSocket:", error);
    }
  }

  private startAnalysis(fen: string, depth: number): void {
    this.lastRequestedFen = fen;

    const id = crypto.randomUUID();
    this.currentSessionId = id;

    const multipv = 1;

    // Ouvrir SSE en mode start
    this.openSSE(fen, depth, multipv, id, "start");

    // Envoyer commande analyze via control WS
    this.sendControlCommand({
      op: "analyze",
      id,
      fen,
      depth,
      multipv,
    });
  }

  private openSSE(
    fen: string,
    depth: number,
    multipv: number,
    id: string,
    mode: "start" | "subscribe",
  ): void {
    const url =
      `/api/proxy/stream?id=${id}&mode=${mode}` +
      (mode === "start"
        ? `&fen=${encodeURIComponent(fen)}&depth=${depth}&multipv=${multipv}`
        : "");

    const isBlackToMove = fen.split(" ")[1] === "b";

    this.eventSource = new EventSource(url);

    this.eventSource.addEventListener("queued", () => {
      this.stockfishLines = ["Analyse en attente..."];
      this.notifyUpdate(true);
    });

    this.eventSource.addEventListener("status", () => {
      // Optionnel: afficher le status
    });

    this.eventSource.addEventListener("info", (e) => {
      let data: InfoEventPayload;
      try {
        data = JSON.parse((e as MessageEvent).data);
      } catch {
        return;
      }

      if (typeof data.multipv === "number" && data.multipv !== 1) {
        return;
      }

      const prettyLine = formatInfoLine(data);
      this.stockfishLines = [...this.stockfishLines, prettyLine];

      if (typeof data.depth === "number") {
        this.depth = data.depth;
      }

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
          this.wdl = { whiteWin: loss, draw, blackWin: win };
        } else {
          this.wdl = { whiteWin: win, draw, blackWin: loss };
        }
      }

      if (data.score?.type === "cp" && Number.isFinite(data.score.value)) {
        const cp = data.score.value;
        const pawns = cp / 100;
        const normalized = isBlackToMove ? -pawns : pawns;
        this.evaluation = normalized;
      }

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
        this.closeSSE();
        return;
      }

      this.bestmove = data.bestmove ?? "";

      if (this.bestmove && this.principalVariation) {
        const pvMoves = this.principalVariation.trim().split(/\s+/);
        if (pvMoves.length > 0 && pvMoves[0] !== this.bestmove) {
          pvMoves[0] = this.bestmove;
          this.principalVariation = pvMoves.join(" ");
        }
      }

      this.notifyUpdate(false);

      // Fermer SSE en mode start seulement
      if (mode === "start") {
        this.closeSSE();
      }
    });

    this.eventSource.addEventListener("error", (e) => {
      console.error("Erreur EventSource:", e);
      this.closeSSE();
    });
  }

  private sendControlCommand(command: any): void {
    if (!this.controlWs || this.controlWs.readyState !== WebSocket.OPEN) {
      console.error(
        "Control WebSocket not connected, command not sent:",
        command,
      );
      return;
    }

    try {
      this.controlWs.send(JSON.stringify(command));
      console.log("Control command sent:", command);
    } catch (error) {
      console.error("Error sending control command:", error);
    }
  }

  private handleProxyMessage(msg: any): void {
    const isBlackToMove = this.lastRequestedFen?.split(" ")[1] === "b";

    if (msg.op === "queued") {
      this.stockfishLines = ["Analyse en attente..."];
      this.notifyUpdate(true);
      return;
    }

    if (msg.op === "info") {
      if (typeof msg.multipv === "number" && msg.multipv !== 1) {
        return;
      }

      const prettyLine = formatInfoLine(msg);
      this.stockfishLines = [...this.stockfishLines, prettyLine];

      if (typeof msg.depth === "number") {
        this.depth = msg.depth;
      }

      if (
        msg.wdl &&
        Number.isFinite(msg.wdl.win) &&
        Number.isFinite(msg.wdl.draw) &&
        Number.isFinite(msg.wdl.loss)
      ) {
        const win = msg.wdl.win;
        const draw = msg.wdl.draw;
        const loss = msg.wdl.loss;

        if (isBlackToMove) {
          this.wdl = { whiteWin: loss, draw, blackWin: win };
        } else {
          this.wdl = { whiteWin: win, draw, blackWin: loss };
        }
      }

      if (msg.score?.type === "cp" && Number.isFinite(msg.score.value)) {
        const cp = msg.score.value;
        const pawns = cp / 100;
        const normalized = isBlackToMove ? -pawns : pawns;
        this.evaluation = normalized;
      }

      if (Array.isArray(msg.pv) && msg.pv.length > 0) {
        this.principalVariation = msg.pv.join(" ");
      }

      this.notifyUpdate(true);
      return;
    }

    if (msg.op === "bestmove") {
      this.bestmove = msg.bestmove ?? "";

      if (this.bestmove && this.principalVariation) {
        const pvMoves = this.principalVariation.trim().split(/\s+/);
        if (pvMoves.length > 0 && pvMoves[0] !== this.bestmove) {
          pvMoves[0] = this.bestmove;
          this.principalVariation = pvMoves.join(" ");
        }
      }

      this.notifyUpdate(false);
      return;
    }

    if (msg.op === "extending") {
      console.log("Analysis extended to depth", msg.depth);
      this.notifyUpdate(true);
      return;
    }

    if (msg.op === "err") {
      console.error("Control WS error:", msg.error);
      return;
    }
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

  private closeSSE(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
