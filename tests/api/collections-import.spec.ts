import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "../../../src/routes/api/collections/[id]/import/+server";
import { prisma } from "$lib/server/db";
import * as pgnParser from "$lib/server/utils/pgnParser";

vi.mock("$lib/server/db", () => ({
  prisma: {
    collection: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
    $executeRaw: vi.fn(),
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
        parsedMoves: [
          { uci: "e2e4", san: "e4", fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1", ply: 1 },
          { uci: "e7e5", san: "e5", fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2", ply: 2 },
        ],
      },
    ];

    vi.mocked(prisma.collection.findFirst).mockResolvedValue(mockCollection as any);
    vi.mocked(pgnParser.parsePGNFile).mockReturnValue(mockParsedGames as any);
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      const tx = {
        partieTravail: {
          createMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        coupNoeud: {
          createMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
        transitionPartie: {
          createMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      };
      return await callback(tx);
    });
    vi.mocked(prisma.collection.update).mockResolvedValue({} as any);
    vi.mocked(prisma.$executeRaw).mockResolvedValue(0);

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

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.collection.update).toHaveBeenCalledWith({
      where: { id: "col_123" },
      data: { updatedAt: expect.any(Date) },
    });
    expect(prisma.$executeRaw).toHaveBeenCalled();
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
        parsedMoves: [
          { uci: "e2e4", san: "e4", fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1", ply: 1 },
        ],
      },
      {
        blancNom: "Player C",
        noirNom: "Player D",
        resultat: "NOIRS",
        moves: "1. d4 0-1",
        parsedMoves: [
          { uci: "d2d4", san: "d4", fen: "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1", ply: 1 },
        ],
      },
    ];

    vi.mocked(prisma.collection.findFirst).mockResolvedValue(mockCollection as any);
    vi.mocked(pgnParser.parsePGNFile).mockReturnValue(mockParsedGames as any);
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      const tx = {
        partieTravail: {
          createMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
        coupNoeud: {
          createMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
        transitionPartie: {
          createMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
      };
      return await callback(tx);
    });
    vi.mocked(prisma.collection.update).mockResolvedValue({} as any);
    vi.mocked(prisma.$executeRaw).mockResolvedValue(0);

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
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it("devrait traiter les parties par batch", async () => {
    const mockCollection = {
      id: "col_123",
      nom: "Ma Collection",
      proprietaireId: "user_123",
    };

    const mockParsedGames = Array.from({ length: 150 }, (_, i) => ({
      blancNom: `Player A${i}`,
      noirNom: `Player B${i}`,
      resultat: "BLANCS",
      moves: "1. e4 1-0",
      parsedMoves: [
        { uci: "e2e4", san: "e4", fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1", ply: 1 },
      ],
    }));

    vi.mocked(prisma.collection.findFirst).mockResolvedValue(mockCollection as any);
    vi.mocked(pgnParser.parsePGNFile).mockReturnValue(mockParsedGames as any);
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      const tx = {
        partieTravail: {
          createMany: vi.fn().mockResolvedValue({ count: 100 }),
        },
        coupNoeud: {
          createMany: vi.fn().mockResolvedValue({ count: 100 }),
        },
        transitionPartie: {
          createMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
      };
      return await callback(tx);
    });
    vi.mocked(prisma.collection.update).mockResolvedValue({} as any);
    vi.mocked(prisma.$executeRaw).mockResolvedValue(0);

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
    expect(data.imported).toBe(150);
    expect(data.total).toBe(150);
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
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

  it("devrait continuer même si certains batch échouent à l'import", async () => {
    const mockCollection = {
      id: "col_123",
      nom: "Ma Collection",
      proprietaireId: "user_123",
    };

    const mockParsedGames = Array.from({ length: 150 }, (_, i) => ({
      blancNom: `Player A${i}`,
      noirNom: `Player B${i}`,
      resultat: "BLANCS",
      moves: "1. e4 1-0",
      parsedMoves: [
        { uci: "e2e4", san: "e4", fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1", ply: 1 },
      ],
    }));

    vi.mocked(prisma.collection.findFirst).mockResolvedValue(mockCollection as any);
    vi.mocked(pgnParser.parsePGNFile).mockReturnValue(mockParsedGames as any);
    
    let callCount = 0;
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      callCount++;
      if (callCount === 2) {
        throw new Error("Database error");
      }
      const tx = {
        partieTravail: {
          createMany: vi.fn().mockResolvedValue({ count: 100 }),
        },
        coupNoeud: {
          createMany: vi.fn().mockResolvedValue({ count: 100 }),
        },
        transitionPartie: {
          createMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
      };
      return await callback(tx);
    });
    vi.mocked(prisma.collection.update).mockResolvedValue({} as any);
    vi.mocked(prisma.$executeRaw).mockResolvedValue(0);

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

    expect(data.imported).toBe(100);
    expect(data.total).toBe(150);
  });
});
