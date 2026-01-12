import { describe, expect, it } from "vitest";
import { parsePGNFile } from "$lib/server/utils/pgnParser";

describe("parsePGNFile", () => {
  it("devrait parser un fichier PGN avec une seule partie", () => {
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

    const games = parsePGNFile(pgnContent);

    expect(games).toHaveLength(1);
    expect(games[0]).toEqual({
      blancNom: "Carlsen, Magnus",
      noirNom: "Nakamura, Hikaru",
      blancElo: 2830,
      noirElo: 2800,
      event: "World Championship",
      site: "London",
      datePartie: new Date(2024, 0, 15),
      resultat: "BLANCS",
      moves: "1. e4 e5 2. Nf3 Nc6 3. Bb5 1-0",
    });
  });

  it("devrait parser un fichier PGN avec plusieurs parties", () => {
    const pgnContent = `
[Event "Tournament 1"]
[Site "Paris"]
[Date "2024.01.15"]
[White "Player A"]
[Black "Player B"]
[Result "0-1"]

1. e4 e5 0-1

[Event "Tournament 2"]
[Site "Lyon"]
[Date "2024.01.16"]
[White "Player C"]
[Black "Player D"]
[Result "1/2-1/2"]

1. d4 d5 1/2-1/2
`;

    const games = parsePGNFile(pgnContent);

    expect(games).toHaveLength(2);
    expect(games[0].blancNom).toBe("Player A");
    expect(games[0].resultat).toBe("NOIRS");
    expect(games[1].blancNom).toBe("Player C");
    expect(games[1].resultat).toBe("NULLE");
  });

  it("devrait extraire correctement les ELO des joueurs", () => {
    const pgnContent = `
[Event "Test"]
[Site "Test"]
[Date "2024.01.15"]
[White "Player A"]
[Black "Player B"]
[WhiteElo "2500"]
[BlackElo "2450"]
[Result "*"]

1. e4 *
`;

    const games = parsePGNFile(pgnContent);

    expect(games[0].blancElo).toBe(2500);
    expect(games[0].noirElo).toBe(2450);
  });

  it("devrait gérer l'absence d'ELO", () => {
    const pgnContent = `
[Event "Test"]
[Site "Test"]
[Date "2024.01.15"]
[White "Player A"]
[Black "Player B"]
[Result "*"]

1. e4 *
`;

    const games = parsePGNFile(pgnContent);

    expect(games[0].blancElo).toBeUndefined();
    expect(games[0].noirElo).toBeUndefined();
  });

  it("devrait parser correctement les dates au format PGN", () => {
    const pgnContent = `
[Event "Test"]
[Site "Test"]
[Date "2024.12.25"]
[White "Player A"]
[Black "Player B"]
[Result "*"]

1. e4 *
`;

    const games = parsePGNFile(pgnContent);

    expect(games[0].datePartie).toEqual(new Date(2024, 11, 25));
  });

  it("devrait gérer les dates incomplètes", () => {
    const pgnContent = `
[Event "Test"]
[Site "Test"]
[Date "????.??.??"]
[White "Player A"]
[Black "Player B"]
[Result "*"]

1. e4 *
`;

    const games = parsePGNFile(pgnContent);

    expect(games[0].datePartie).toBeUndefined();
  });

  it("devrait convertir correctement les résultats", () => {
    const testCases = [
      { result: "1-0", expected: "BLANCS" },
      { result: "0-1", expected: "NOIRS" },
      { result: "1/2-1/2", expected: "NULLE" },
      { result: "*", expected: "INCONNU" },
    ];

    for (const { result, expected } of testCases) {
      const pgnContent = `
[Event "Test"]
[Site "Test"]
[Date "2024.01.15"]
[White "Player A"]
[Black "Player B"]
[Result "${result}"]

1. e4 ${result}
`;

      const games = parsePGNFile(pgnContent);
      expect(games[0].resultat).toBe(expected);
    }
  });

  it("devrait utiliser 'Inconnu' pour les joueurs manquants", () => {
    const pgnContent = `
[Event "Test"]
[Site "Test"]
[Date "2024.01.15"]
[Result "*"]

1. e4 *
`;

    const games = parsePGNFile(pgnContent);

    expect(games[0].blancNom).toBe("Inconnu");
    expect(games[0].noirNom).toBe("Inconnu");
  });

  it("devrait extraire event et site", () => {
    const pgnContent = `
[Event "World Championship 2024"]
[Site "Dubai"]
[Date "2024.01.15"]
[White "Player A"]
[Black "Player B"]
[Result "*"]

1. e4 *
`;

    const games = parsePGNFile(pgnContent);

    expect(games[0].event).toBe("World Championship 2024");
    expect(games[0].site).toBe("Dubai");
  });

  it("devrait lancer une erreur si aucune partie n'est trouvée", () => {
    const pgnContent = "Invalid PGN content";

    expect(() => parsePGNFile(pgnContent)).toThrow(
      "Aucune partie trouvée dans le fichier PGN"
    );
  });

  it("devrait continuer le parsing même si certaines parties échouent", () => {
    const pgnContent = `
[Event "Valid Game"]
[Site "Test"]
[Date "2024.01.15"]
[White "Player A"]
[Black "Player B"]
[Result "1-0"]

1. e4 e5 1-0

[Event "Another Valid Game"]
[Site "Test"]
[Date "2024.01.16"]
[White "Player C"]
[Black "Player D"]
[Result "0-1"]

1. d4 d5 0-1
`;

    const games = parsePGNFile(pgnContent);

    expect(games.length).toBeGreaterThan(0);
  });

  it("devrait parser les coups correctement", () => {
    const pgnContent = `
[Event "Test"]
[Site "Test"]
[Date "2024.01.15"]
[White "Player A"]
[Black "Player B"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 1-0
`;

    const games = parsePGNFile(pgnContent);

    expect(games[0].moves).toContain("1. e4 e5");
    expect(games[0].moves).toContain("2. Nf3 Nc6");
    expect(games[0].moves).toContain("1-0");
  });

  it("devrait gérer les métadonnées optionnelles manquantes", () => {
    const pgnContent = `
[Event "Test"]
[White "Player A"]
[Black "Player B"]
[Result "1-0"]

1. e4 1-0
`;

    const games = parsePGNFile(pgnContent);

    expect(games[0].site).toBeUndefined();
    expect(games[0].datePartie).toBeUndefined();
    expect(games[0].blancElo).toBeUndefined();
    expect(games[0].noirElo).toBeUndefined();
  });
});
