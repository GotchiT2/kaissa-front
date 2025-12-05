const players = [
	'Aravindh, C',
	'Fedoseev, V',
	'Vachier Lagrave, M',
	'Praggnanandhaa, R',
	'Carlsen, M',
	'Nakamura, H',
	'Firouzja, A'
];

const tournaments = [
	'Los Angeles, 3rd Chess Open',
	'Tata Steel Masters',
	'Candidates 2024',
	'Championnats du monde FIDE'
];

const results: GameRow['result'][] = ['1-0', '0-1', '½-½'];

function randomItem<T>(arr: T[]) {
	return arr[Math.floor(Math.random() * arr.length)];
}

export function generateFakeGames(count = 50): GameRow[] {
	const rows: GameRow[] = [];

	for (let i = 0; i < count; i++) {
		const white = randomItem(players);
		let black = randomItem(players);
		while (black === white) black = randomItem(players);

		rows.push({
			id: crypto.randomUUID(),
			white,
			whiteElo: 2600 + Math.floor(Math.random() * 300),
			black,
			blackElo: 2600 + Math.floor(Math.random() * 300),
			result: randomItem(results),
			date: new Date(2025, 6, 10).toISOString().slice(0, 10),
			tournament: randomItem(tournaments),
			notation: '1.e4 c5 2.Nf3 e6 3.d4 cxd4 4.Nxd4 …'
		});
	}

	return rows;
}
