import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCollection,
  getCollectionById,
  getUserCollections,
} from "$lib/server/services/collection.service";
import { prisma } from "$lib/server/db";

vi.mock("$lib/server/db", () => ({
  prisma: {
    collection: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    collectionClosure: {
      create: vi.fn(),
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
  },
}));

describe("Collection Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createCollection", () => {
    it("devrait créer une collection racine avec la closure table", async () => {
      const mockCollection = {
        id: "col_123",
        nom: "Test Collection",
        proprietaireId: "user_123",
        parentId: null,
        visibilite: "PRIVEE",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.collection.create).mockResolvedValue(mockCollection);
      vi.mocked(prisma.collectionClosure.create).mockResolvedValue({
        ancetreId: "col_123",
        descendantId: "col_123",
        profondeur: 0,
      });

      const result = await createCollection({
        nom: "Test Collection",
        proprietaireId: "user_123",
      });

      expect(prisma.collection.create).toHaveBeenCalledWith({
        data: {
          nom: "Test Collection",
          proprietaireId: "user_123",
          parentId: undefined,
          visibilite: "PRIVEE",
        },
      });

      expect(prisma.collectionClosure.create).toHaveBeenCalledWith({
        data: {
          ancetreId: "col_123",
          descendantId: "col_123",
          profondeur: 0,
        },
      });

      expect(result).toEqual(mockCollection);
    });

    it("devrait créer une collection enfant avec les entrées de closure appropriées", async () => {
      const mockCollection = {
        id: "col_child",
        nom: "Child Collection",
        proprietaireId: "user_123",
        parentId: "col_parent",
        visibilite: "PRIVEE",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockParentClosures = [
        { ancetreId: "col_parent", descendantId: "col_parent", profondeur: 0 },
        {
          ancetreId: "col_grandparent",
          descendantId: "col_parent",
          profondeur: 1,
        },
      ];

      vi.mocked(prisma.collection.create).mockResolvedValue(mockCollection);
      vi.mocked(prisma.collectionClosure.create).mockResolvedValue({
        ancetreId: "col_child",
        descendantId: "col_child",
        profondeur: 0,
      });
      vi.mocked(prisma.collectionClosure.findMany).mockResolvedValue(
        mockParentClosures,
      );
      vi.mocked(prisma.collectionClosure.createMany).mockResolvedValue({
        count: 2,
      });

      const result = await createCollection({
        nom: "Child Collection",
        proprietaireId: "user_123",
        parentId: "col_parent",
      });

      expect(prisma.collectionClosure.findMany).toHaveBeenCalledWith({
        where: { descendantId: "col_parent" },
      });

      expect(prisma.collectionClosure.createMany).toHaveBeenCalledWith({
        data: [
          { ancetreId: "col_parent", descendantId: "col_child", profondeur: 1 },
          {
            ancetreId: "col_grandparent",
            descendantId: "col_child",
            profondeur: 2,
          },
        ],
      });

      expect(result).toEqual(mockCollection);
    });
  });

  describe("getUserCollections", () => {
    it("devrait retourner les collections d'un utilisateur avec le nombre de parties", async () => {
      const mockCollections = [
        {
          id: "col_1",
          nom: "Collection 1",
          proprietaireId: "user_123",
          _count: { parties: 5 },
        },
        {
          id: "col_2",
          nom: "Collection 2",
          proprietaireId: "user_123",
          _count: { parties: 3 },
        },
      ];

      vi.mocked(prisma.collection.findMany).mockResolvedValue(mockCollections);

      const result = await getUserCollections("user_123");

      expect(prisma.collection.findMany).toHaveBeenCalledWith({
        where: { proprietaireId: "user_123" },
        include: {
          _count: { select: { parties: true } },
        },
        orderBy: { updatedAt: "desc" },
      });

      expect(result).toEqual(mockCollections);
    });
  });

  describe("getCollectionById", () => {
    it("devrait retourner une collection spécifique avec ses parties", async () => {
      const mockCollection = {
        id: "col_123",
        nom: "Test Collection",
        proprietaireId: "user_123",
        parties: [],
        _count: { parties: 0 },
      };

      vi.mocked(prisma.collection.findFirst).mockResolvedValue(mockCollection);

      const result = await getCollectionById("col_123", "user_123");

      expect(prisma.collection.findFirst).toHaveBeenCalledWith({
        where: {
          id: "col_123",
          proprietaireId: "user_123",
        },
        include: {
          parties: true,
          _count: { select: { parties: true } },
        },
      });

      expect(result).toEqual(mockCollection);
    });

    it("devrait retourner null si la collection n'appartient pas à l'utilisateur", async () => {
      vi.mocked(prisma.collection.findFirst).mockResolvedValue(null);

      const result = await getCollectionById("col_123", "wrong_user");

      expect(result).toBeNull();
    });
  });
});
