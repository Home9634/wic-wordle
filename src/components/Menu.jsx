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
          <p className="text-xs mt-1">New player every 24h</p>
        </button>

        {/* Quick Play Button */}
        <button
          onClick={() => onSelectMode('quick')}
          className="p-4 border-2 hover:bg-white hover:text-black transition-colors cursor-pointer"
        >
          Quick Play
          <p className="text-xs mt-1">Infinite random players</p>
        </button>

        <button
          onClick={() => onSelectMode('vs')}
          className="p-4 border-2 hover:bg-white hover:text-black transition-colors cursor-pointer"
        >
          VS Mode
          <p className="text-xs mt-1">1v1 challenge prototype</p>
        </button>

        {/* Toby Mode Button */}
        <button
          onClick={() => onSelectMode('toby')}
            className="w-1/2 self-center px-3 py-2 border-2 hover:bg-white hover:text-black transition-colors cursor-pointer"
        >
            <span className="text-sm">Toby</span>
            <p className="text-[10px] mt-1 leading-tight">Toby Tobfoolery</p>
        </button>

      </div>

      {/* Footer / Credits */}
      <footer className="mt-12 text-sm opacity-50">
        <p>Absolute Wing It</p>
        <a href="https://hstcg.netlify.app/" target="_blank" rel="noopener noreferrer" className="m-0" style={{ fontSize: '7px' }}>
          You should go play HSTCG
        </a>
      </footer>
    </div>
  );
}