import { players } from '../data/players';
import { eventOrder } from '../data/events';

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

export const compareStats = (guess, target) => {
  const feedback = {};

  statKeys.forEach(key => {
    if (guess[key] === target[key]) {
      feedback[key] = "correct";
    } else if (typeof target[key] === 'number') {
      feedback[key] = guess[key] < target[key] ? "higher" : "lower";
    } else if (key === 'debut') {
      const guessIdx = eventOrder.indexOf(guess[key]);
      const targetIdx = eventOrder.indexOf(target[key]);
      feedback[key] = guessIdx < targetIdx ? "later" : "earlier";
    } else {
      feedback[key] = "wrong";
    }
  });

  return feedback;
};