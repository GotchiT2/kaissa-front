// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	interface GameRow {
		id: string;
		white: string;
		whiteElo: number;
		black: string;
		blackElo: number;
		result: '1-0' | '0-1' | '½-½';
		date: string;
		tournament: string;
		notation: string;
	}
}

export {};
