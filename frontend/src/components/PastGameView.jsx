import React from 'react';
import { usePastGame } from '../hooks/usePastGame.js';
import Heatmap from './Heatmap.jsx';
import CluePanel from './CluePanel.jsx';
import GuessInput from './GuessInput.jsx';
import GuessHistory from './GuessHistory.jsx';
import GameOver from './GameOver.jsx';
import Loader from './Loader.jsx';
import './PastGameView.css';

function formatDate(dateKey) {
  const [y, m, d] = dateKey.split('-');
  const date = new Date(Date.UTC(+y, +m - 1, +d));
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export default function PastGameView({ dateKey, titles, onBack }) {
  const game = usePastGame(dateKey);

  return (
    <div className="past-game-view">
      <div className="past-game-view-header">
        <button className="past-game-back" onClick={onBack}>
          ← Back to Past Games
        </button>
        <span className="past-game-date-label">{formatDate(dateKey)}</span>
      </div>

      {game.loading && <Loader />}

      {game.error && (
        <div className="past-game-error">
          <p>Failed to load this puzzle.</p>
        </div>
      )}

      {!game.loading && !game.error && game.puzzle && (
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
                isPastGame
              />
            ) : (
              <>
                {/* Show the answer as a reveal strip, since it's a past game */}
                <div className="past-game-answer-reveal">
                  <span className="past-game-answer-label">Answer:</span>
                  <span className="past-game-answer-value">{game.answer}</span>
                  <span className="past-game-answer-hint">Try to guess it first! →</span>
                </div>
                <GuessInput
                  titles={titles}
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
      )}
    </div>
  );
}
