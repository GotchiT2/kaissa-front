import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getUserCollections, getCollectionById, createCollection, ensureDefaultCollection, addGameToCollection } from '$lib/server/services/collection.service';
import type { CollectionWithGames, CreateGameData } from '$lib/types/chess.types';

vi.mock('$lib/server/db', () => ({
	db: {
		collection: {
			findMany: vi.fn(),
			findFirst: vi.fn(),
			create: vi.fn()
		},
		game: {
			create: vi.fn()
		},
		collectionGame: {
			create: vi.fn()
		}
	}
}));

import { db } from '$lib/server/db';

describe('collection.service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getUserCollections', () => {
		it('devrait récupérer toutes les collections d\'un utilisateur', async () => {
			const userId = 'user123';
			const mockCollections: CollectionWithGames[] = [
				{
					id: 'col1',
					title: 'Kaissa',
					creatorId: userId,
					createdAt: new Date(),
					updatedAt: new Date(),
					games: []
				}
			];

			vi.mocked(db.collection.findMany).mockResolvedValue(mockCollections);

			const result = await getUserCollections(userId);

			expect(db.collection.findMany).toHaveBeenCalledWith({
				where: { creatorId: userId },
				include: { games: { include: { game: true } } },
				orderBy: { updatedAt: 'desc' }
			});
			expect(result).toEqual(mockCollections);
		});
	});

	describe('getCollectionById', () => {
		it('devrait récupérer une collection spécifique', async () => {
			const userId = 'user123';
			const collectionId = 'col1';
			const mockCollection: CollectionWithGames = {
				id: collectionId,
				title: 'Ma Collection',
				creatorId: userId,
				createdAt: new Date(),
				updatedAt: new Date(),
				games: []
			};

			vi.mocked(db.collection.findFirst).mockResolvedValue(mockCollection);

			const result = await getCollectionById(collectionId, userId);

			expect(db.collection.findFirst).toHaveBeenCalledWith({
				where: { id: collectionId, creatorId: userId },
				include: { games: { include: { game: true } } }
			});
			expect(result).toEqual(mockCollection);
		});

		it('devrait retourner null si la collection n\'existe pas', async () => {
			vi.mocked(db.collection.findFirst).mockResolvedValue(null);

			const result = await getCollectionById('nonexistent', 'user123');

			expect(result).toBeNull();
		});
	});

	describe('createCollection', () => {
		it('devrait créer une nouvelle collection', async () => {
			const userId = 'user123';
			const title = 'Nouvelle Collection';
			const mockCollection: CollectionWithGames = {
				id: 'col1',
				title,
				creatorId: userId,
				createdAt: new Date(),
				updatedAt: new Date(),
				games: []
			};

			vi.mocked(db.collection.create).mockResolvedValue(mockCollection);

			const result = await createCollection(userId, title);

			expect(db.collection.create).toHaveBeenCalledWith({
				data: { title, creatorId: userId },
				include: { games: { include: { game: true } } }
			});
			expect(result).toEqual(mockCollection);
		});
	});

	describe('ensureDefaultCollection', () => {
		it('devrait créer une collection "Kaissa" si elle n\'existe pas', async () => {
			const userId = 'user123';
			const mockCollection: CollectionWithGames = {
				id: 'col1',
				title: 'Kaissa',
				creatorId: userId,
				createdAt: new Date(),
				updatedAt: new Date(),
				games: []
			};

			vi.mocked(db.collection.findFirst).mockResolvedValue(null);
			vi.mocked(db.collection.create).mockResolvedValue(mockCollection);

			const result = await ensureDefaultCollection(userId);

			expect(db.collection.findFirst).toHaveBeenCalledWith({
				where: { creatorId: userId, title: 'Kaissa' },
				include: { games: { include: { game: true } } }
			});
			expect(db.collection.create).toHaveBeenCalled();
			expect(result.title).toBe('Kaissa');
		});

		it('devrait retourner la collection "Kaissa" existante', async () => {
			const userId = 'user123';
			const existingCollection: CollectionWithGames = {
				id: 'col1',
				title: 'Kaissa',
				creatorId: userId,
				createdAt: new Date(),
				updatedAt: new Date(),
				games: []
			};

			vi.mocked(db.collection.findFirst).mockResolvedValue(existingCollection);

			const result = await ensureDefaultCollection(userId);

			expect(db.collection.create).not.toHaveBeenCalled();
			expect(result).toEqual(existingCollection);
		});
	});

	describe('addGameToCollection', () => {
		it('devrait ajouter une partie à une collection', async () => {
			const collectionId = 'col1';
			const gameData: CreateGameData = {
				whitePlayer: 'Magnus Carlsen',
				blackPlayer: 'Hikaru Nakamura',
				tournament: 'World Championship 2024',
				date: new Date('2024-01-15'),
				whiteElo: 2830,
				blackElo: 2800,
				moves: '1. e4 e5 2. Nf3 Nc6',
				result: '1-0'
			};

			const mockGame = {
				id: 'game1',
				...gameData,
				createdAt: new Date(),
				updatedAt: new Date()
			};

			vi.mocked(db.game.create).mockResolvedValue(mockGame);
			vi.mocked(db.collectionGame.create).mockResolvedValue({
				id: 'cg1',
				collectionId,
				gameId: mockGame.id,
				addedAt: new Date()
			} as any);

			const result = await addGameToCollection(collectionId, gameData);

			expect(db.game.create).toHaveBeenCalledWith({ data: gameData });
			expect(db.collectionGame.create).toHaveBeenCalledWith({
				data: { collectionId, gameId: mockGame.id }
			});
			expect(result).toEqual(mockGame);
		});
	});
});
