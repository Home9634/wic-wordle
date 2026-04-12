import { useMemo, useState } from 'react';
import { players } from '../data/players';
import { getDailyPlayer, getRandomPlayer } from '../utils/gameLogic';
import { gameTypeByName } from '../data/gameCategories';
import SearchBar from './SearchBar';
import GuessRow from './GuessRow';
import CategoryHeaderCell from './CategoryHeaderCell';

export default function Game({ mode, onBack }) {
  const [guesses, setGuesses] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [roundSeed, setRoundSeed] = useState(0);
  const target = useMemo(() => {
    return mode === 'daily' ? getDailyPlayer() : getRandomPlayer();
  }, [mode, roundSeed]);
  const handlePlayAgain = () => {
    setGuesses([]);
    setGameOver(false);
    if (mode === 'quick') {
      setRoundSeed(prev => prev + 1);
    }
  };
  const gameCategoryRows = useMemo(() => {
    return Object.entries(gameTypeByName).sort(([gameA, categoryA], [gameB, categoryB]) => {
      const byCategory = categoryA.localeCompare(categoryB);
      if (byCategory !== 0) return byCategory;
      return gameA.localeCompare(gameB);
    });
  }, []);
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

      {gameOver ? (
        <div className="text-center">
          <p className="text-base text-white mb-4">You Got It In {guesses.length} Guesses!</p>
          <button className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded cursor-pointer" onClick={handlePlayAgain}>
            Play Again
          </button>
        </div>
      ) : (
        <>
          <SearchBar onGuess={handleGuess} disabledPlayers={guesses.map(g => g.name)} />
          <p className="mt-3 text-xs text-gray-300 text-center">
            Hover or hold on a category header to see details about what that category and its values mean.
          </p>
        </>
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

      <div className="mt-6 w-full max-w-3xl rounded-md border border-gray-600 bg-gray-800/70 p-3 text-xs text-gray-100">
        <p className="font-semibold">How to read colors</p>
        <ul className="mt-2 list-disc list-inside space-y-1 text-gray-200">
          <li>Green: exact match.</li>
          <li>Orange: close match.</li>
          <li>Gray: not a close match.</li>
        </ul>

        <p className="mt-3 font-semibold">Orange rules</p>
        <ul className="mt-1 list-disc list-inside space-y-1 text-gray-200">
          <li>Number stats: orange when your guess is within ±2 of the target value.</li>
          <li>Debut: orange when your guess is within ±2 events (both canon and non-canon included) of the target debut.</li>
          <li>Game stats: orange when guessed and target games are in the same category.</li>
        </ul>

        <p className="mt-3 font-semibold">Game categories</p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[420px] border border-gray-600 text-left text-xs">
            <thead className="bg-gray-700 text-gray-100">
              <tr>
                <th className="p-2 border-b border-gray-600">Game</th>
                <th className="p-2 border-b border-gray-600">Category</th>
              </tr>
            </thead>
            <tbody>
              {gameCategoryRows.map(([gameName, category]) => (
                <tr key={gameName} className="odd:bg-gray-800 even:bg-gray-700/60">
                  <td className="p-2 border-b border-gray-700 text-gray-100">{gameName}</td>
                  <td className="p-2 border-b border-gray-700 text-gray-200">{category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}