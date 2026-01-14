<script lang="ts">
  let fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  let movetime = 800;

  let lines: string[] = [];
  let bestmove = "";

  let es: EventSource | null = null;

  function start() {
    lines = [];
    bestmove = "";

    const id = crypto.randomUUID();
    const url = `/api/proxy/stream?fen=${encodeURIComponent(fen)}&movetime=${movetime}&id=${id}`;

    es = new EventSource(url);

    es.addEventListener("queued", (e) => {
      // optionnel
    });

    es.addEventListener("info", (e) => {
      const data = JSON.parse((e as MessageEvent).data);
      lines = [...lines, data.line];
    });

    es.addEventListener("bestmove", (e) => {
      const data = JSON.parse((e as MessageEvent).data);
      bestmove = data.line;
      es?.close();
      es = null;
    });

    es.addEventListener("error", () => {
      es?.close();
      es = null;
    });
  }

  function stop() {
    es?.close();
    es = null;
  }
</script>

<button on:click={start}>Analyser</button>
<button disabled={!es} on:click={stop}>Stop</button>

<p>Bestmove: {bestmove}</p>
<pre>{lines.join("\n")}</pre>
