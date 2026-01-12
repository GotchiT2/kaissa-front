export function hashFEN(fen: string): bigint {
  let hash = 5381n;
  const MAX_BIGINT = 9223372036854775807n;
  
  for (let i = 0; i < fen.length; i++) {
    const char = BigInt(fen.charCodeAt(i));
    hash = ((hash << 5n) + hash) + char;
    hash = hash % MAX_BIGINT;
  }
  
  return hash;
}
