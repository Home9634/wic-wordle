import { useEffect, useState } from 'react';
import StatSelector from './StatSelector';
import Tooltip from './Tooltip';

export default function VsHome({
  state,
  visibleStats,
  onBackToMenu,
  onNicknameChange,
  onJoinCodeChange,
  onViewChange,
  onUpdateSettings,
  onCreateLobby,
  onJoinLobby,
  onStartMatch,
  onResetSession,
}) {
  const [roundsInput, setRoundsInput] = useState(String(state.settings.rounds ?? 3));

  useEffect(() => {
    setRoundsInput(String(state.settings.rounds ?? 3));
  }, [state.settings.rounds]);

  const normalizeRounds = () => {
    const parsed = Number.parseInt(roundsInput, 10);
    const nextRounds = Number.isFinite(parsed) ? Math.min(9, Math.max(1, parsed)) : 3;
    setRoundsInput(String(nextRounds));
    onUpdateSettings({ rounds: nextRounds });
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] px-4 py-8 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex justify-center">
          <button className="bg-slate-500 hover:bg-slate-600 text-white py-2 px-4 rounded cursor-pointer" onClick={onBackToMenu}>
            Back to Menu
          </button>
        </div>
        <h2 className="text-center text-xl">VS Mode</h2>

        <div className="rounded-4xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <div className="space-y-5">
              <div>
                <h1 className="text-4xl font-black tracking-tight">Wing It Wordle VS</h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">
                  Challenge a friend in a 1v1 Wing It Wordle race.
                </p>
              </div>

              <label className="block rounded-2xl border border-white/10 bg-black/25 p-4">
                <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/55">Nickname</span>
                <input
                  value={state.nickname}
                  onChange={onNicknameChange}
                  placeholder="Enter your nickname"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-cyan-300/50"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={onCreateLobby}
                  className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-4 text-left hover:bg-emerald-500/15 cursor-pointer"
                >
                  <div className="text-lg font-semibold">Create lobby</div>
                  <p className="mt-1 text-sm text-white/60">Generate a 3-digit code and host the match.</p>
                </button>

                <button
                  type="button"
                  onClick={() => onViewChange('join')}
                  className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-4 text-left hover:bg-cyan-500/15 cursor-pointer"
                >
                  <div className="text-lg font-semibold">Join lobby</div>
                  <p className="mt-1 text-sm text-white/60">Enter a code from a friend.</p>
                </button>
              </div>

              {state.view === 'lobby' ? (
                <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold">Lobby {state.lobbyCode || '---'}</h2>
                      <p className="text-sm text-white/55">
                        {state.isHost ? 'You are the host.' : 'You joined as challenger.'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                      <div className="text-xs uppercase tracking-[0.25em] text-white/45">Status</div>
                      <div className="text-sm font-semibold">{state.connectionState}</div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-white/45">You</div>
                      <div className="mt-1 text-lg font-semibold">{state.nickname || 'Unnamed user'}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-white/45">Opponent</div>
                      <div className="mt-1 text-lg font-semibold">{state.opponentNickname || 'Waiting...'}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {state.isHost ? (
                      <button
                        type="button"
                        onClick={onStartMatch}
                        disabled={state.connectionState !== 'connected'}
                        className="rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-black hover:bg-emerald-400 disabled:opacity-50 cursor-pointer"
                      >
                        Start match
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={onResetSession}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold hover:bg-white/10 cursor-pointer"
                    >
                      Leave lobby
                    </button>
                  </div>
                </div>
              ) : state.view === 'join' ? (
                <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                  <h2 className="text-xl font-semibold">Join lobby</h2>
                  <p className="mt-2 text-sm text-white/55">Enter the 3-digit code shared by the host.</p>
                  <input
                    value={state.joinCode}
                    onChange={onJoinCodeChange}
                    placeholder="123"
                    inputMode="numeric"
                    maxLength={3}
                    className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 tracking-[0.35em] text-center text-2xl outline-none placeholder:text-white/30 focus:border-cyan-300/50"
                  />
                  <button
                    type="button"
                    onClick={onJoinLobby}
                    className="mt-4 w-full rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-black hover:bg-cyan-400 cursor-pointer"
                  >
                    Join
                  </button>
                </div>
              ) : state.statusMessage ? (
                <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/75">
                  {state.statusMessage}
                </div>
              ) : null}
            </div>

            <div className="space-y-5">
              {state.view === 'lobby' ? (
                <>
                  <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-semibold">Lobby settings</h2>
                        <p className="text-sm text-white/55">Defaults are saved locally and can be changed by the host.</p>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="block rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="block text-xs uppercase tracking-[0.2em] text-white/50">Match mode</span>
                          <Tooltip
                            title="Match mode"
                            description="'Round' waits for each player to finish the round to continue. 'Continuous' lets players go through each round on their own time."
                          />
                        </div>
                        <div className="relative">
                          <select
                            value={state.settings.matchMode}
                            disabled={!state.isHost}
                            onChange={(event) => onUpdateSettings({ matchMode: event.target.value })}
                            className="w-full appearance-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 pr-8 outline-none disabled:opacity-50"
                          >
                            <option value="round">Round</option>
                            <option value="continuous">Continuous</option>
                          </select>
                          <svg className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </label>

                      <label className="block rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="block text-xs uppercase tracking-[0.2em] text-white/50">Score mode</span>
                          <Tooltip
                            title="Score mode"
                            description="'Time' ranks by time to solve; 'Guesses' ranks by fewest guesses. Affects how rounds are decided."
                          />
                        </div>
                        <div className="relative">
                          <select
                            value={state.settings.scoreMode}
                            disabled={!state.isHost}
                            onChange={(event) => onUpdateSettings({ scoreMode: event.target.value })}
                            className="w-full appearance-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 pr-8 outline-none disabled:opacity-50"
                          >
                            <option value="time">Time</option>
                            <option value="guesses">Guesses</option>
                          </select>
                          <svg className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </label>

                      <label className="block rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="block text-xs uppercase tracking-[0.2em] text-white/50">Rounds</span>
                          <Tooltip
                            title="Rounds"
                            description="Number of rounds in this match (1–9)."
                          />
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="3"
                          value={roundsInput}
                          disabled={!state.isHost}
                          onChange={(event) => setRoundsInput(event.target.value)}
                          onBlur={normalizeRounds}
                          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 outline-none disabled:opacity-50"
                        />
                      </label>

                      <label className="block rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="block text-xs uppercase tracking-[0.2em] text-white/50">
                            {state.settings.scoreMode === 'time' ? 'Cooldown between guesses' : 'Time limit per round'}
                          </span>
                          <Tooltip
                            title={state.settings.scoreMode === 'time' ? 'Cooldown between guesses' : 'Time limit per round'}
                            description={state.settings.scoreMode === 'time'
                              ? 'Seconds to wait between allowed guesses when using Time score mode.'
                              : 'Maximum seconds allowed to solve each round when using Time Limit mode.'
                            }
                          />
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={state.settings.scoreMode === 'time' ? state.settings.cooldownSeconds : state.settings.timeLimitSeconds}
                          disabled={!state.isHost}
                          onChange={(event) => onUpdateSettings(
                            state.settings.scoreMode === 'time'
                              ? { cooldownSeconds: Number(event.target.value) }
                              : { timeLimitSeconds: Number(event.target.value) }
                          )}
                          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 outline-none disabled:opacity-50"
                        />
                      </label>
                    </div>
                  </div>

                  <StatSelector
                    value={visibleStats}
                    onChange={(nextStats) => onUpdateSettings({ visibleStats: nextStats })}
                    disabled={!state.isHost}
                  />
                </>
              ) : state.view === 'home' ? (
                <div className="rounded-3xl border border-white/10 bg-black/25 p-5 text-sm text-white/60">
                  Create a private room or join one by code.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
