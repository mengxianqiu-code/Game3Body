import { useEffect, useReducer, useRef, useState } from 'react';
import { GAME_PHASE } from './constants.js';
import {
  gameReducer,
  getInitialState,
  loadPersistedState,
  computeOverallRating,
  PERSIST_KEYS,
} from './gameState.js';
import { MainMenu } from './components/MainMenu.jsx';
import { StorySequence } from './components/StorySequence.jsx';
import { EndingScreen } from './components/EndingScreen.jsx';
import { GameOverScreen } from './components/GameOverScreen.jsx';
import { Settings } from './components/Settings.jsx';
import { Help } from './components/Help.jsx';
import { Credits } from './components/Credits.jsx';
import { Chapter1Signal } from './components/chapter1/Chapter1Signal.jsx';
import { Chapter2Forest } from './components/chapter2/Chapter2Forest.jsx';
import { Chapter3Deterrence } from './components/chapter3/Chapter3Deterrence.jsx';
import { Chapter4Escape } from './components/chapter4/Chapter4Escape.jsx';
import { globalSfx, stopAllChapterAudio } from './audio/presets.js';
import { getMuted, setMuted, playTone } from './audio/synth.js';
import { rollEtoClue } from './data/etoClues.js';
import './styles/scenes.css';
import './styles/mobile.css';

export default function App({ onReady }) {
  // 初始 state：从 localStorage 还原持久化字段
  const [state, dispatch] = useReducer(gameReducer, undefined, () => {
    const persisted = loadPersistedState();
    const base = persisted || getInitialState();
    // 如果已经看过 intro，直接进入 MENU
    base.phase = base.hasSeenIntro ? GAME_PHASE.MENU : GAME_PHASE.INTRO;
    return base;
  });
  const [muted, setMutedState] = useState(() => state.muted || getMuted());
  const [audioReady, setAudioReady] = useState(false);

  // 首次启动静音状态同步
  useEffect(() => {
    setMuted(state.muted);
    setMutedState(state.muted);
    // eslint-disable-next-line
  }, []);

  // 持久化：监听 state 变化，写入需要持久化的字段
  const persistTimerRef = useRef(null);
  useEffect(() => {
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      try {
        const toSave = {};
        PERSIST_KEYS.forEach((k) => { toSave[k] = state[k]; });
        window.localStorage.setItem('starsea_state_v1', JSON.stringify(toSave));
      } catch (e) {
        // ignore
      }
    }, 100);
    return () => { if (persistTimerRef.current) clearTimeout(persistTimerRef.current); };
  }, [state.difficulty, state.muted, state.settings, state.bestScore, state.etoClues, state.hasSeenIntro, state.shelterChoice]);

  useEffect(() => {
    if (onReady) onReady();
  }, [onReady]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'm' || e.key === 'M') {
        const next = !getMuted();
        setMuted(next);
        setMutedState(next);
        dispatch({ type: 'SET_MUTED', value: next });
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

  const tryFindEtoClue = (chapter) => {
    const clue = rollEtoClue(chapter, state.etoClues);
    if (clue) dispatch({ type: 'FOUND_ETO_CLUE', id: clue.id });
  };

  const updateBestScore = (chapterScores) => {
    const total = computeOverallRating(chapterScores);
    dispatch({ type: 'SET_BEST_SCORE', score: total });
  };

  const onChapterComplete = (chapter, score, nextChapter, nextVariant, gameOver) => {
    if (gameOver) {
      dispatch({ type: 'GAME_OVER', reason: gameOver.reason, chapter });
      return;
    }
    dispatch({ type: 'COMPLETE_CHAPTER', chapter, score });
    // 关口完成时尝试获取 ETO 线索
    tryFindEtoClue(chapter);
    // 整合 chapterScores 计算总分，更新最高分
    const nextScores = {
      ...state.chapterScores,
      [`chapter${chapter}`]: { ...state.chapterScores[`chapter${chapter}`], ...score },
    };
    updateBestScore(nextScores);

    if (nextChapter) {
      dispatch({ type: 'BEGIN_TRANSITION', from: chapter, to: nextChapter });
    } else if (nextVariant) {
      dispatch({ type: 'BEGIN_TRANSITION', from: chapter, to: null });
    }
  };

  const onTransitionDone = (nextChapter, choiceId) => {
    globalSfx.transition();
    if (choiceId) dispatch({ type: 'SET_SHELTER_CHOICE', choice: choiceId });
    if (nextChapter) {
      dispatch({ type: 'ENTER_CHAPTER', chapter: nextChapter });
    } else {
      // 进入结局
      setTimeout(() => dispatch({ type: 'ENTER_ENDING', variant: 'success' }), 300);
    }
  };

  const restart = () => {
    stopAllChapterAudio();
    dispatch({ type: 'RESTART' });
  };

  const onIntroDone = () => {
    dispatch({ type: 'END_INTRO' });
    dispatch({ type: 'GOTO_MENU' });
  };

  return (
    <>
      <MuteIndicator muted={muted} />

      {state.phase === GAME_PHASE.INTRO && (
        <StorySequence storyKey="intro" onDone={onIntroDone} />
      )}

      {state.phase === GAME_PHASE.MENU && (
        <MainMenu
          onStart={startGame}
          difficulty={state.difficulty}
          onDifficultyChange={(d) => dispatch({ type: 'SET_DIFFICULTY', difficulty: d })}
          bestScore={state.bestScore}
          etoCount={state.etoClues.length}
          onOpenSettings={() => dispatch({ type: 'GOTO_SETTINGS' })}
          onOpenHelp={() => dispatch({ type: 'GOTO_HELP' })}
          onOpenCredits={() => dispatch({ type: 'GOTO_CREDITS' })}
        />
      )}

      {state.phase === GAME_PHASE.SETTINGS && (
        <Settings
          settings={state.settings}
          muted={muted}
          onToggle={(k) => dispatch({ type: 'TOGGLE_SETTING', key: k })}
          onToggleMute={() => {
            const next = !muted;
            setMuted(next);
            setMutedState(next);
            dispatch({ type: 'SET_MUTED', value: next });
            playTone({ freq: next ? 880 : 220, duration: 0.06, type: 'sine', gain: 0.1 });
          }}
          onReset={() => dispatch({ type: 'RESET_STORAGE' })}
          onClose={() => dispatch({ type: 'GOTO_MENU' })}
        />
      )}

      {state.phase === GAME_PHASE.HELP && (
        <Help onClose={() => dispatch({ type: 'GOTO_MENU' })} />
      )}

      {state.phase === GAME_PHASE.CREDITS && (
        <Credits onClose={() => dispatch({ type: 'GOTO_MENU' })} />
      )}

      {state.phase === GAME_PHASE.GAME_OVER && (
        <GameOverScreen reason={state.gameOver.reason} onRestart={restart} />
      )}

      {state.phase === GAME_PHASE.TRANSITION && (
        <StorySequence
          storyKey={`${state.transition.from}-${state.transition.to}`}
          onChoice={(choiceId) => dispatch({ type: 'SET_SHELTER_CHOICE', choice: choiceId })}
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
        <EndingScreen
          variant={state.endingVariant}
          scores={state.chapterScores}
          etoClues={state.etoClues}
          shelterChoice={state.shelterChoice}
          onRestart={restart}
        />
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