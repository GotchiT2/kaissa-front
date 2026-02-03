import { prisma } from "$lib/server/db";
import type { CoupNoeud } from "@prisma/client";

export interface VariantNode {
  id: string;
  coupUci: string | null;
  ply: number;
  hashPosition: bigint;
  fen: string | null;
  estPrincipal: boolean;
  ordre: number;
  enfants: VariantNode[];
}

export interface CreateMoveParams {
  partieId: string;
  parentId: string | null;
  coupUci: string;
  fen: string;
  hashPosition: bigint;
  ply: number;
}

export class VariantService {
  async getContinuations(parentId: string | null, partieId: string): Promise<CoupNoeud[]> {
    return prisma.coupNoeud.findMany({
      where: {
        partieId,
        parentId,
      },
      orderBy: [
        { estPrincipal: "desc" },
        { ordre: "asc" },
      ],
      include: {
        enfants: true,
      },
    });
  }

  async findExistingMove(
    parentId: string | null,
    partieId: string,
    coupUci: string
  ): Promise<CoupNoeud | null> {
    return prisma.coupNoeud.findFirst({
      where: {
        partieId,
        parentId,
        coupUci,
      },
    });
  }

  async createMove(params: CreateMoveParams): Promise<CoupNoeud> {
    const { partieId, parentId, coupUci, fen, hashPosition, ply } = params;

    const existingMove = await this.findExistingMove(parentId, partieId, coupUci);
    if (existingMove) {
      return existingMove;
    }

    const continuations = await this.getContinuations(parentId, partieId);

    const isMainVariant = continuations.length === 0;
    const ordre = continuations.length;

    return prisma.coupNoeud.create({
      data: {
        partieId,
        parentId,
        coupUci,
        fen,
        hashPosition,
        ply,
        estPrincipal: isMainVariant,
        ordre,
      },
    });
  }

  async promoteVariant(nodeId: string): Promise<void> {
    const node = await prisma.coupNoeud.findUnique({
      where: { id: nodeId },
      include: { parent: true },
    });

    if (!node) {
      throw new Error("Coup introuvable");
    }

    const siblings = await this.getContinuations(node.parentId, node.partieId);
    
    await prisma.$transaction(async (tx) => {
      for (const sibling of siblings) {
        if (sibling.id === nodeId) {
          await tx.coupNoeud.update({
            where: { id: sibling.id },
            data: { estPrincipal: true, ordre: 0 },
          });
        } else if (sibling.estPrincipal) {
          await tx.coupNoeud.update({
            where: { id: sibling.id },
            data: { estPrincipal: false, ordre: 1 },
          });
        } else {
          await tx.coupNoeud.update({
            where: { id: sibling.id },
            data: { ordre: sibling.ordre + 1 },
          });
        }
      }
    });
  }

  async reorderVariants(parentId: string | null, partieId: string, newOrder: string[]): Promise<void> {
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < newOrder.length; i++) {
        const nodeId = newOrder[i];
        await tx.coupNoeud.update({
          where: { id: nodeId },
          data: { 
            ordre: i,
            estPrincipal: i === 0,
          },
        });
      }
    });
  }

  async getVariantTree(partieId: string, rootId: string | null = null): Promise<VariantNode[]> {
    const nodes = await prisma.coupNoeud.findMany({
      where: {
        partieId,
        parentId: rootId,
      },
      orderBy: [
        { estPrincipal: "desc" },
        { ordre: "asc" },
      ],
    });

    const tree: VariantNode[] = [];

    for (const node of nodes) {
      const enfants = await this.getVariantTree(partieId, node.id);
      tree.push({
        id: node.id,
        coupUci: node.coupUci,
        ply: node.ply,
        hashPosition: node.hashPosition,
        fen: node.fen,
        estPrincipal: node.estPrincipal,
        ordre: node.ordre,
        enfants,
      });
    }

    return tree;
  }
}

export const variantService = new VariantService();
