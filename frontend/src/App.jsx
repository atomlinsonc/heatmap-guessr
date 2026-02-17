import React from 'react';
import { useGame } from './hooks/useGame.js';
import Header from './components/Header.jsx';
import Heatmap from './components/Heatmap.jsx';
import CluePanel from './components/CluePanel.jsx';
import GuessInput from './components/GuessInput.jsx';
import GuessHistory from './components/GuessHistory.jsx';
import GameOver from './components/GameOver.jsx';
import Loader from './components/Loader.jsx';
import './App.css';

export default function App() {
  const game = useGame();

  if (game.loading) return <Loader />;

  if (game.error) {
    return (
      <div className="app">
        <Header />
        <div className="error-state">
          <p>Failed to load today's puzzle.</p>
          <button className="btn-primary" onClick={game.retry}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header dateKey={game.dateKey} />

      <main className="game-area">
        <Heatmap seasons={game.puzzle?.heatmap?.seasons ?? []} />

        <div className="game-sidebar">
          <CluePanel clues={game.puzzle?.clues ?? {}} attemptsUsed={game.attemptsUsed} />

          {game.isOver ? (
            <GameOver
              won={game.won}
              answer={game.answer}
              attemptsUsed={game.attemptsUsed}
              guesses={game.guesses}
              onShare={game.share}
              shareText={game.shareText}
            />
          ) : (
            <>
              <GuessInput
                titles={game.titles}
                guesses={game.guesses}
                onGuess={game.submitGuess}
                disabled={game.submitting}
                attemptsUsed={game.attemptsUsed}
              />
              <GuessHistory guesses={game.guesses} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
