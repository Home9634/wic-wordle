import { useState } from 'react';
import Menu from './components/Menu';
import Game from './components/Game';

export default function App() {
  const [mode, setMode] = useState('menu'); // menu, daily, quick

  return (
    <div className="min-h-screen font-minecraft"> 
      {mode === 'menu' ? (
        <Menu onSelectMode={setMode} />
      ) : (
        <Game mode={mode} onBack={() => setMode('menu')} />
      )}
    </div>
  );
}