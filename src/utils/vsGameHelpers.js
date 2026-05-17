export const getRoundMetric = (result, scoreMode) => {
  if (!result) return Number.POSITIVE_INFINITY;
  return scoreMode === 'guesses' ? result.guessCount : result.timeMs;
};

export const getMatchWinner = (roundStates, scoreMode) => {
  let localScore = 0;
  let opponentScore = 0;

  roundStates.forEach((round) => {
    if (round.winner === 'local') localScore += 1;
    if (round.winner === 'opponent') opponentScore += 1;
  });

  if (localScore === opponentScore) {
    const localTieBreak = roundStates.reduce((sum, round) => sum + getRoundMetric(round.localResult, scoreMode), 0);
    const opponentTieBreak = roundStates.reduce((sum, round) => sum + getRoundMetric(round.opponentResult, scoreMode), 0);

    return {
      outcome: localTieBreak === opponentTieBreak ? 'draw' : localTieBreak < opponentTieBreak ? 'local' : 'opponent',
      localScore,
      opponentScore,
    };
  }

  return {
    outcome: localScore > opponentScore ? 'local' : 'opponent',
    localScore,
    opponentScore,
  };
};
