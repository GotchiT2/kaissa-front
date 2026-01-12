import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE } from "../../src/routes/api/parties/[id]/+server";
import { prisma } from "$lib/server/db";

vi.mock("$lib/server/db", () => ({
  prisma: {
    partieTravail: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("DELETE /api/parties/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devrait supprimer une partie avec succès", async () => {
    const mockPartie = {
      id: "partie_123",
      collectionId: "col_123",
      titre: "Test Game",
      collection: {
        proprietaireId: "user_123",
      },
    };

    vi.mocked(prisma.partieTravail.findUnique).mockResolvedValue(mockPartie as any);
    vi.mocked(prisma.partieTravail.delete).mockResolvedValue(mockPartie as any);

    const request = new Request("http://localhost/api/parties/partie_123", {
      method: "DELETE",
    });

    const locals = {
      user: { id: "user_123", email: "test@example.com" },
    };

    const params = { id: "partie_123" };

    const response = await DELETE({ request, locals, params } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      message: "Partie supprimée avec succès",
    });

    expect(prisma.partieTravail.findUnique).toHaveBeenCalledWith({
      where: { id: "partie_123" },
      include: {
        collection: {
          select: {
            proprietaireId: true,
          },
        },
      },
    });

    expect(prisma.partieTravail.delete).toHaveBeenCalledWith({
      where: { id: "partie_123" },
    });
  });

  it("devrait rejeter si l'utilisateur n'est pas authentifié", async () => {
    const request = new Request("http://localhost/api/parties/partie_123", {
      method: "DELETE",
    });

    const locals = { user: null };
    const params = { id: "partie_123" };

    await expect(DELETE({ request, locals, params } as any)).rejects.toThrow();
  });

  it("devrait rejeter si l'ID de la partie est manquant", async () => {
    const request = new Request("http://localhost/api/parties/", {
      method: "DELETE",
    });

    const locals = {
      user: { id: "user_123", email: "test@example.com" },
    };

    const params = { id: undefined };

    await expect(DELETE({ request, locals, params } as any)).rejects.toThrow();
  });

  it("devrait rejeter si la partie n'existe pas", async () => {
    vi.mocked(prisma.partieTravail.findUnique).mockResolvedValue(null);

    const request = new Request("http://localhost/api/parties/partie_123", {
      method: "DELETE",
    });

    const locals = {
      user: { id: "user_123", email: "test@example.com" },
    };

    const params = { id: "partie_123" };

    await expect(DELETE({ request, locals, params } as any)).rejects.toThrow();
  });

  it("devrait rejeter si l'utilisateur n'est pas propriétaire de la collection", async () => {
    const mockPartie = {
      id: "partie_123",
      collectionId: "col_123",
      titre: "Test Game",
      collection: {
        proprietaireId: "other_user",
      },
    };

    vi.mocked(prisma.partieTravail.findUnique).mockResolvedValue(mockPartie as any);

    const request = new Request("http://localhost/api/parties/partie_123", {
      method: "DELETE",
    });

    const locals = {
      user: { id: "user_123", email: "test@example.com" },
    };

    const params = { id: "partie_123" };

    await expect(DELETE({ request, locals, params } as any)).rejects.toThrow();
  });

  it("devrait gérer les erreurs de base de données", async () => {
    const mockPartie = {
      id: "partie_123",
      collectionId: "col_123",
      titre: "Test Game",
      collection: {
        proprietaireId: "user_123",
      },
    };

    vi.mocked(prisma.partieTravail.findUnique).mockResolvedValue(mockPartie as any);
    vi.mocked(prisma.partieTravail.delete).mockRejectedValue(new Error("Database error"));

    const request = new Request("http://localhost/api/parties/partie_123", {
      method: "DELETE",
    });

    const locals = {
      user: { id: "user_123", email: "test@example.com" },
    };

    const params = { id: "partie_123" };

    await expect(DELETE({ request, locals, params } as any)).rejects.toThrow();
  });
});
