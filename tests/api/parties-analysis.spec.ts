import { beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "../../src/routes/api/parties/[id]/+server";
import { prisma } from "$lib/server/db";

vi.mock("$lib/server/db", () => ({
  prisma: {
    partieTravail: {
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe("PATCH /api/parties/[id] - Gestion de l'analyse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devrait ajouter une partie à l'analyse avec succès", async () => {
    const mockPartie = {
      id: "partie_123",
      collectionId: "col_123",
      titre: "Test Game",
      isInAnalysis: false,
      collection: {
        proprietaireId: "user_123",
      },
    };

    const mockUpdatedPartie = {
      ...mockPartie,
      isInAnalysis: true,
    };

    vi.mocked(prisma.partieTravail.findUnique).mockResolvedValue(mockPartie as any);
    vi.mocked(prisma.partieTravail.count).mockResolvedValue(2);
    vi.mocked(prisma.partieTravail.update).mockResolvedValue(mockUpdatedPartie as any);

    const request = new Request("http://localhost/api/parties/partie_123", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isInAnalysis: true }),
    });

    const locals = {
      user: { id: "user_123", email: "test@example.com" },
    };

    const params = { id: "partie_123" };

    const response = await PATCH({ request, locals, params } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      message: "Partie ajoutée à l'analyse",
      partie: mockUpdatedPartie,
    });

    expect(prisma.partieTravail.count).toHaveBeenCalledWith({
      where: {
        collection: {
          proprietaireId: "user_123",
        },
        isInAnalysis: true,
      },
    });

    expect(prisma.partieTravail.update).toHaveBeenCalledWith({
      where: { id: "partie_123" },
      data: { isInAnalysis: true },
    });
  });

  it("devrait retirer une partie de l'analyse avec succès", async () => {
    const mockPartie = {
      id: "partie_123",
      collectionId: "col_123",
      titre: "Test Game",
      isInAnalysis: true,
      collection: {
        proprietaireId: "user_123",
      },
    };

    const mockUpdatedPartie = {
      ...mockPartie,
      isInAnalysis: false,
    };

    vi.mocked(prisma.partieTravail.findUnique).mockResolvedValue(mockPartie as any);
    vi.mocked(prisma.partieTravail.update).mockResolvedValue(mockUpdatedPartie as any);

    const request = new Request("http://localhost/api/parties/partie_123", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isInAnalysis: false }),
    });

    const locals = {
      user: { id: "user_123", email: "test@example.com" },
    };

    const params = { id: "partie_123" };

    const response = await PATCH({ request, locals, params } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      message: "Partie retirée de l'analyse",
      partie: mockUpdatedPartie,
    });

    expect(prisma.partieTravail.count).not.toHaveBeenCalled();
    expect(prisma.partieTravail.update).toHaveBeenCalledWith({
      where: { id: "partie_123" },
      data: { isInAnalysis: false },
    });
  });

  it("devrait rejeter l'ajout si la limite de 5 parties est atteinte", async () => {
    const mockPartie = {
      id: "partie_123",
      collectionId: "col_123",
      titre: "Test Game",
      isInAnalysis: false,
      collection: {
        proprietaireId: "user_123",
      },
    };

    vi.mocked(prisma.partieTravail.findUnique).mockResolvedValue(mockPartie as any);
    vi.mocked(prisma.partieTravail.count).mockResolvedValue(5);

    const request = new Request("http://localhost/api/parties/partie_123", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isInAnalysis: true }),
    });

    const locals = {
      user: { id: "user_123", email: "test@example.com" },
    };

    const params = { id: "partie_123" };

    await expect(PATCH({ request, locals, params } as any)).rejects.toThrow();

    expect(prisma.partieTravail.count).toHaveBeenCalled();
    expect(prisma.partieTravail.update).not.toHaveBeenCalled();
  });

  it("devrait rejeter si l'utilisateur n'est pas authentifié", async () => {
    const request = new Request("http://localhost/api/parties/partie_123", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isInAnalysis: true }),
    });

    const locals = { user: null };
    const params = { id: "partie_123" };

    await expect(PATCH({ request, locals, params } as any)).rejects.toThrow();
  });

  it("devrait rejeter si l'ID de la partie est manquant", async () => {
    const request = new Request("http://localhost/api/parties/", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isInAnalysis: true }),
    });

    const locals = {
      user: { id: "user_123", email: "test@example.com" },
    };

    const params = { id: undefined };

    await expect(PATCH({ request, locals, params } as any)).rejects.toThrow();
  });

  it("devrait rejeter si isInAnalysis n'est pas un booléen", async () => {
    const request = new Request("http://localhost/api/parties/partie_123", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isInAnalysis: "true" }),
    });

    const locals = {
      user: { id: "user_123", email: "test@example.com" },
    };

    const params = { id: "partie_123" };

    await expect(PATCH({ request, locals, params } as any)).rejects.toThrow();
  });

  it("devrait rejeter si la partie n'existe pas", async () => {
    vi.mocked(prisma.partieTravail.findUnique).mockResolvedValue(null);

    const request = new Request("http://localhost/api/parties/partie_123", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isInAnalysis: true }),
    });

    const locals = {
      user: { id: "user_123", email: "test@example.com" },
    };

    const params = { id: "partie_123" };

    await expect(PATCH({ request, locals, params } as any)).rejects.toThrow();
  });

  it("devrait rejeter si l'utilisateur n'est pas propriétaire de la collection", async () => {
    const mockPartie = {
      id: "partie_123",
      collectionId: "col_123",
      titre: "Test Game",
      isInAnalysis: false,
      collection: {
        proprietaireId: "other_user",
      },
    };

    vi.mocked(prisma.partieTravail.findUnique).mockResolvedValue(mockPartie as any);

    const request = new Request("http://localhost/api/parties/partie_123", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isInAnalysis: true }),
    });

    const locals = {
      user: { id: "user_123", email: "test@example.com" },
    };

    const params = { id: "partie_123" };

    await expect(PATCH({ request, locals, params } as any)).rejects.toThrow();
  });

  it("devrait gérer les erreurs de base de données", async () => {
    const mockPartie = {
      id: "partie_123",
      collectionId: "col_123",
      titre: "Test Game",
      isInAnalysis: false,
      collection: {
        proprietaireId: "user_123",
      },
    };

    vi.mocked(prisma.partieTravail.findUnique).mockResolvedValue(mockPartie as any);
    vi.mocked(prisma.partieTravail.count).mockResolvedValue(2);
    vi.mocked(prisma.partieTravail.update).mockRejectedValue(new Error("Database error"));

    const request = new Request("http://localhost/api/parties/partie_123", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isInAnalysis: true }),
    });

    const locals = {
      user: { id: "user_123", email: "test@example.com" },
    };

    const params = { id: "partie_123" };

    await expect(PATCH({ request, locals, params } as any)).rejects.toThrow();
  });
});
