/**
 * Maps Google Sheet column names to player object properties
 * Update the keys to match your actual sheet column headers
 */
export const playerColumnMap = {
  "Player": "name",
  "Debut Event": "debut",
  "Canon Finale Appearances": "canonFinale",
  "Non Canon Finale Appearances": "nonCanonFinale",
  "Canon Events Played": "canonPlayed",
  "Non Canon Events Played": "nonCanonPlayed",
  "Favourite Game": "favGame",
  "Least Favourite Game": "leastFavGame",
  "Best Performing Game": "bestGame",
  "Best Performing Game (w/ Retired)": "bestGameRetired",
  "Region?": "region",
  "Canon Wins": "canonWins",
  "Non Canon Wins": "nonCanonWins",
  "Aliases": "aliases"
};

/**
 * Fields that should be converted to numbers
 */
export const numericFields = new Set([
  "canonFinale",
  "nonCanonFinale",
  "canonPlayed",
  "nonCanonPlayed",
  "canonWins",
  "nonCanonWins"
]);

/**
 * Fields where empty string should become undefined instead
 */
export const undefinedFields = new Set([
  "favGame",
  "leastFavGame",
  "bestGame",
  "bestGameRetired",
  "region",
  "aliases"
]);
