import { env } from "$env/dynamic/private";
import WebSocket from "ws";

export const GET = async ({ url }) => {
  const fen = url.searchParams.get("fen");
  const movetime = Number(url.searchParams.get("movetime") ?? "800");
  const id = url.searchParams.get("id") ?? crypto.randomUUID();
  const multipv = Number(url.searchParams.get("multipv") ?? "1");

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
      console.log("SSE stream open", { id, movetime, multipv });

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

      ws = new WebSocket(wsUrl);

      ws.on("open", () => {
        // On lance l'analyse via le proxy
        ws?.send(JSON.stringify({ op: "analyze", id, fen, movetime, multipv }));
      });

      ws.on("message", (data: WebSocket.Data) => {
        let msg: any;
        try {
          msg = JSON.parse(data.toString());
        } catch {
          return;
        }

        // filtre par id si présent
        if (msg.id && msg.id !== id) return;

        if (msg.op === "queued") {
          sendEvent("queued", msg);
          return;
        }

        if (msg.op === "info") {
          // payload complet: depth/score/pv/wdl etc.
          sendEvent("info", msg);
          return;
        }

        if (msg.op === "status") {
          sendEvent("status", msg);
          return;
        }

        if (msg.op === "bestmove") {
          sendEvent("bestmove", msg);
          closeOnce();
          return;
        }

        if (msg.op === "err") {
          sendEvent("error", msg);
          closeOnce();
          return;
        }
      });

      ws.on("error", () => {
        sendEvent("error", { id, error: "proxy_ws_error" });
        closeOnce();
      });

      ws.on("close", () => {
        if (!closed) {
          sendEvent("error", { id, error: "proxy_ws_closed" });
          closeOnce();
        }
      });

      // keep-alive SSE
      pingTimer = setInterval(() => {
        sendRaw(`: ping\n\n`);
      }, 15000);
    },

    cancel() {
      console.log("SSE stream cancel", { id });

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
