export const PEER_CONFIG = {
  config: {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  },
};

export const DEFAULT_VISIBLE_STATS = [
  'name',
  'debut',
  'canonFinale',
  'nonCanonFinale',
  'canonPlayed',
  'nonCanonPlayed',
  'favGame',
  'leastFavGame',
  'bestGame',
  'bestGameRetired',
  'region',
  'canonWins',
  'nonCanonWins',
];

export const STAT_DEFINITIONS = [
  { key: 'debut', label: 'Debut' },
  { key: 'canonFinale', label: 'Canon Finales' },
  { key: 'nonCanonFinale', label: 'Non-Canon Finales' },
  { key: 'canonPlayed', label: 'Canon Played' },
  { key: 'nonCanonPlayed', label: 'Non-Canon Played' },
  { key: 'favGame', label: 'Favorite Game' },
  { key: 'leastFavGame', label: 'Least Favorite Game' },
  { key: 'bestGame', label: 'Best Game' },
  { key: 'bestGameRetired', label: 'Best Game (Retired)' },
  { key: 'region', label: 'Region' },
  { key: 'canonWins', label: 'Canon Wins' },
  { key: 'nonCanonWins', label: 'Non-Canon Wins' },
];
