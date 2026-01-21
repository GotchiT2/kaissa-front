import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "../../src/routes/api/collections/+server";
import { createCollection } from "$lib/server/services/collection.service";

vi.mock("$lib/server/services/collection.service", () => ({
  createCollection: vi.fn(),
}));

describe("POST /api/collections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devrait créer une collection avec succès", async () => {
    const mockCollection = {
      id: "col_123",
      nom: "Ma Collection",
      proprietaireId: "user_123",
      parentId: null,
      visibilite: "PRIVEE",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(createCollection).mockResolvedValue(mockCollection);

    const request = new Request("http://localhost/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: "Ma Collection" }),
    });

    const locals = {
      user: { id: "user_123", email: "test@example.com" },
    };

    const response = await POST({ request, locals } as any);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.collection).toMatchObject({
      id: "col_123",
      nom: "Ma Collection",
      proprietaireId: "user_123",
      parentId: null,
      visibilite: "PRIVEE",
    });

    expect(createCollection).toHaveBeenCalledWith({
      nom: "Ma Collection",
      proprietaireId: "user_123",
      parentId: undefined,
    });
  });

  it("devrait créer une sous-collection avec parentId", async () => {
    const mockCollection = {
      id: "col_child",
      nom: "Sous-collection",
      proprietaireId: "user_123",
      parentId: "col_parent",
      visibilite: "PRIVEE",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(createCollection).mockResolvedValue(mockCollection);

    const request = new Request("http://localhost/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: "Sous-collection", parentId: "col_parent" }),
    });

    const locals = {
      user: { id: "user_123", email: "test@example.com" },
    };

    const response = await POST({ request, locals } as any);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.collection).toMatchObject({
      id: "col_child",
      nom: "Sous-collection",
      proprietaireId: "user_123",
      parentId: "col_parent",
      visibilite: "PRIVEE",
    });

    expect(createCollection).toHaveBeenCalledWith({
      nom: "Sous-collection",
      proprietaireId: "user_123",
      parentId: "col_parent",
    });
  });

  it("devrait trim le nom de la collection", async () => {
    const mockCollection = {
      id: "col_123",
      nom: "Ma Collection",
      proprietaireId: "user_123",
      parentId: null,
      visibilite: "PRIVEE",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(createCollection).mockResolvedValue(mockCollection);

    const request = new Request("http://localhost/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: "  Ma Collection  " }),
    });

    const locals = {
      user: { id: "user_123", email: "test@example.com" },
    };

    await POST({ request, locals } as any);

    expect(createCollection).toHaveBeenCalledWith({
      nom: "Ma Collection",
      proprietaireId: "user_123",
      parentId: undefined,
    });
  });

  it("devrait rejeter la requête si l'utilisateur n'est pas authentifié", async () => {
    const request = new Request("http://localhost/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: "Ma Collection" }),
    });

    const locals = { user: null };

    await expect(POST({ request, locals } as any)).rejects.toThrow();
  });

  it("devrait rejeter si le nom est manquant", async () => {
    const request = new Request("http://localhost/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const locals = {
      user: { id: "user_123", email: "test@example.com" },
    };

    await expect(POST({ request, locals } as any)).rejects.toThrow();
  });

  it("devrait rejeter si le nom est vide après trim", async () => {
    const request = new Request("http://localhost/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: "   " }),
    });

    const locals = {
      user: { id: "user_123", email: "test@example.com" },
    };

    await expect(POST({ request, locals } as any)).rejects.toThrow();
  });

  it("devrait rejeter si le nom dépasse 100 caractères", async () => {
    const longName = "a".repeat(101);

    const request = new Request("http://localhost/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: longName }),
    });

    const locals = {
      user: { id: "user_123", email: "test@example.com" },
    };

    await expect(POST({ request, locals } as any)).rejects.toThrow();
  });

  it("devrait rejeter si le nom n'est pas une chaîne", async () => {
    const request = new Request("http://localhost/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: 123 }),
    });

    const locals = {
      user: { id: "user_123", email: "test@example.com" },
    };

    await expect(POST({ request, locals } as any)).rejects.toThrow();
  });

  it("devrait gérer les erreurs du service", async () => {
    vi.mocked(createCollection).mockRejectedValue(new Error("Database error"));

    const request = new Request("http://localhost/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: "Ma Collection" }),
    });

    const locals = {
      user: { id: "user_123", email: "test@example.com" },
    };

    await expect(POST({ request, locals } as any)).rejects.toThrow();
  });
});
