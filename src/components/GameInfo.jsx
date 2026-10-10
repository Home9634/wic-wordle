import React from 'react';

export default function GameInfo({ gameCategoryRows, eventOrder }) {
  return (
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
  );
}
