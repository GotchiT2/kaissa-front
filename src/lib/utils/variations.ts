import { Chess } from 'chess.js';

export interface MoveNode {
  id: string;
  coupUci: string | null;
  ply: number;
  estPrincipal: boolean;
  nagCoup: number | null;
  nagPosition: number | null;
  fen: string | null;
  parentId: string | null;
  commentaires: Array<{
    id: string;
    type: string;
    contenu: string;
  }>;
  enfants: MoveNode[];
}

export interface DisplayMove {
  id: string;
  san: string;
  uci: string;
  ply: number;
  moveNumber: number;
  isWhite: boolean;
  isVariation: boolean;
  depth: number;
  estPrincipal: boolean;
  nagCoup: number | null;
  nagPosition: number | null;
  commentaires: Array<{
    id: string;
    type: string;
    contenu: string;
  }>;
}

export interface DisplayLine {
  type: 'main' | 'variation';
  depth: number;
  moves: DisplayMove[];
}

function convertUciToSan(uci: string, fen: string): string {
  const game = new Chess(fen);
  const move = game.move(uci);
  return move ? move.san : uci;
}

export function buildMoveTree(nodes: MoveNode[]): MoveNode | null {
  if (!nodes || nodes.length === 0) return null;

  const nodeMap = new Map<string, MoveNode>();
  let root: MoveNode | null = null;

  nodes.forEach(node => {
    nodeMap.set(node.id, { ...node, enfants: [] });
  });

  nodes.forEach(node => {
    const currentNode = nodeMap.get(node.id);
    if (!currentNode) return;

    if (node.parentId) {
      const parent = nodeMap.get(node.parentId);
      if (parent) {
        parent.enfants.push(currentNode);
      }
    } else {
      root = currentNode;
    }
  });

  return root;
}

function collectVariationMoves(
  node: MoveNode,
  parentFen: string,
  depth: number,
  moves: DisplayMove[]
): void {
  if (!node.coupUci) return;

  const san = convertUciToSan(node.coupUci, parentFen);
  moves.push({
    id: node.id,
    san,
    uci: node.coupUci,
    ply: node.ply,
    moveNumber: Math.floor(node.ply / 2) + 1,
    isWhite: node.ply % 2 === 1,
    isVariation: true,
    depth,
    estPrincipal: node.estPrincipal,
    nagCoup: node.nagCoup,
    nagPosition: node.nagPosition,
    commentaires: node.commentaires,
  });

  const variations = node.enfants.filter(child => !child.estPrincipal);
  
  if (variations.length > 0) {
    return;
  }

  const nextChild = node.enfants.find(child => !child.estPrincipal) || node.enfants[0];
  if (nextChild) {
    collectVariationMoves(nextChild, node.fen || parentFen, depth, moves);
  }
}

function flattenMovesRecursive(
  node: MoveNode | null,
  result: DisplayLine[],
  currentFen: string,
  depth: number = 0
): void {
  if (!node) return;

  const principalChild = node.enfants.find(child => child.estPrincipal);
  const variations = node.enfants.filter(child => !child.estPrincipal);

  if (principalChild) {
    const currentLine = result[result.length - 1];
    
    if (currentLine && currentLine.type === 'main' && currentLine.depth === depth) {
      if (principalChild.coupUci) {
        const san = convertUciToSan(principalChild.coupUci, node.fen || currentFen);
        currentLine.moves.push({
          id: principalChild.id,
          san,
          uci: principalChild.coupUci,
          ply: principalChild.ply,
          moveNumber: Math.floor(principalChild.ply / 2) + 1,
          isWhite: principalChild.ply % 2 === 1,
          isVariation: false,
          depth,
          estPrincipal: principalChild.estPrincipal,
          nagCoup: principalChild.nagCoup,
          nagPosition: principalChild.nagPosition,
          commentaires: principalChild.commentaires,
        });
      }
    } else {
      const newLine: DisplayLine = {
        type: 'main',
        depth,
        moves: [],
      };
      
      if (principalChild.coupUci) {
        const san = convertUciToSan(principalChild.coupUci, node.fen || currentFen);
        newLine.moves.push({
          id: principalChild.id,
          san,
          uci: principalChild.coupUci,
          ply: principalChild.ply,
          moveNumber: Math.floor(principalChild.ply / 2) + 1,
          isWhite: principalChild.ply % 2 === 1,
          isVariation: false,
          depth,
          estPrincipal: principalChild.estPrincipal,
          nagCoup: principalChild.nagCoup,
          nagPosition: principalChild.nagPosition,
          commentaires: principalChild.commentaires,
        });
      }
      
      result.push(newLine);
    }

    flattenMovesRecursive(principalChild, result, principalChild.fen || currentFen, depth);
  }

  variations.forEach(variation => {
    if (!variation.coupUci) return;

    const variationMoves: DisplayMove[] = [];
    collectVariationMoves(variation, node.fen || currentFen, depth + 1, variationMoves);
    
    if (variationMoves.length > 0) {
      const variationLine: DisplayLine = {
        type: 'variation',
        depth: depth + 1,
        moves: variationMoves,
      };
      
      result.push(variationLine);
    }

    const lastMove = variationMoves[variationMoves.length - 1];
    if (lastMove) {
      let lastNode: MoveNode | null = variation;
      for (let i = 1; i < variationMoves.length; i++) {
        lastNode = lastNode?.enfants[0] || null;
      }
      
      if (lastNode) {
        const subVariations = lastNode.enfants.filter(child => !child.estPrincipal);
        subVariations.forEach(subVar => {
          flattenMovesRecursive(subVar, result, lastNode!.fen || currentFen, depth + 1);
        });
      }
    }
  });
}

