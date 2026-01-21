import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "$routes/api/collections/[id]/import/+server";
import { prisma } from "$lib/server/db";
import * as pgnParser from "$lib/server/utils/pgnParser";

vi.mock("$lib/server/db", () => ({
  prisma: {
    collection: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    partieTravail: {
      create: vi.fn(),
    },
  },
}));

vi.mock("$lib/server/utils/pgnParser");

describe("POST /api/collections/[id]/import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devrait importer un fichier PGN avec succès", async () => {
    const mockCollection = {
      id: "col_123",
      nom: "Ma Collection",
      proprietaireId: "user_123",
    };

    const mockParsedGames = [
      {
        blancNom: "Carlsen, Magnus",
        noirNom: "Nakamura, Hikaru",
        blancElo: 2830,
        noirElo: 2800,
        event: "World Championship",
        site: "London",
        datePartie: new Date(2024, 0, 15),
        resultat: "BLANCS",
        moves: "1. e4 e5 2. Nf3 Nc6 3. Bb5 1-0",
      },
    ];

    vi.mocked(prisma.collection.findFirst).mockResolvedValue(mockCollection as any);
    vi.mocked(pgnParser.parsePGNFile).mockReturnValue(mockParsedGames);
    vi.mocked(prisma.partieTravail.create).mockResolvedValue({} as any);
    vi.mocked(prisma.collection.update).mockResolvedValue({} as any);

    const pgnContent = `
[Event "World Championship"]
[Site "London"]
[Date "2024.01.15"]
[White "Carlsen, Magnus"]
[Black "Nakamura, Hikaru"]
[Result "1-0"]
[WhiteElo "2830"]
[BlackElo "2800"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 1-0
`;

    const file = new File([pgnContent], "test.pgn", { type: "text/plain" });
    const formData = new FormData();
    formData.append("file", file);

    const request = new Request("http://localhost/api/collections/col_123/import", {
      method: "POST",
      body: formData,
    });

    const locals = {
      user: { id: "user_123", email: "test@example.com" },
    };

    const params = { id: "col_123" };

    const response = await POST({ request, locals, params } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      message: "1 partie(s) importée(s) avec succès",
      imported: 1,
      total: 1,
    });

    expect(prisma.partieTravail.create).toHaveBeenCalledWith({
      data: {
        collectionId: "col_123",
        titre: "Carlsen, Magnus vs Nakamura, Hikaru",
        resultat: "BLANCS",
        blancNom: "Carlsen, Magnus",
        noirNom: "Nakamura, Hikaru",
        blancElo: 2830,
        noirElo: 2800,
        datePartie: expect.any(Date),
        event: "World Championship",
        site: "London",
      },
    });

    expect(prisma.collection.update).toHaveBeenCalledWith({
      where: { id: "col_123" },
      data: { updatedAt: expect.any(Date) },
    });
  });

  it("devrait importer plusieurs parties depuis un fichier PGN", async () => {
    const mockCollection = {
      id: "col_123",
      nom: "Ma Collection",
      proprietaireId: "user_123",
    };

    const mockParsedGames = [
      {
        blancNom: "Player A",
        noirNom: "Player B",
        resultat: "BLANCS",
        moves: "1. e4 1-0",
      },
      {
        blancNom: "Player C",
        noirNom: "Player D",
        resultat: "NOIRS",
        moves: "1. d4 0-1",
      },
    ];

    vi.mocked(prisma.collection.findFirst).mockResolvedValue(mockCollection as any);
    vi.mocked(pgnParser.parsePGNFile).mockReturnValue(mockParsedGames as any);
    vi.mocked(prisma.partieTravail.create).mockResolvedValue({} as any);
    vi.mocked(prisma.collection.update).mockResolvedValue({} as any);

    const file = new File(["pgn content"], "test.pgn", { type: "text/plain" });
    const formData = new FormData();
    formData.append("file", file);

    const request = new Request("http://localhost/api/collections/col_123/import", {
      method: "POST",
      body: formData,
    });

    const locals = {
      user: { id: "user_123", email: "test@example.com" },
    };

    const params = { id: "col_123" };

    const response = await POST({ request, locals, params } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.imported).toBe(2);
    expect(data.total).toBe(2);
    expect(prisma.partieTravail.create).toHaveBeenCalledTimes(2);
  });

  it("devrait rejeter la requête si l'utilisateur n'est pas authentifié", async () => {
    const file = new File(["pgn content"], "test.pgn", { type: "text/plain" });
    const formData = new FormData();
    formData.append("file", file);

    const request = new Request("http://localhost/api/collections/col_123/import", {
      method: "POST",
      body: formData,
    });

    const locals = { user: null };
    const params = { id: "col_123" };

    await expect(POST({ request, locals, params } as any)).rejects.toThrow();
  });

  it("devrait rejeter si la collection n'existe pas", async () => {
    vi.mocked(prisma.collection.findFirst).mockResolvedValue(null);

    const file = new File(["pgn content"], "test.pgn", { type: "text/plain" });
    const formData = new FormData();
    formData.append("file", file);

    const request = new Request("http://localhost/api/collections/col_123/import", {
      method: "POST",
      body: formData,
    });

    const locals = {
      user: { id: "user_123", email: "test@example.com" },
    };

    const params = { id: "col_123" };

    await expect(POST({ request, locals, params } as any)).rejects.toThrow();
  });

  it("devrait rejeter si la collection n'appartient pas à l'utilisateur", async () => {
    const mockCollection = {
      id: "col_123",
      nom: "Ma Collection",
      proprietaireId: "other_user",
    };

    vi.mocked(prisma.collection.findFirst).mockResolvedValue(mockCollection as any);

    const file = new File(["pgn content"], "test.pgn", { type: "text/plain" });
    const formData = new FormData();
    formData.append("file", file);

    const request = new Request("http://localhost/api/collections/col_123/import", {
      method: "POST",
      body: formData,
    });

    const locals = {
      user: { id: "user_123", email: "test@example.com" },
    };

    const params = { id: "col_123" };

    await expect(POST({ request, locals, params } as any)).rejects.toThrow();
  });

  it("devrait rejeter si aucun fichier n'est fourni", async () => {
    const mockCollection = {
      id: "col_123",
      nom: "Ma Collection",
      proprietaireId: "user_123",
    };

    vi.mocked(prisma.collection.findFirst).mockResolvedValue(mockCollection as any);

    const formData = new FormData();

    const request = new Request("http://localhost/api/collections/col_123/import", {
      method: "POST",
      body: formData,
    });

    const locals = {
      user: { id: "user_123", email: "test@example.com" },
    };

    const params = { id: "col_123" };

    await expect(POST({ request, locals, params } as any)).rejects.toThrow();
  });

  it("devrait rejeter si le fichier n'a pas l'extension .pgn", async () => {
    const mockCollection = {
      id: "col_123",
      nom: "Ma Collection",
      proprietaireId: "user_123",
    };

    vi.mocked(prisma.collection.findFirst).mockResolvedValue(mockCollection as any);

    const file = new File(["content"], "test.txt", { type: "text/plain" });
    const formData = new FormData();
    formData.append("file", file);

    const request = new Request("http://localhost/api/collections/col_123/import", {
      method: "POST",
      body: formData,
    });

    const locals = {
      user: { id: "user_123", email: "test@example.com" },
    };

    const params = { id: "col_123" };

    await expect(POST({ request, locals, params } as any)).rejects.toThrow();
  });

  it("devrait rejeter si le parsing échoue", async () => {
    const mockCollection = {
      id: "col_123",
      nom: "Ma Collection",
      proprietaireId: "user_123",
    };

    vi.mocked(prisma.collection.findFirst).mockResolvedValue(mockCollection as any);
    vi.mocked(pgnParser.parsePGNFile).mockImplementation(() => {
      throw new Error("Aucune partie trouvée dans le fichier PGN");
    });

    const file = new File(["invalid pgn"], "test.pgn", { type: "text/plain" });
    const formData = new FormData();
    formData.append("file", file);

    const request = new Request("http://localhost/api/collections/col_123/import", {
      method: "POST",
      body: formData,
    });

    const locals = {
      user: { id: "user_123", email: "test@example.com" },
    };

    const params = { id: "col_123" };

    await expect(POST({ request, locals, params } as any)).rejects.toThrow();
  });

  it("devrait continuer même si certaines parties échouent à l'import", async () => {
    const mockCollection = {
      id: "col_123",
      nom: "Ma Collection",
      proprietaireId: "user_123",
    };

    const mockParsedGames = [
      {
        blancNom: "Player A",
        noirNom: "Player B",
        resultat: "BLANCS",
        moves: "1. e4 1-0",
      },
      {
        blancNom: "Player C",
        noirNom: "Player D",
        resultat: "NOIRS",
        moves: "1. d4 0-1",
      },
    ];

    vi.mocked(prisma.collection.findFirst).mockResolvedValue(mockCollection as any);
    vi.mocked(pgnParser.parsePGNFile).mockReturnValue(mockParsedGames as any);
    vi.mocked(prisma.partieTravail.create)
      .mockResolvedValueOnce({} as any)
      .mockRejectedValueOnce(new Error("Database error"));
    vi.mocked(prisma.collection.update).mockResolvedValue({} as any);

    const file = new File(["pgn content"], "test.pgn", { type: "text/plain" });
    const formData = new FormData();
    formData.append("file", file);

    const request = new Request("http://localhost/api/collections/col_123/import", {
      method: "POST",
      body: formData,
    });

    const locals = {
      user: { id: "user_123", email: "test@example.com" },
    };

    const params = { id: "col_123" };

    const response = await POST({ request, locals, params } as any);
    const data = await response.json();

    expect(data.imported).toBe(1);
    expect(data.total).toBe(2);
  });
});
