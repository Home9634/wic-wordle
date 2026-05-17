import CategoryHeaderCell from './CategoryHeaderCell';
import GuessRow from './GuessRow';

const CATEGORIES = [
  "Player", "Debut", "Canon Finales", "Non-Canon Finales", "Canon Played",
  "Non-Canon Played", "Favorite Game", "Least Favorite Game", "Best Game",
  "Best Game (Retired)", "Region", "Canon Wins", "Non-Canon Wins"
];

export default function GuessTable({ guesses, target, visibleStats = null }) {
  // If visibleStats is provided (VS Mode), we filter columns. 
  // If not (Single Player), we show everything.
  const isVisible = (cat) => {
    if (!visibleStats) return true;
    if (cat === "Player") {
      return true; // Always show player name
    }
    // Map human category names to the internal keys used in settings
    const mapping = {
      "Player": "name", "Debut": "debut", "Canon Finales": "canonFinale",
      "Non-Canon Finales": "nonCanonFinale", "Canon Played": "canonPlayed",
      "Non-Canon Played": "nonCanonPlayed", "Favorite Game": "favGame",
      "Least Favorite Game": "leastFavGame", "Best Game": "bestGame",
      "Best Game (Retired)": "bestGameRetired", "Region": "region",
      "Canon Wins": "canonWins", "Non-Canon Wins": "nonCanonWins"
    };
    return visibleStats.includes(mapping[cat]);
  };

  return (
    <div className="w-full overflow-x-auto mt-8">
      <div className="w-max mx-auto">
        {/* Header Row */}
        <div className="flex gap-1 mb-1 text-white text-xs text-center">
          {CATEGORIES.map((cat, i) => isVisible(cat) && (
            <CategoryHeaderCell
              key={i}
              category={cat}
              width={cat === "Player" ? "w-36" : cat.includes('Game') || cat.includes("Debut") ? "w-32" : "w-16"}
              boxClass={cat === "Player" ? "bg-gray-700" : "bg-gray-600"}
            />
          ))}
        </div>

        {/* Guess Rows */}
        {guesses.map((g, i) => (
          <GuessRow 
            key={`${g.name}-${i}`} 
            guess={g} 
            target={target} 
            visibleStats={visibleStats} 
          />
        ))}
        
        {guesses.length === 0 && (
          <div className="px-3 py-10 text-center text-xs text-white/30 border border-dashed border-white/10 rounded-xl">
            No guesses yet...
          </div>
        )}
      </div>
    </div>
  );
}