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

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const sendEvent = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const ws = new WebSocket(wsUrl);

      const stop = () => {
        try {
          ws.send(JSON.stringify({ op: "stop", id }));
        } catch {}
      };

      ws.on("open", () => {
        // lance l'analyse via le proxy
        ws.send(JSON.stringify({ op: "analyze", id, fen, movetime }));
        sendEvent("queued", { id });
      });

      ws.on("message", (data) => {
        let msg: any;
        try {
          msg = JSON.parse(data.toString());
        } catch {
          return;
        }
        if (msg.id && msg.id !== id) return; // ignore autres jobs

        if (msg.op === "info") sendEvent("info", { id, line: msg.line });
        if (msg.op === "bestmove") {
          sendEvent("bestmove", { id, line: msg.line });
          ws.close();
          controller.close();
        }
        if (msg.op === "err") {
          sendEvent("error", { id, error: msg.error ?? "engine_error" });
          ws.close();
          controller.close();
        }
      });

      ws.on("error", () => {
        sendEvent("error", { id, error: "proxy_ws_error" });
        controller.close();
      });

      ws.on("close", () => {
        // si le client ferme le stream, on stoppe
        stop();
      });

      // Si le navigateur ferme le stream (abort)
      // SvelteKit appelle cancel() -> on stoppe le job
      (this as any).cancel = () => {
        stop();
        try {
          ws.close();
        } catch {}
      };
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
