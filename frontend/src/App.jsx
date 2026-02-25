import React, { useState } from 'react';
import { useGame } from './hooks/useGame.js';
import Header from './components/Header.jsx';
import Heatmap from './components/Heatmap.jsx';
import CluePanel from './components/CluePanel.jsx';
import GuessInput from './components/GuessInput.jsx';
import GuessHistory from './components/GuessHistory.jsx';
import GameOver from './components/GameOver.jsx';
import Loader from './components/Loader.jsx';
import PastGames from './components/PastGames.jsx';
import PastGameView from './components/PastGameView.jsx';
import './App.css';

export default function App() {
  const game = useGame();
  const [view, setView] = useState('today'); // 'today' | 'archive' | 'past-game'
  const [selectedDateKey, setSelectedDateKey] = useState(null);

  function handleSelectGame(dateKey) {
    setSelectedDateKey(dateKey);
    setView('past-game');
  }

  if (game.loading) return <Loader />;

  // Past Games archive list
  if (view === 'archive') {
    return (
      <div className="app">
        <PastGames
          onSelectGame={handleSelectGame}
          onClose={() => setView('today')}
        />
      </div>
    );
  }

  // Individual past game replay
  if (view === 'past-game' && selectedDateKey) {
    return (
      <div className="app">
        <Header onPastGames={() => setView('archive')} />
        <PastGameView
          dateKey={selectedDateKey}
          titles={game.titles}
          onBack={() => setView('archive')}
        />
      </div>
    );
  }

  // Today's game (default)
  if (game.error) {
    return (
      <div className="app">
        <Header onPastGames={() => setView('archive')} />
        <div className="error-state">
          <p>Failed to load today's puzzle.</p>
          <button className="btn-primary" onClick={game.retry}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header dateKey={game.dateKey} onPastGames={() => setView('archive')} />

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
