import { db } from "$lib/server/db";
import type {
  CollectionWithGames,
  CreateGameData,
  Game,
} from "$lib/types/chess.types";

export async function getUserCollections(
  userId: string,
): Promise<CollectionWithGames[]> {
  return await db.collection.findMany({
    where: {
      creatorId: userId,
    },
    include: {
      games: {
        include: {
          game: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function getCollectionById(
  collectionId: string,
  userId: string,
): Promise<CollectionWithGames | null> {
  return await db.collection.findFirst({
    where: {
      id: collectionId,
      creatorId: userId,
    },
    include: {
      games: {
        include: {
          game: true,
        },
      },
    },
  });
}

export async function createCollection(
  userId: string,
  title: string,
): Promise<CollectionWithGames> {
  return await db.collection.create({
    data: {
      title,
      creatorId: userId,
    },
    include: {
      games: {
        include: {
          game: true,
        },
      },
    },
  });
}

export async function ensureDefaultCollection(
  userId: string,
): Promise<CollectionWithGames> {
  const existingCollection = await db.collection.findFirst({
    where: {
      creatorId: userId,
      title: "Kaissa",
    },
    include: {
      games: {
        include: {
          game: true,
        },
      },
    },
  });

  if (!existingCollection) {
    return await createCollection(userId, "Kaissa");
  }

  return existingCollection;
}

export async function addGameToCollection(
  collectionId: string,
  gameData: CreateGameData,
): Promise<Game> {
  const game = await db.game.create({
    data: gameData,
  });

  await db.collectionGame.create({
    data: {
      collectionId,
      gameId: game.id,
    },
  });

  return game;
}