export function flattenMoveTree(root: MoveNode | null): DisplayLine[] {
  if (!root) return [];
  
  const result: DisplayLine[] = [];
  const startingFen = root.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  
  // Si le noeud racine n'a pas de coup (position de départ), commencer avec ses enfants
  if (!root.coupUci && root.enfants.length > 0) {
    const principalChild = root.enfants.find(child => child.estPrincipal);
    const variations = root.enfants.filter(child => !child.estPrincipal);
    
    // Créer la première ligne pour la ligne principale et ajouter le premier coup
    if (principalChild) {
      const mainLine: DisplayLine = {
        type: 'main',
        depth: 0,
        moves: [],
      };
      
      // Ajouter le premier coup à la ligne principale
      if (principalChild.coupUci) {
        const san = convertUciToSan(principalChild.coupUci, startingFen);
        mainLine.moves.push({
          id: principalChild.id,
          san,
          uci: principalChild.coupUci,
          ply: principalChild.ply,
          moveNumber: Math.floor(principalChild.ply / 2) + 1,
          isWhite: principalChild.ply % 2 === 1,
          isVariation: false,
          depth: 0,
          estPrincipal: principalChild.estPrincipal,
          nagCoup: principalChild.nagCoup,
          nagPosition: principalChild.nagPosition,
          commentaires: principalChild.commentaires,
        });
      }
      
      result.push(mainLine);
      
      // Continuer avec les enfants du premier coup
      flattenMovesRecursive(principalChild, result, principalChild.fen || startingFen, 0);
    }
    
    // Traiter les variantes de la position de départ
    variations.forEach(variation => {
      if (!variation.coupUci) return;
      
      const variationMoves: DisplayMove[] = [];
      collectVariationMoves(variation, startingFen, 1, variationMoves);
      
      if (variationMoves.length > 0) {
        result.push({
          type: 'variation',
          depth: 1,
          moves: variationMoves,
        });
      }
    });
  } else {
    flattenMovesRecursive(root, result, startingFen, 0);
  }
  
  return result;
}

export function findNodeInTree(root: MoveNode | null, nodeId: string): MoveNode | null {
  if (!root) return null;
  if (root.id === nodeId) return root;
  
  for (const child of root.enfants) {
    const found = findNodeInTree(child, nodeId);
    if (found) return found;
  }
  
  return null;
}

export function buildPathToNode(root: MoveNode | null, targetId: string): MoveNode[] {
  if (!root) return [];
  
  function findPath(node: MoveNode, path: MoveNode[]): MoveNode[] | null {
    path.push(node);
    
    if (node.id === targetId) {
      return path;
    }
    
    for (const child of node.enfants) {
      const result = findPath(child, [...path]);
      if (result) return result;
    }
    
    return null;
  }
  
  return findPath(root, []) || [];
}
