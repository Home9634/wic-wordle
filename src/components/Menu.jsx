import React from 'react';

export default function Menu({ onSelectMode }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      {/* Title / Logo Area */}
      <h1 className="text-4xl mb-8">WING IT WORDLE</h1>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        {/* Daily Mode Button */}
        <button 
          onClick={() => onSelectMode('daily')}
          className="p-4 border-2 hover:bg-white hover:text-black transition-colors cursor-pointer"
        >
          Daily Challenge
          <p className="text-xs mt-1">New player every 24h (NOT WORKING RN)</p>
        </button>

        {/* Quick Play Button */}
        <button 
          onClick={() => onSelectMode('quick')}
          className="p-4 border-2 hover:bg-white hover:text-black transition-colors cursor-pointer"
        >
          Quick Play
          <p className="text-xs mt-1">Infinite random players</p>
        </button>
      </div>

      {/* Footer / Credits */}
      <footer className="mt-12 text-sm opacity-50">
        <p>Absolute Wing It</p>
        <p style={{ fontSize: '6px' }}>You should go play HSTCG</p>
      </footer>
    </div>
  );
}