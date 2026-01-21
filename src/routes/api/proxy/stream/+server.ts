import { env } from "$env/dynamic/private";
import WebSocket from "ws";

export const GET = async ({ url }) => {
  const fen = url.searchParams.get("fen");
  const movetime = Number(url.searchParams.get("movetime") ?? "800");
  const id = url.searchParams.get("id") ?? crypto.randomUUID();

  if (!fen) {
    return new Response(JSON.stringify({ error: "fen is required" }), {
      status: 400,
    });
  }

  const wsUrl = env.ENGINE_PROXY_WS_URL;
  if (!wsUrl) {
    return new Response(
      JSON.stringify({ error: "ENGINE_PROXY_WS_URL missing" }),
      { status: 500 },
    );
  }

  let ws: WebSocket | null = null;
  let pingTimer: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      console.log("SSE stream open", { id, movetime });

      const encoder = new TextEncoder();
      let closed = false;

      const sendRaw = (txt: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(txt));
        } catch {
          closed = true;
        }
      };

      const sendEvent = (event: string, data: unknown) => {
        sendRaw(`event: ${event}\n`);
        sendRaw(`data: ${JSON.stringify(data)}\n\n`);
      };

      const closeOnce = () => {
        if (closed) return;
        closed = true;

        try {
          pingTimer && clearInterval(pingTimer);
        } catch {}
        pingTimer = null;

        try {
          controller.close();
        } catch {}
        try {
          ws?.close();
        } catch {}
        ws = null;
      };

      const stopJob = () => {
        // stop uniquement si ws est OPEN
        if (ws && ws.readyState === ws.OPEN) {
          try {
            ws.send(JSON.stringify({ op: "stop", id }));
          } catch {}
        }
      };

      ws = new WebSocket(wsUrl);

      ws.on("open", () => {
        // On lance l'analyse via le proxy
        ws?.send(JSON.stringify({ op: "analyze", id, fen, movetime }));
      });

      ws.on("message", (data: WebSocket.Data) => {
        let msg: { id?: string; op?: string; line?: string; error?: string };
        try {
          msg = JSON.parse(data.toString());
        } catch {
          return;
        }

        // certains messages peuvent ne pas avoir d'id (ex: err générique)
        if (msg.id && msg.id !== id) return;

        if (msg.op === "queued") sendEvent("queued", { id });
        if (msg.op === "info") sendEvent("info", { id, line: msg.line });

        if (msg.op === "bestmove") {
          sendEvent("bestmove", { id, line: msg.line });
          closeOnce();
          return;
        }

        if (msg.op === "err") {
          sendEvent("error", { id, error: msg.error ?? "engine_error" });
          closeOnce();
          return;
        }
      });

      ws.on("error", () => {
        sendEvent("error", { id, error: "proxy_ws_error" });
        closeOnce();
      });

      ws.on("close", () => {
        // IMPORTANT: ne pas appeler stopJob ici (c'est déjà fermé)
        // juste signaler si pas déjà closed
        if (!closed) {
          sendEvent("error", { id, error: "proxy_ws_closed" });
          closeOnce();
        }
      });

      // keep-alive SSE
      pingTimer = setInterval(() => {
        sendRaw(`: ping\n\n`);
      }, 15000);

      // on stocke des callbacks sur l'instance stream via closure
      (globalThis as any).__sseCloseOnce = closeOnce;
      (globalThis as any).__sseStopJob = stopJob;
    },

    cancel() {
      console.log("SSE stream cancel", { id });

      // la fermeture côté client doit stopper le job et fermer sans crash
      try {
        pingTimer && clearInterval(pingTimer);
      } catch {}
      pingTimer = null;

      // stop si possible
      if (ws && ws.readyState === ws.OPEN) {
        try {
          ws.send(JSON.stringify({ op: "stop", id }));
        } catch {}
      }

      try {
        ws?.close();
      } catch {}
      ws = null;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
};
