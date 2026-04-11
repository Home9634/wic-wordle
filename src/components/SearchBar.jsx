import { useState } from 'react';
import { players } from '../data/players';

export default function SearchBar({ onGuess, disabledPlayers }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const availablePlayers = players
    .filter((player) => !disabledPlayers.includes(player.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  const visiblePlayers = availablePlayers.filter((player) =>
    player.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (playerName) => {
    onGuess(playerName);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative w-64">
      <input 
        className="w-full p-2 border border-gray-500 bg-gray-100 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-600"
        value={query} 
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onClick={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        placeholder="Type player name..."
      />
      {isOpen && (
        <div className="absolute w-full bg-white border border-gray-500 z-10 max-h-64 overflow-y-auto">
          {visiblePlayers.map(p => (
            <div 
              key={p.name} 
              className="p-2 cursor-pointer hover:bg-gray-200 text-gray-900"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(p.name);
              }}
            >
              <div className="flex items-center gap-2 w-full min-w-0">
                <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                  <img
                    src={`https://mc-heads.net/avatar/${encodeURIComponent(p.name)}`}
                    alt={`${p.name} head`}
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <span className="truncate">{p.name}</span>
              </div>
            </div>
          ))}
          {visiblePlayers.length === 0 && (
            <div className="p-2 text-gray-500">No players found</div>
          )}
        </div>
      )}
    </div>
  );
}