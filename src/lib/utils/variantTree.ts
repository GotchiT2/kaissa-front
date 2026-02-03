import { Chess } from "chess.js";

export interface VariantNode {
  id: string;
  coupUci: string | null;
  ply: number;
  fen: string | null;
  estPrincipal: boolean;
  ordre: number;
  parentId: string | null;
  san?: string;
  children: VariantNode[];
}

export interface FlatVariantNode extends VariantNode {
  level: number;
}

export interface FlatMoveNode extends VariantNode {
  isVariant: boolean;
  variantDepth: number;
  variantId: string | null;
}

export function buildVariantTree(coups: any[]): VariantNode[] {
  const nodesById = new Map<string, VariantNode>();

  // Créer tous les nœuds
  for (const coup of coups) {
    nodesById.set(coup.id, {
      id: coup.id,
      coupUci: coup.coupUci,
      ply: coup.ply,
      fen: coup.fen,
      estPrincipal: coup.estPrincipal,
      ordre: coup.ordre,
      parentId: coup.parentId,
      children: [],
    });
  }

  // Construire l'arbre
  const roots: VariantNode[] = [];

  for (const coup of coups) {
    const node = nodesById.get(coup.id)!;

    if (!coup.parentId) {
      roots.push(node);
    } else {
      const parent = nodesById.get(coup.parentId);
      if (parent) {
        parent.children.push(node);
      }
    }
  }

  // Trier les enfants par ordre
  for (const node of nodesById.values()) {
    node.children.sort((a, b) => {
      if (a.estPrincipal !== b.estPrincipal) {
        return a.estPrincipal ? -1 : 1;
      }
      return a.ordre - b.ordre;
    });
  }

  function addSanToNode(node: VariantNode, parentFen: string | null) {
    if (node.coupUci && parentFen) {
      try {
        const game = new Chess(parentFen);
        const move = game.move(node.coupUci);
        node.san = move ? move.san : node.coupUci;
      } catch (error) {
        node.san = node.coupUci;
      }
    } else {
      node.san = node.coupUci || "...";
    }

    for (const child of node.children) {
      addSanToNode(child, node.fen);
    }
  }

  for (const root of roots) {
    const parentCoup = coups.find((c) => c.id === root.id);
    const parentFen = parentCoup?.parentId
      ? nodesById.get(parentCoup.parentId)?.fen || null
      : "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    addSanToNode(root, parentFen);
  }

  return roots;
}

export function flattenVariantTree(
  tree: VariantNode[],
  level: number = 0,
): FlatVariantNode[] {
  const result: FlatVariantNode[] = [];

  for (const node of tree) {
    result.push({
      ...node,
      level,
    });

    if (node.children.length > 0) {
      result.push(...flattenVariantTree(node.children, level + 1));
    }
  }

  return result;
}

export function convertUciToSan(
  node: VariantNode,
  previousFen: string | null,
): string {
  if (!node.coupUci || !previousFen) {
    return "...";
  }

  try {
    const game = new Chess(previousFen);
    const move = game.move(node.coupUci);
    return move ? move.san : node.coupUci;
  } catch (error) {
    console.error("Error converting UCI to SAN:", error);
    return node.coupUci;
  }
}

export function getMainLine(tree: VariantNode[]): VariantNode[] {
  const mainLine: VariantNode[] = [];
  let current = tree.find((n) => n.estPrincipal);

  while (current) {
    mainLine.push(current);
    current = current.children.find((n) => n.estPrincipal);
  }

  return mainLine;
}

export function flattenTreeWithVariants(tree: VariantNode[]): FlatMoveNode[] {
  const result: FlatMoveNode[] = [];

  function processNode(node: VariantNode, isVariant: boolean, variantDepth: number, variantId: string | null) {
    result.push({
      ...node,
      isVariant,
      variantDepth,
      variantId,
    });

    const mainChild = node.children.find(c => c.estPrincipal);
    const variants = node.children.filter(c => !c.estPrincipal);

    for (const variant of variants) {
      processVariantLine(variant, variantDepth + 1, variant.id);
    }

    if (mainChild) {
      processNode(mainChild, false, 0, null);
    }
  }

  function processVariantLine(node: VariantNode, depth: number, variantId: string) {
    result.push({
      ...node,
      isVariant: true,
      variantDepth: depth,
      variantId,
    });

    if (node.children.length > 0) {
      const mainChild = node.children.find(c => c.estPrincipal) || node.children[0];
      const subVariants = node.children.filter(c => c !== mainChild);
      
      for (const subVariant of subVariants) {
        processVariantLine(subVariant, depth + 1, subVariant.id);
      }
      
      if (mainChild) {
        processVariantLine(mainChild, depth, variantId);
      }
    }
  }

  const mainRoot = tree.find(n => n.estPrincipal) || tree[0];
  if (mainRoot) {
    processNode(mainRoot, false, 0, null);
  }

  return result;
}

export function findNodeById(
  tree: VariantNode[],
  id: string,
): VariantNode | null {
  for (const node of tree) {
    if (node.id === id) {
      return node;
    }

    const found = findNodeById(node.children, id);
    if (found) {
      return found;
    }
  }

  return null;
}
