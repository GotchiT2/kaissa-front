import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "$lib/server/db";
import { hashFEN } from "$lib/server/utils/positionHash";

describe("Import PGN avec agrégats", () => {
  let userId: string;
  let sessionId: string;
  let collectionId: string;

  beforeEach(async () => {
    userId = `test_user_${Date.now()}_${Math.random()}`;
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
    await prisma.transitionPartie.deleteMany({
      where: {
        partie: {
          collectionId,
        },
      },
    });
    await prisma.agregatCoupsCollection.deleteMany({
      where: { collectionId },
    });
    await prisma.coupNoeud.deleteMany({
      where: {
        partie: {
          collectionId,
        },
      },
    });
    await prisma.partieTravail.deleteMany({
      where: { collectionId },
    });
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.collection.deleteMany({ where: { proprietaireId: userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  it("devrait créer les TransitionPartie lors de l'import", async () => {
    const pgnContent = `[Event "Test Game"]
[Site "Test"]
[Date "2024.01.13"]
[Round "1"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 1-0`;

    const formData = new FormData();
    const blob = new Blob([pgnContent], { type: "text/plain" });
    formData.append("file", blob, "test.pgn");

    const response = await fetch(
      `http://localhost:5173/api/collections/${collectionId}/import`,
      {
        method: "POST",
        headers: {
          Cookie: `session=${sessionId}`,
        },
        body: formData,
      }
    );

    expect(response.status).toBe(200);

    const transitions = await prisma.transitionPartie.findMany({
      where: {
        partie: {
          collectionId,
        },
      },
      orderBy: {
        ply: "asc",
      },
    });

    expect(transitions.length).toBeGreaterThan(0);
    expect(transitions[0].estDansPrincipal).toBe(true);
    expect(transitions[0].coupUci).toBeDefined();
  });

  it("devrait calculer les agrégats après l'import", async () => {
    const pgnContent = `[Event "Test Game"]
[Site "Test"]
[Date "2024.01.13"]
[Round "1"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]

1. e4 e5 2. Nf3 1-0`;

    const formData = new FormData();
    const blob = new Blob([pgnContent], { type: "text/plain" });
    formData.append("file", blob, "test.pgn");

    await fetch(`http://localhost:5173/api/collections/${collectionId}/import`, {
      method: "POST",
      headers: {
        Cookie: `session=${sessionId}`,
      },
      body: formData,
    });

    const agregats = await prisma.agregatCoupsCollection.findMany({
      where: {
        collectionId,
      },
    });

    expect(agregats.length).toBeGreaterThan(0);
    expect(agregats[0].filtreHash).toBe("default");
    expect(agregats[0].nbParties).toBeGreaterThan(0n);
  });

  it("devrait compter correctement les parties distinctes", async () => {
    const pgn1 = `[Event "Test Game 1"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]

1. e4 e5 1-0`;

    const pgn2 = `[Event "Test Game 2"]
[White "Player3"]
[Black "Player4"]
[Result "0-1"]

1. e4 e5 0-1`;

    const pgnContent = `${pgn1}\n\n${pgn2}`;

    const formData = new FormData();
    const blob = new Blob([pgnContent], { type: "text/plain" });
    formData.append("file", blob, "test.pgn");

    await fetch(`http://localhost:5173/api/collections/${collectionId}/import`, {
      method: "POST",
      headers: {
        Cookie: `session=${sessionId}`,
      },
      body: formData,
    });

    const startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const hashPosition = hashFEN(startFen);

    const agregat = await prisma.agregatCoupsCollection.findFirst({
      where: {
        collectionId,
        hashPosition,
        coupUci: "e2e4",
      },
    });

    expect(agregat).toBeDefined();
    expect(agregat!.nbParties).toBe(2n);
  });

  it("devrait compter correctement les résultats", async () => {
    const pgn1 = `[Event "Test Game 1"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]

1. e4 e5 1-0`;

    const pgn2 = `[Event "Test Game 2"]
[White "Player3"]
[Black "Player4"]
[Result "0-1"]

1. e4 e5 0-1`;

    const pgn3 = `[Event "Test Game 3"]
[White "Player5"]
[Black "Player6"]
[Result "1/2-1/2"]

1. e4 e5 1/2-1/2`;

    const pgnContent = `${pgn1}\n\n${pgn2}\n\n${pgn3}`;

    const formData = new FormData();
    const blob = new Blob([pgnContent], { type: "text/plain" });
    formData.append("file", blob, "test.pgn");

    await fetch(`http://localhost:5173/api/collections/${collectionId}/import`, {
      method: "POST",
      headers: {
        Cookie: `session=${sessionId}`,
      },
      body: formData,
    });

    const startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const hashPosition = hashFEN(startFen);

    const agregat = await prisma.agregatCoupsCollection.findFirst({
      where: {
        collectionId,
        hashPosition,
        coupUci: "e2e4",
      },
    });

    expect(agregat).toBeDefined();
    expect(agregat!.nbParties).toBe(3n);
    expect(agregat!.victoiresBlancs).toBe(1n);
    expect(agregat!.victoiresNoirs).toBe(1n);
    expect(agregat!.nulles).toBe(1n);
  });

  it("devrait mettre à jour les agrégats existants lors d'un nouvel import", async () => {
    const pgn1 = `[Event "Test Game 1"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]

1. e4 e5 1-0`;

    const formData1 = new FormData();
    const blob1 = new Blob([pgn1], { type: "text/plain" });
    formData1.append("file", blob1, "test1.pgn");

    await fetch(`http://localhost:5173/api/collections/${collectionId}/import`, {
      method: "POST",
      headers: {
        Cookie: `session=${sessionId}`,
      },
      body: formData1,
    });

    const startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const hashPosition = hashFEN(startFen);

    let agregat = await prisma.agregatCoupsCollection.findFirst({
      where: {
        collectionId,
        hashPosition,
        coupUci: "e2e4",
      },
    });

    expect(agregat).toBeDefined();
    expect(agregat!.nbParties).toBe(1n);
    expect(agregat!.victoiresBlancs).toBe(1n);

    const pgn2 = `[Event "Test Game 2"]
[White "Player3"]
[Black "Player4"]
[Result "0-1"]

1. e4 e5 0-1`;

    const formData2 = new FormData();
    const blob2 = new Blob([pgn2], { type: "text/plain" });
    formData2.append("file", blob2, "test2.pgn");

    await fetch(`http://localhost:5173/api/collections/${collectionId}/import`, {
      method: "POST",
      headers: {
        Cookie: `session=${sessionId}`,
      },
      body: formData2,
    });

    agregat = await prisma.agregatCoupsCollection.findFirst({
      where: {
        collectionId,
        hashPosition,
        coupUci: "e2e4",
      },
    });

    expect(agregat).toBeDefined();
    expect(agregat!.nbParties).toBe(2n);
    expect(agregat!.victoiresBlancs).toBe(1n);
    expect(agregat!.victoiresNoirs).toBe(1n);
  });

  it("devrait créer des agrégats pour différentes positions", async () => {
    const pgnContent = `[Event "Test Game"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 1-0`;

    const formData = new FormData();
    const blob = new Blob([pgnContent], { type: "text/plain" });
    formData.append("file", blob, "test.pgn");

    await fetch(`http://localhost:5173/api/collections/${collectionId}/import`, {
      method: "POST",
      headers: {
        Cookie: `session=${sessionId}`,
      },
      body: formData,
    });

    const agregats = await prisma.agregatCoupsCollection.findMany({
      where: {
        collectionId,
      },
    });

    const uniquePositions = new Set(
      agregats.map((a) => a.hashPosition.toString())
    );

    expect(uniquePositions.size).toBeGreaterThan(1);
  });

  it("devrait stocker le camp au trait dans les transitions", async () => {
    const pgnContent = `[Event "Test Game"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]

1. e4 e5 2. Nf3 1-0`;

    const formData = new FormData();
    const blob = new Blob([pgnContent], { type: "text/plain" });
    formData.append("file", blob, "test.pgn");

    await fetch(`http://localhost:5173/api/collections/${collectionId}/import`, {
      method: "POST",
      headers: {
        Cookie: `session=${sessionId}`,
      },
      body: formData,
    });

    const transitions = await prisma.transitionPartie.findMany({
      where: {
        partie: {
          collectionId,
        },
      },
      orderBy: {
        ply: "asc",
      },
    });

    expect(transitions.length).toBeGreaterThan(0);
    expect(transitions[0].campAuTrait).toBe("BLANCS");
    
    if (transitions.length > 1) {
      expect(transitions[1].campAuTrait).toBe("NOIRS");
    }
  });
});
