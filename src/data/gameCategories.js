export const GAME_TYPES = {
  MOVEMENT: 'Movement',
  PVP: 'PVP',
  MISC: 'Misc',
  TEAM: 'Team'
};

export const gameTypeByName = {
  'Sprint Racer': GAME_TYPES.MOVEMENT,
  'Parkour Warrior Survivor': GAME_TYPES.MOVEMENT,
  'To Get To The Other Side': GAME_TYPES.MOVEMENT,
  'Sky Battle': GAME_TYPES.PVP,
  'Battle Box': GAME_TYPES.PVP,
  'Totem Tag': GAME_TYPES.TEAM,
  'Bingo But Quick': GAME_TYPES.TEAM,
  'Hole In The Wall': GAME_TYPES.MISC,
  'Rocket Spleef Rush': GAME_TYPES.MISC,
  'Dynaball': GAME_TYPES.MISC
};
