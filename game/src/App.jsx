import { useEffect, useReducer, useState } from 'react';
import { GAME_PHASE } from './constants.js';
import { gameReducer, initialState } from './gameState.js';
import { MainMenu } from './components/MainMenu.jsx';
import { ChapterTransition } from './components/ChapterTransition.jsx';
import { EndingScreen } from './components/EndingScreen.jsx';
import { GameOverScreen } from './components/GameOverScreen.jsx';
import { Chapter1Signal } from './components/chapter1/Chapter1Signal.jsx';
import { Chapter2Forest } from './components/chapter2/Chapter2Forest.jsx';
import { Chapter3Deterrence } from './components/chapter3/Chapter3Deterrence.jsx';
import { Chapter4Escape } from './components/chapter4/Chapter4Escape.jsx';
import { globalSfx, stopAllChapterAudio } from './audio/presets.js';
import { getMuted, setMuted, playTone } from './audio/synth.js';
import './styles/scenes.css';
import './styles/mobile.css';

export default function App({ onReady }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [muted, setMutedState] = useState(false);
  const [audioReady, setAudioReady] = useState(false);

  useEffect(() => {
    if (onReady) onReady();
  }, [onReady]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'm' || e.key === 'M') {
        const next = !getMuted();
        setMuted(next);
        setMutedState(next);
        playTone({ freq: next ? 880 : 220, duration: 0.06, type: 'sine', gain: 0.1 });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (state.phase === GAME_PHASE.MENU && audioReady) {
      globalSfx.menuEnter();
    }
  }, [state.phase, audioReady]);

  useEffect(() => {
    if (state.phase === GAME_PHASE.MENU || state.phase === GAME_PHASE.GAME_OVER) {
      stopAllChapterAudio();
    }
  }, [state.phase]);

  const startGame = () => {
    setAudioReady(true);
    globalSfx.click();
    dispatch({ type: 'START_GAME' });
  };

  const onChapterComplete = (chapter, score, nextChapter, nextVariant, gameOver) => {
    if (gameOver) {
      dispatch({ type: 'GAME_OVER', reason: gameOver.reason, chapter });
      return;
    }
    dispatch({ type: 'COMPLETE_CHAPTER', chapter, score });
    if (nextChapter) {
      dispatch({ type: 'BEGIN_TRANSITION', from: chapter, to: nextChapter });
    } else if (nextVariant) {
      dispatch({ type: 'BEGIN_TRANSITION', from: chapter, to: null });
      setTimeout(() => dispatch({ type: 'ENTER_ENDING', variant: nextVariant }), 2500);
    }
  };

  const onTransitionDone = (nextChapter) => {
    globalSfx.transition();
    if (nextChapter) dispatch({ type: 'ENTER_CHAPTER', chapter: nextChapter });
  };

  const restart = () => {
    stopAllChapterAudio();
    dispatch({ type: 'RESTART' });
  };

  return (
    <>
      <MuteIndicator muted={muted} />
      {state.phase === GAME_PHASE.MENU && (
        <MainMenu
          onStart={startGame}
          difficulty={state.difficulty}
          onDifficultyChange={(d) => dispatch({ type: 'SET_DIFFICULTY', difficulty: d })}
        />
      )}
      {state.phase === GAME_PHASE.GAME_OVER && (
        <GameOverScreen reason={state.gameOver.reason} onRestart={restart} />
      )}
      {state.phase === GAME_PHASE.TRANSITION && (
        <ChapterTransition
          from={state.transition.from}
          to={state.transition.to}
          onDone={() => onTransitionDone(state.transition.to)}
        />
      )}
      {state.phase === GAME_PHASE.CHAPTER_1 && (
        <Chapter1Signal
          difficulty={state.difficulty}
          onComplete={(score, go) => onChapterComplete(1, score, 2, null, go)}
        />
      )}
      {state.phase === GAME_PHASE.CHAPTER_2 && (
        <Chapter2Forest
          difficulty={state.difficulty}
          onComplete={(score, go) => onChapterComplete(2, score, 3, null, go)}
        />
      )}
      {state.phase === GAME_PHASE.CHAPTER_3 && (
        <Chapter3Deterrence
          difficulty={state.difficulty}
          onComplete={(score, go) => onChapterComplete(3, score, go ? null : 4, null, go)}
        />
      )}
      {state.phase === GAME_PHASE.CHAPTER_4 && (
        <Chapter4Escape
          difficulty={state.difficulty}
          onComplete={(score, go) => onChapterComplete(4, score, null, 'success', go)}
        />
      )}
      {state.phase === GAME_PHASE.ENDING && (
        <EndingScreen variant={state.endingVariant} scores={state.chapterScores} onRestart={restart} />
      )}
    </>
  );
}

function MuteIndicator({ muted }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 'max(12px, env(safe-area-inset-top, 0px))',
        left: 12,
        zIndex: 100,
        fontFamily: "'JetBrains Mono', 'SF Mono', Consolas, monospace",
        fontSize: 10,
        letterSpacing: '0.2em',
        color: muted ? 'var(--rust-warn)' : 'var(--shadow)',
        opacity: 0.5,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {muted ? 'MUTED · M' : 'AUDIO · M'}
    </div>
  );
}