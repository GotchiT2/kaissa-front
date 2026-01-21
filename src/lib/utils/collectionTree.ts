import type { CollectionWithGames } from "$lib/types/chess.types";

export interface CollectionNode {
  id: string;
  nom: string;
  partiesCount: number;
  collection: CollectionWithGames;
  children?: CollectionNode[];
}

export function buildCollectionTree(collections: CollectionWithGames[]): CollectionNode[] {
  const collectionMap = new Map<string, CollectionNode>();
  const rootNodes: CollectionNode[] = [];

  collections.forEach(collection => {
    collectionMap.set(collection.id, {
      id: collection.id,
      nom: collection.nom,
      partiesCount: collection.parties.length || 0,
      collection,
      children: []
    });
  });

  collections.forEach(collection => {
    const node = collectionMap.get(collection.id)!;
    if (collection.parentId) {
      const parent = collectionMap.get(collection.parentId);
      if (parent) {
        parent.children!.push(node);
      } else {
        rootNodes.push(node);
      }
    } else {
      rootNodes.push(node);
    }
  });

  return rootNodes;
}

export function countSubCollections(node: CollectionNode): number {
  if (!node.children || node.children.length === 0) return 0;
  
  let count = node.children.length;
  for (const child of node.children) {
    count += countSubCollections(child);
  }
  return count;
}

export function countTotalPartiesInCollection(node: CollectionNode): number {
  let total = node.partiesCount;
  if (node.children) {
    for (const child of node.children) {
      total += countTotalPartiesInCollection(child);
    }
  }
  return total;
}

export function findCollectionNode(nodes: CollectionNode[], collectionId: string): CollectionNode | null {
  for (const node of nodes) {
    if (node.id === collectionId) return node;
    if (node.children) {
      const found = findCollectionNode(node.children, collectionId);
      if (found) return found;
    }
  }
  return null;
}
