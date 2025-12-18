// import { writable } from "svelte/store";
//
// export const evaluation = writable<number[] | null>(null);
//
// let socket: WebSocket | null = null;
// let socketReady: Promise<void> | null = null;
//
// export function connectChessApi() {
//   if (socket) return socketReady;
//
//   socket = new WebSocket("wss://chess-api.com/v1/ws");
//
//   socketReady = new Promise((resolve) => {
//     socket!.onopen = () => {
//       console.log("Chess API connected");
//       resolve();
//     };
//   });
//
//   socket.onmessage = (event) => {
//     const data = JSON.parse(event.data);
//
//     console.log("Chess API message received:", data);
//
//     if (data.type === "evaluation") {
//       evaluation.set(data.evaluation);
//     }
//   };
//
//   socket.onerror = (err) => {
//     console.error("Chess API WS error", err);
//   };
//
//   return socketReady;
// }
//
// export async function evaluateFen(fen: string) {
//   if (!socketReady) {
//     console.warn("WebSocket not initialized");
//     return;
//   }
//
//   console.log("Waiting socketReady:");
//
//   await socketReady;
//
//   console.log("Evaluating FEN:", fen);
//
//   socket!.send(
//     JSON.stringify({
//       type: "evaluate",
//       fen,
//     }),
//   );
//
//   console.log("FEN sent to Chess API");
// }
