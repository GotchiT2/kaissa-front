import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "$lib/server/db";
import { hashFEN } from "$lib/server/utils/positionHash";

describe("API Position Moves", () => {
  let userId: string;
  let sessionId: string;
  let collectionId: string;
  let otherUserId: string;

  beforeEach(async () => {
    userId = `test_user_${Date.now()}_${Math.random()}`;
    otherUserId = `test_other_user_${Date.now()}_${Math.random()}`;
    sessionId = `test_session_${Date.now()}_${Math.random()}`;

    await prisma.user.create({
      data: {
        id: userId,
        email: `test_${Date.now()}@example.com`,
        password: "hashedpassword",
        firstName: "Test",
        lastName: "User",
        nationality: "FR",
      },
    });

    await prisma.user.create({
      data: {
        id: otherUserId,
        email: `other_${Date.now()}@example.com`,
        password: "hashedpassword",
        firstName: "Other",
        lastName: "User",
        nationality: "FR",
      },
    });

    await prisma.session.create({
      data: {
        id: sessionId,
        userId: userId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });

    const collection = await prisma.collection.create({
      data: {
        nom: "Test Collection",
        proprietaireId: userId,
      },
    });

    collectionId = collection.id;
  });

  afterEach(async () => {
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.collection.deleteMany({ where: { proprietaireId: userId } });
    await prisma.collection.deleteMany({ where: { proprietaireId: otherUserId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.user.deleteMany({ where: { id: otherUserId } });
  });

  it("devrait retourner les meilleurs coups pour une position", async () => {
    const startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const hashPosition = hashFEN(startFen);

    await prisma.agregatCoupsCollection.create({
      data: {
        collectionId,
        hashPosition,
        filtreHash: "default",
        coupUci: "e2e4",
        nbParties: 100n,
        victoiresBlancs: 45n,
        nulles: 25n,
        victoiresNoirs: 30n,
      },
    });

    await prisma.agregatCoupsCollection.create({
      data: {
        collectionId,
        hashPosition,
        filtreHash: "default",
        coupUci: "d2d4",
        nbParties: 80n,
        victoiresBlancs: 40n,
        nulles: 20n,
        victoiresNoirs: 20n,
      },
    });

    const response = await fetch(
      `http://localhost:5173/api/collections/${collectionId}/position-moves?hashPosition=${hashPosition}`,
      {
        headers: {
          Cookie: `session=${sessionId}`,
        },
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.moves).toHaveLength(2);
    expect(data.moves[0].coup).toBe("e2e4");
    expect(data.moves[0].nbParties).toBe(100);
    expect(data.moves[0].victoiresBlancs).toBe(45);
    expect(data.moves[1].coup).toBe("d2d4");
    expect(data.moves[1].nbParties).toBe(80);
  });

  it("devrait trier les coups par nombre de parties décroissant", async () => {
    const startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const hashPosition = hashFEN(startFen);

    await prisma.agregatCoupsCollection.createMany({
      data: [
        {
          collectionId,
          hashPosition,
          filtreHash: "default",
          coupUci: "e2e4",
          nbParties: 50n,
          victoiresBlancs: 20n,
          nulles: 15n,
          victoiresNoirs: 15n,
        },
        {
          collectionId,
          hashPosition,
          filtreHash: "default",
          coupUci: "d2d4",
          nbParties: 100n,
          victoiresBlancs: 40n,
          nulles: 30n,
          victoiresNoirs: 30n,
        },
        {
          collectionId,
          hashPosition,
          filtreHash: "default",
          coupUci: "c2c4",
          nbParties: 75n,
          victoiresBlancs: 30n,
          nulles: 25n,
          victoiresNoirs: 20n,
        },
      ],
    });

    const response = await fetch(
      `http://localhost:5173/api/collections/${collectionId}/position-moves?hashPosition=${hashPosition}`,
      {
        headers: {
          Cookie: `session=${sessionId}`,
        },
      }
    );

    const data = await response.json();
    expect(data.moves).toHaveLength(3);
    expect(data.moves[0].coup).toBe("d2d4");
    expect(data.moves[0].nbParties).toBe(100);
    expect(data.moves[1].coup).toBe("c2c4");
    expect(data.moves[1].nbParties).toBe(75);
    expect(data.moves[2].coup).toBe("e2e4");
    expect(data.moves[2].nbParties).toBe(50);
  });

  it("devrait limiter à 6 résultats", async () => {
    const startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const hashPosition = hashFEN(startFen);

    const coups = ["e2e4", "d2d4", "c2c4", "g1f3", "b1c3", "f2f4", "g2g3", "b2b3"];

    for (let i = 0; i < coups.length; i++) {
      await prisma.agregatCoupsCollection.create({
        data: {
          collectionId,
          hashPosition,
          filtreHash: "default",
          coupUci: coups[i],
          nbParties: BigInt(100 - i * 10),
          victoiresBlancs: 30n,
          nulles: 20n,
          victoiresNoirs: 20n,
        },
      });
    }

    const response = await fetch(
      `http://localhost:5173/api/collections/${collectionId}/position-moves?hashPosition=${hashPosition}`,
      {
        headers: {
          Cookie: `session=${sessionId}`,
        },
      }
    );

    const data = await response.json();
    expect(data.moves).toHaveLength(6);
  });

  it("devrait retourner un tableau vide si aucun coup n'est trouvé", async () => {
    const startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const hashPosition = hashFEN(startFen);

    const response = await fetch(
      `http://localhost:5173/api/collections/${collectionId}/position-moves?hashPosition=${hashPosition}`,
      {
        headers: {
          Cookie: `session=${sessionId}`,
        },
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.moves).toHaveLength(0);
  });

  it("devrait rejeter si l'utilisateur n'est pas authentifié", async () => {
    const startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const hashPosition = hashFEN(startFen);

    const response = await fetch(
      `http://localhost:5173/api/collections/${collectionId}/position-moves?hashPosition=${hashPosition}`
    );

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.message).toBe("Vous devez être connecté");
  });

  it("devrait rejeter si le paramètre hashPosition est manquant", async () => {
    const response = await fetch(
      `http://localhost:5173/api/collections/${collectionId}/position-moves`,
      {
        headers: {
          Cookie: `session=${sessionId}`,
        },
      }
    );

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.message).toBe("Le paramètre hashPosition est requis");
  });

  it("devrait rejeter si la collection n'existe pas", async () => {
    const fakeCollectionId = "fake_collection_id";
    const startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const hashPosition = hashFEN(startFen);

    const response = await fetch(
      `http://localhost:5173/api/collections/${fakeCollectionId}/position-moves?hashPosition=${hashPosition}`,
      {
        headers: {
          Cookie: `session=${sessionId}`,
        },
      }
    );

    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data.message).toBe("Collection non trouvée");
  });

  it("devrait rejeter si l'utilisateur n'est pas propriétaire de la collection", async () => {
    const otherSessionId = `other_session_${Date.now()}`;

    await prisma.session.create({
      data: {
        id: otherSessionId,
        userId: otherUserId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });

    const startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const hashPosition = hashFEN(startFen);

    const response = await fetch(
      `http://localhost:5173/api/collections/${collectionId}/position-moves?hashPosition=${hashPosition}`,
      {
        headers: {
          Cookie: `session=${otherSessionId}`,
        },
      }
    );

    expect(response.status).toBe(403);

    const data = await response.json();
    expect(data.message).toBe("Accès non autorisé à cette collection");

    await prisma.session.deleteMany({ where: { id: otherSessionId } });
  });
});
