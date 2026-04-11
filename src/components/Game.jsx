import { useMemo, useState } from 'react';
import { players } from '../data/players';
import { getDailyPlayer, getRandomPlayer } from '../utils/gameLogic';
import SearchBar from './SearchBar';
import GuessRow from './GuessRow';
import CategoryHeaderCell from './CategoryHeaderCell';

export default function Game({ mode, onBack }) {
  const [guesses, setGuesses] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const target = useMemo(() => {
    return mode === 'daily' ? getDailyPlayer() : getRandomPlayer();
  }, [mode]);
  const categories = [
    "Player",
    "Debut",
    "Canon Finales",
    "Non-Canon Finales",
    "Canon Played",
    "Non-Canon Played",
    "Favorite Game",
    "Least Favorite Game",
    "Best Game",
    "Best Game (Retired)",
    "Region",
    "Canon Wins",
    "Non-Canon Wins"
  ];

  const handleGuess = (playerName) => {
    const player = players.find(p => p.name === playerName);
    if (!player || guesses.find(g => g.name === playerName)) return;

    const newGuesses = [player, ...guesses];
    setGuesses(newGuesses);

    if (player.name === target.name) setGameOver(true);
  };

  return (
    <div className="flex flex-col items-center p-4">
      <button className="bg-slate-500 hover:bg-slate-600 text-white py-2 px-4 rounded cursor-pointer" onClick={onBack}>
        Back to Menu
      </button>
      <h2 className="text-xl my-4 capitalize">{mode} Mode</h2>

      {!gameOver && <SearchBar onGuess={handleGuess} disabledPlayers={guesses.map(g => g.name)} />}

      {!gameOver && (
        <p className="mt-3 text-xs text-gray-300 text-center">
          Hover or hold on a category header to see details about what that category and its values mean.
        </p>
      )}

      <div className="w-full overflow-x-auto mt-8">
        <div className="w-max mx-auto"> {/* Container for 13 columns */}
          <div className="flex gap-1 mb-1 text-white text-xs text-center"> {/* Header Row */}
            {categories.map((cat, i) => (
              <CategoryHeaderCell
                key={i}
                category={cat}
                width={cat === "Player" ? "w-36" : cat.includes('Game') || cat.includes("Debut") ? "w-32" : "w-16"}
                boxClass={cat === "Player" ? "bg-gray-700" : "bg-gray-600"}
              />
            ))}
          </div>

          {guesses.map((g, i) => (
            <GuessRow key={i} guess={g} target={target} />
          ))}
        </div>
      </div>
    </div>
  );
}