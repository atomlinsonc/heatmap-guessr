import React, { useState, useRef, useMemo, useCallback } from 'react';
import { normalizeTitle } from '../utils/normalize.js';
import './GuessInput.css';

const MAX_GUESSES = 5;

export default function GuessInput({ titles, guesses, onGuess, disabled, attemptsUsed }) {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef(null);

  const guessedIds = useMemo(
    () => new Set(guesses.map((g) => normalizeTitle(g.title))),
    [guesses]
  );

  const suggestions = useMemo(() => {
    if (!inputValue.trim()) return [];
    const norm = normalizeTitle(inputValue);
    return titles
      .filter((t) => {
        if (guessedIds.has(normalizeTitle(t.title))) return false;
        const matchTitle = normalizeTitle(t.title).includes(norm);
        const matchAlias = (t.aliases ?? []).some((a) => normalizeTitle(a).includes(norm));
        return matchTitle || matchAlias;
      })
      .slice(0, 8);
  }, [inputValue, titles, guessedIds]);

  const select = useCallback(
    (title) => {
      setInputValue('');
      setShowDropdown(false);
      setActiveIdx(-1);
      onGuess(title);
    },
    [onGuess]
  );

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        select(suggestions[activeIdx].title);
      } else if (suggestions.length === 1) {
        select(suggestions[0].title);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const remaining = MAX_GUESSES - attemptsUsed;

  return (
    <div className="guess-input-wrapper">
      <div className="guess-meta">
        <span className="guess-remaining">
          {remaining} guess{remaining !== 1 ? 'es' : ''} remaining
        </span>
        <div className="guess-pips">
          {Array.from({ length: MAX_GUESSES }, (_, i) => (
            <span
              key={i}
              className={`pip ${
                i < attemptsUsed
                  ? guesses[i]?.correct
                    ? 'pip--win'
                    : 'pip--miss'
                  : 'pip--open'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="guess-input-row">
        <div className="autocomplete-container">
          <input
            ref={inputRef}
            type="text"
            className="guess-input"
            placeholder="Search for a TV series…"
            value={inputValue}
            disabled={disabled}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowDropdown(true);
              setActiveIdx(-1);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            onKeyDown={handleKeyDown}
            aria-autocomplete="list"
            aria-haspopup="listbox"
            aria-expanded={showDropdown && suggestions.length > 0}
          />

          {showDropdown && suggestions.length > 0 && (
            <ul className="autocomplete-dropdown" role="listbox">
              {suggestions.map((t, i) => (
                <li
                  key={t.id}
                  className={`autocomplete-item ${i === activeIdx ? 'autocomplete-item--active' : ''}`}
                  role="option"
                  aria-selected={i === activeIdx}
                  onMouseDown={() => select(t.title)}
                >
                  {t.title}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {guesses.length === 0 && !inputValue && (
        <p className="guess-hint">Type to search all {titles.length} shows</p>
      )}
    </div>
  );
}
