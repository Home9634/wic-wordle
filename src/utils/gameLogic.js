import { players } from '../data/players';
import { eventOrder } from '../data/events';
import { gameTypeByName } from '../data/gameCategories';

export const getDailyPlayer = () => {
  const startDate = new Date('2023-12-01').getTime(); // Set your start date
  const today = new Date().setHours(0, 0, 0, 0);
  const diff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
  return players[diff % players.length];
};

export const getRandomPlayer = () => {
  return players[Math.floor(Math.random() * players.length)];
};

const statKeys = [
  'name',
  'debut',
  'canonFinale',
  'nonCanonFinale',
  'canonPlayed',
  'nonCanonPlayed',
  'favGame',
  'leastFavGame',
  'bestGame',
  'bestGameRetired',
  'region',
  'canonWins',
  'nonCanonWins'
];

const gameStatKeys = ['favGame', 'leastFavGame', 'bestGame', 'bestGameRetired'];

const areGamesInSameCategory = (guessGame, targetGame) => {
  if (!guessGame || !targetGame) return false;

  const guessType = gameTypeByName[guessGame];
  const targetType = gameTypeByName[targetGame];

  return Boolean(guessType && targetType && guessType === targetType);
};

export const compareStats = (guess, target) => {
  const feedback = {};

  statKeys.forEach(key => {
    if (guess[key] === target[key]) {
      feedback[key] = "correct";
    } else if (typeof target[key] === 'number') {
      const difference = Math.abs(guess[key] - target[key]);
      if (difference <= 2) {
        feedback[key] = guess[key] < target[key] ? 'close-higher' : 'close-lower';
      } else {
        feedback[key] = 'wrong';
      }
    } else if (gameStatKeys.includes(key)) {
      feedback[key] = areGamesInSameCategory(guess[key], target[key]) ? 'close' : 'wrong';
    } else if (key === 'debut') {
      const guessIdx = eventOrder.indexOf(guess[key]);
      const targetIdx = eventOrder.indexOf(target[key]);
      if (guessIdx === -1 || targetIdx === -1) {
        feedback[key] = 'wrong';
      } else {
        const difference = Math.abs(guessIdx - targetIdx);
        if (difference <= 2) {
          feedback[key] = guessIdx < targetIdx ? 'close-higher' : 'close-lower';
        } else {
          feedback[key] = guessIdx < targetIdx ? 'later' : 'earlier';
        }
      }
    } else {
      feedback[key] = "wrong";
    }
  });

  return feedback;
};