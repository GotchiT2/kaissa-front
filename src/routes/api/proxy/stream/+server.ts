import { env } from "$env/dynamic/private";
import WebSocket from "ws";

export const GET = async ({ url }) => {
  const id = url.searchParams.get("id") ?? crypto.randomUUID();
  const mode = url.searchParams.get("mode") ?? "start"; // start or subscribe

  if (!id) {
    return new Response(JSON.stringify({ error: "id is required" }), {
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
      console.log("SSE stream open", { id, mode });

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
          if (pingTimer) clearInterval(pingTimer);
        } catch {
          // Ignore cleanup errors
        }
        pingTimer = null;

        try {
          controller.close();
        } catch {
          // Ignore close errors
        }
        try {
          ws?.close();
        } catch {
          // Ignore close errors
        }
        ws = null;
      };

      ws = new WebSocket(wsUrl);

      ws.on("open", () => {
        // Mode subscribe: on se branche juste sur une session existante
        if (mode === "subscribe") {
          ws?.send(JSON.stringify({ op: "subscribe", id }));
        }
        // Mode start: l'analyse sera démarrée par le control WS côté client
      });

      ws.on("message", (data: WebSocket.Data) => {
        let msg;
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
          // Ne pas fermer le stream automatiquement en mode subscribe
          // pour permettre extend sans ré-ouvrir
          if (mode !== "subscribe") {
            closeOnce();
          }
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
        if (pingTimer) clearInterval(pingTimer);
      } catch {
        // Ignore cleanup errors
      }
      pingTimer = null;

      // stop si possible
      if (ws && ws.readyState === ws.OPEN) {
        try {
          ws.send(JSON.stringify({ op: "stop", id }));
        } catch {
          // Ignore send errors
        }
      }

      try {
        ws?.close();
      } catch {
        // Ignore close errors
      }
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
