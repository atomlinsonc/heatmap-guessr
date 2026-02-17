import React, { useState } from 'react';
import './GameOver.css';

export default function GameOver({ won, answer, attemptsUsed, guesses, onShare, shareText }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    await onShare();
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className={`game-over ${won ? 'game-over--win' : 'game-over--loss'}`}>
      <div className="game-over-emoji" aria-hidden="true">
        {won ? '🎉' : '📺'}
      </div>

      <h2 className="game-over-headline">
        {won
          ? attemptsUsed === 1
            ? 'First try!'
            : `Got it in ${attemptsUsed}!`
          : 'Better luck tomorrow'}
      </h2>

      {!won && (
        <p className="game-over-answer">
          The answer was <strong>{answer}</strong>
        </p>
      )}

      {won && (
        <p className="game-over-answer">
          <strong>{answer}</strong>
        </p>
      )}

      <div className="game-over-stats">
        <div className="stat">
          <span className="stat-value">{attemptsUsed}</span>
          <span className="stat-label">{attemptsUsed === 1 ? 'Guess' : 'Guesses'}</span>
        </div>
        <div className="stat">
          <span className="stat-value">{won ? '✓' : '✗'}</span>
          <span className="stat-label">Result</span>
        </div>
      </div>

      <button className="btn-share" onClick={handleShare}>
        {copied ? '✓ Copied!' : 'Share result'}
      </button>

      {shareText && copied && (
        <pre className="share-preview">{shareText}</pre>
      )}

      <p className="next-puzzle-hint">New puzzle at midnight Chicago time</p>
    </div>
  );
}
