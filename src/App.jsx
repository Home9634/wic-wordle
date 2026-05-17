import { useState } from 'react';
import Menu from './components/Menu';
import Game from './components/Game';
import VsMode from './components/VsMode';

export default function App() {
  const [mode, setMode] = useState('menu'); // menu, daily, toby, quick, vs

  return (
    <div className="min-h-screen font-minecraft"> 
      {mode === 'menu' ? (
        <Menu onSelectMode={setMode} />
      ) : mode === 'vs' ? (
        <VsMode onBack={() => setMode('menu')} />
      ) : (
        <Game mode={mode} onBack={() => setMode('menu')} />
      )}
    </div>
  );
}