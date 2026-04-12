const withBase = (path) => `${import.meta.env.BASE_URL}${path}`;

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
