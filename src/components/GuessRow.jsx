import { compareStats } from '../utils/gameLogic';
import TableCell from './TableCell';
import { gameArtByName } from '../data/icons';

export default function GuessRow({ guess, target }) {
  const feedback = compareStats(guess, target);
  const playerHead = `https://mc-heads.net/avatar/${encodeURIComponent(guess.name)}`;

  const getGameArt = (gameName) => {
    if (!gameName) return null;
    return gameArtByName[gameName] || null;
  };

  // Helper to determine tailwind classes based on logic
  const getBoxClass = (key) => {
    const stat = feedback[key];
    if (stat === "correct") return "bg-green-700";
    if (stat === "higher" || stat === "later") return "bg-orange-400 stat-higher"; 
    if (stat === "lower" || stat === "earlier") return "bg-orange-400 stat-lower";
    return "bg-gray-500";
  };

  return (
    <div className="flex gap-1 mb-1 text-white text-xs text-center align-middle">
    <TableCell
      width="w-36"
      content={guess.name}
      boxClass={getBoxClass('name')}
      iconSrc={playerHead}
      iconAlt={`${guess.name} head`}
      iconSize="h-6 w-6"
    />
      <TableCell width="w-32" content={guess.debut} boxClass={getBoxClass('debut')} />
      <TableCell width="w-16" content={guess.canonFinale} boxClass={getBoxClass('canonFinale')} />
      <TableCell width="w-16" content={guess.nonCanonFinale} boxClass={getBoxClass('nonCanonFinale')} />
      <TableCell width="w-16" content={guess.canonPlayed} boxClass={getBoxClass('canonPlayed')} />
      <TableCell width="w-16" content={guess.nonCanonPlayed} boxClass={getBoxClass('nonCanonPlayed')} />
      <TableCell
        width="w-32"
        content={guess.favGame || 'N/A'}
        boxClass={getBoxClass('favGame')}
        iconSrc={getGameArt(guess.favGame)}
        iconAlt={guess.favGame ? `${guess.favGame} icon` : ''}
      />
      <TableCell
        width="w-32"
        content={guess.leastFavGame || 'N/A'}
        boxClass={getBoxClass('leastFavGame')}
        iconSrc={getGameArt(guess.leastFavGame)}
        iconAlt={guess.leastFavGame ? `${guess.leastFavGame} icon` : ''}
      />
      <TableCell
        width="w-32"
        content={guess.bestGame}
        boxClass={getBoxClass('bestGame')}
        iconSrc={getGameArt(guess.bestGame)}
        iconAlt={guess.bestGame ? `${guess.bestGame} icon` : ''}
      />
      <TableCell
        width="w-32"
        content={guess.bestGameRetired}
        boxClass={getBoxClass('bestGameRetired')}
        iconSrc={getGameArt(guess.bestGameRetired)}
        iconAlt={guess.bestGameRetired ? `${guess.bestGameRetired} icon` : ''}
      />
      <TableCell width="w-16" content={guess.region || '?'} boxClass={getBoxClass('region')} />
      <TableCell width="w-16" content={guess.canonWins} boxClass={getBoxClass('canonWins')} />
      <TableCell width="w-16" content={guess.nonCanonWins} boxClass={getBoxClass('nonCanonWins')} />
    </div>
  );
}