export interface MoveNode {
  id: string;
  coupUci: string | null;
  ply: number;
  fen: string | null;
  estPrincipal: boolean;
  ordre: number;
  parentId: string | null;
}

export interface CreateMoveRequest {
  parentId: string | null;
  coupUci: string;
  fen: string;
  ply: number;
}

export async function createMove(
  partieId: string,
  request: CreateMoveRequest
): Promise<MoveNode> {
  const response = await fetch(`/api/parties/${partieId}/moves`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la création du coup");
  }

  const data = await response.json();
  return data.move;
}

export async function getContinuations(
  partieId: string,
  parentId: string | null
): Promise<MoveNode[]> {
  const url = parentId
    ? `/api/parties/${partieId}/moves?parentId=${parentId}`
    : `/api/parties/${partieId}/moves`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des continuations");
  }

  const data = await response.json();
  return data.continuations;
}

export async function promoteVariant(
  partieId: string,
  moveId: string
): Promise<void> {
  const response = await fetch(`/api/parties/${partieId}/moves/${moveId}/promote`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la promotion de la variante");
  }
}
