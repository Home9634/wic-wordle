const withBase = (path) => `${import.meta.env.BASE_URL}${path}`;

const normalizeGameName = (name) =>
  (name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

export const gameArtByName = {
  'Rocket Spleef Rush': withBase('images/games/rsr.png'),
  'Parkour Warrior Survivor': withBase('images/games/pkw.png'),
  'Sky Battle': withBase('images/games/skb.png'),
  'Totem Tag': withBase('images/games/tt.png'),
  'Dynaball': withBase('images/games/db.png'),
  'Hole in the Wall': withBase('images/games/hitw.png'),
  'Bingo But Quick': withBase('images/games/bbq.png'),
  'To Get To The Other Side': withBase('images/games/tgttos.png'),
  'Sprint Racer': withBase('images/games/sr.png'),
  'Battle Box': withBase('images/games/bb.png')
};

const aliases = {
  'hole in the wall': 'Hole in the Wall',
  'hole in the wall ': 'Hole in the Wall',
  'hole in the wall,': 'Hole in the Wall',
};

const normalizedGameArtByName = Object.fromEntries(
  Object.entries(gameArtByName).map(([name, path]) => [normalizeGameName(name), path])
);

export function getGameArtByName(gameName) {
  if (!gameName) return null;
  const normalized = normalizeGameName(gameName);
  const canonical = aliases[normalized] || gameName;
  return normalizedGameArtByName[normalizeGameName(canonical)] || null;
}
