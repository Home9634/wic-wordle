import { useEffect, useMemo, useState } from 'react';
import { findPlayerByNameOrAlias, getDailyPlayer, getRandomPlayer } from '../utils/gameLogic';
import { eventOrder } from '../data/events';
import { gameTypeByName } from '../data/gameCategories';
import SearchBar from './SearchBar';
import GuessRow from './GuessRow';
import CategoryHeaderCell from './CategoryHeaderCell';

const DAILY_START_DATE = new Date(Date.UTC(2026, 4, 2));

const getUtcDateKey = (date) => [
  date.getUTCFullYear(),
  String(date.getUTCMonth() + 1).padStart(2, '0'),
  String(date.getUTCDate()).padStart(2, '0')
].join('-');

const getDaySuffix = (day) => {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

const formatDailyLabel = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  });

  const parts = formatter.formatToParts(date);
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  const dayValue = Number(parts.find((part) => part.type === 'day')?.value ?? 1);
  const year = parts.find((part) => part.type === 'year')?.value ?? '';

  return `${month} ${dayValue}${getDaySuffix(dayValue)} ${year}`;
};

const getDailyDayNumber = (date = new Date()) => {
  const startDateStamp = Date.UTC(
    DAILY_START_DATE.getFullYear(),
    DAILY_START_DATE.getMonth(),
    DAILY_START_DATE.getDate()
  );
  const currentDateStamp = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const diff = Math.floor((currentDateStamp - startDateStamp) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff + 1);
};

export default function Game({ mode, onBack }) {
  const [guesses, setGuesses] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [roundSeed, setRoundSeed] = useState(0);
  const [dailyHydrated, setDailyHydrated] = useState(false);

  const dailyStorageKey = `wic-wordle-daily-${getUtcDateKey(new Date())}`;
  const now = new Date();
  const dailyDayLabel = `Day ${getDailyDayNumber(now)} - ${formatDailyLabel(now)}`;

  const target = useMemo(() => {
    if (mode === 'daily') {
      return getDailyPlayer();
    }

    void roundSeed;
    return getRandomPlayer();
  }, [mode, roundSeed]);

  useEffect(() => {
    if (mode !== 'daily') {
      setDailyHydrated(false);
      setGuesses([]);
      setGameOver(false);
      return;
    }

    setDailyHydrated(false);

    try {
      const savedState = localStorage.getItem(dailyStorageKey);
      if (!savedState) {
        setGuesses([]);
        setGameOver(false);
        setDailyHydrated(true);
        return;
      }

      const parsedState = JSON.parse(savedState);
      const savedGuesses = Array.isArray(parsedState.guessNames)
        ? parsedState.guessNames
            .map((guessName) => findPlayerByNameOrAlias(guessName))
            .filter(Boolean)
        : [];

      setGuesses(savedGuesses);
      setGameOver(Boolean(parsedState.gameOver));
    } catch {
      setGuesses([]);
      setGameOver(false);
    } finally {
      setDailyHydrated(true);
    }
  }, [dailyStorageKey, mode]);

  useEffect(() => {
    if (mode !== 'daily' || !dailyHydrated) return;

    localStorage.setItem(
      dailyStorageKey,
      JSON.stringify({
        guessNames: guesses.map((guess) => guess.name),
        gameOver
      })
    );
  }, [dailyHydrated, dailyStorageKey, gameOver, guesses, mode]);

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
    const player = findPlayerByNameOrAlias(playerName);
    if (!player || !target || guesses.find(g => g.name === playerName)) return;

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
      {mode === 'daily' && (
        <p className="-mt-2 mb-3 text-sm text-gray-300">
          {dailyDayLabel}
        </p>
      )}

      {gameOver ? (
        <div className="text-center">
          <p className="text-base text-white mb-4">You Got It In {guesses.length} Guesses!</p>
          {mode === 'daily' ? (
            <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded cursor-pointer" onClick={() => {}}>
              Share
            </button>
          ) : (
            <button className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded cursor-pointer" onClick={handlePlayAgain}>
              Play Again
            </button>
          )}
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

      <div className="mt-6 w-full max-w-5xl rounded-md border border-gray-600 bg-gray-800/70 p-2.5 text-xs text-gray-100">
        <div className="text-center">
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
            <li>Favorite Game and Least Favorite Game: orange when guessed and target games are in the same category.</li>
            <li>Best Game and Best Game (Retired): compare against the target player's full best-game set; green if your guess appears anywhere in that set, orange if it matches the category of any target best game.</li>
          </ul>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(220px,0.7fr)] xl:items-start">
          <div>
            <p className="mb-2 text-center font-semibold">Game categories</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-105 border border-gray-600 text-left text-xs">
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

          <div>
            <p className="mb-2 text-center font-semibold">Event order</p>
            <div className="mx-auto max-w-xs overflow-x-auto">
              <table className="w-full min-w-44 border border-gray-600 text-left text-xs">
                <thead className="bg-gray-700 text-gray-100">
                  <tr>
                    <th className="p-2 border-b border-gray-600 text-center">Event</th>
                  </tr>
                </thead>
                <tbody>
                  {eventOrder.map((eventName) => (
                    <tr key={eventName} className="odd:bg-gray-800 even:bg-gray-700/60">
                      <td className="px-3 py-1.5 border-b border-gray-700 text-center text-gray-100">{eventName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}