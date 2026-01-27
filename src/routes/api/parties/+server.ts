import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { prisma } from "$lib/server/db";
import type { Prisma } from "@prisma/client";

export const GET: RequestHandler = async ({ url, locals }) => {
  const user = locals.user;

  if (!user) {
    throw error(401, "Non authentifié");
  }

  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = parseInt(url.searchParams.get("pageSize") || "20");
  const sortBy = url.searchParams.get("sortBy") || "updatedAt";
  const sortOrder = url.searchParams.get("sortOrder") || "desc";
  const collectionId = url.searchParams.get("collectionId");
  const tagId = url.searchParams.get("tagId");
  const isInAnalysis = url.searchParams.get("isInAnalysis");

  const whitePlayer = url.searchParams.get("whitePlayer");
  const blackPlayer = url.searchParams.get("blackPlayer");
  const tournament = url.searchParams.get("tournament");
  const result = url.searchParams.get("result");
  const whiteEloMin = url.searchParams.get("whiteEloMin");
  const whiteEloMax = url.searchParams.get("whiteEloMax");
  const blackEloMin = url.searchParams.get("blackEloMin");
  const blackEloMax = url.searchParams.get("blackEloMax");
  const dateMin = url.searchParams.get("dateMin");
  const dateMax = url.searchParams.get("dateMax");

  const where: Prisma.PartieTravailWhereInput = {
    collection: {
      proprietaireId: user.id,
      deletedAt: null,
    },
  };

  if (collectionId) {
    where.collectionId = collectionId;
  }

  if (isInAnalysis === "true") {
    where.isInAnalysis = true;
  }

  if (tagId) {
    where.tags = {
      some: {
        tagId: tagId,
      },
    };
  }

  if (whitePlayer) {
    where.blancNom = {
      contains: whitePlayer,
      mode: "insensitive",
    };
  }

  if (blackPlayer) {
    where.noirNom = {
      contains: blackPlayer,
      mode: "insensitive",
    };
  }

  if (tournament) {
    where.event = {
      contains: tournament,
      mode: "insensitive",
    };
  }

  if (result) {
    where.resultat = result as any;
  }

  if (whiteEloMin || whiteEloMax) {
    where.blancElo = {};
    if (whiteEloMin) where.blancElo.gte = parseInt(whiteEloMin);
    if (whiteEloMax) where.blancElo.lte = parseInt(whiteEloMax);
  }

  if (blackEloMin || blackEloMax) {
    where.noirElo = {};
    if (blackEloMin) where.noirElo.gte = parseInt(blackEloMin);
    if (blackEloMax) where.noirElo.lte = parseInt(blackEloMax);
  }

  if (dateMin || dateMax) {
    where.datePartie = {};
    if (dateMin) where.datePartie.gte = new Date(dateMin);
    if (dateMax) where.datePartie.lte = new Date(dateMax);
  }

  const orderByMap: Record<string, Prisma.PartieTravailOrderByWithRelationInput> = {
    whitePlayer: { blancNom: sortOrder as any },
    blackPlayer: { noirNom: sortOrder as any },
    whiteElo: { blancElo: sortOrder as any },
    blackElo: { noirElo: sortOrder as any },
    result: { resultat: sortOrder as any },
    date: { datePartie: sortOrder as any },
    tournament: { event: sortOrder as any },
    updatedAt: { updatedAt: sortOrder as any },
  };

  const orderBy = orderByMap[sortBy] || { updatedAt: "desc" };

  const [total, parties] = await Promise.all([
    prisma.partieTravail.count({ where }),
    prisma.partieTravail.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        coups: {
          where: {
            estPrincipal: true,
          },
          orderBy: {
            ply: "asc",
          },
          select: {
            coupUci: true,
            ply: true,
          },
        },
        collection: {
          select: {
            nom: true,
          },
        },
        tags: {
          select: {
            tagId: true,
          },
        },
      },
    }),
  ]);

  return json({
    data: parties.map((partie) => ({
      id: partie.id,
      whitePlayer: partie.blancNom || "?",
      blackPlayer: partie.noirNom || "?",
      tournament: partie.event || "?",
      date: partie.datePartie ? new Date(partie.datePartie).toLocaleDateString() : "?",
      whiteElo: partie.blancElo || 0,
      blackElo: partie.noirElo || 0,
      result: normalizeResult(partie.resultat),
      notation: formatMoves(partie.coups || []),
      isInAnalysis: partie.isInAnalysis || false,
      tagIds: partie.tags?.map((t) => t.tagId) || [],
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
};

function normalizeResult(result: string): string {
  if (result === "BLANCS") return "1-0";
  if (result === "NOIRS") return "0-1";
  if (result === "NULLE") return "½-½";
  return "?";
}

function formatMoves(coups: any[]): string {
  if (!coups || coups.length === 0) return "";
  
  const moves = [];
  for (let i = 0; i < Math.min(coups.length, 10); i++) {
    const move = coups[i];
    if (i % 2 === 0) {
      moves.push(`${Math.floor(i / 2) + 1}.${move.coupUci}`);
    } else {
      moves.push(move.coupUci);
    }
  }
  
  return coups.length > 10 ? moves.join(" ") + "..." : moves.join(" ");
}
