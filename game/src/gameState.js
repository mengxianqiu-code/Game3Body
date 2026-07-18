/* eslint-disable */
/**
 * 《三体：星际逃亡》全局状态机
 * - 4 关路由：CHAPTER_1 → CHAPTER_2 → CHAPTER_3 → CHAPTER_4 → ENDING
 * - 简化资源模型（聚焦核心玩法，不复用《低语》的燃料/船体/能量/数据多资源）
 * - 每关完成时通过 onComplete 上抛分数，全局 reducer 仅管理 phase 流转
 *
 * 持久化字段：difficulty / muted / settings / bestScore / etoClues / hasSeenIntro / shelterChoice
 * 不持久化：chapterScores / currentChapter / phase / transition
 */

import { GAME_PHASE, DIFFICULTY } from './constants.js';

export function getInitialState() {
  return {
    phase: GAME_PHASE.INTRO,
    currentChapter: 0,
    difficulty: DIFFICULTY.NORMAL,
    transition: { from: null, to: null },
    gameOver: { active: false, reason: null, chapter: null },
    chapterScores: {
      chapter1: { timeUsed: 0, errors: 0, decoysClicked: 0, hits: 0 },
      chapter2: { warnings: 0, timeUsed: 0 },
      chapter3: { correctHits: 0, errors: 0, timeUsed: 0 },
      chapter4: { timeUsed: 0, fragmentsCollected: 0, order: [] },
    },
    endingVariant: null,
    // —— 持久化字段 ——
    muted: false,
    settings: {
      colorBlindMode: false,
      monoAudio: false,
      showSubtitles: true,
    },
    bestScore: null,
    etoClues: [],
    hasSeenIntro: false,
    shelterChoice: null, // 'shelter' | 'escape' | null
  };
}

export const initialState = getInitialState();

/** 需要持久化的字段子集 */
export const PERSIST_KEYS = [
  'difficulty',
  'muted',
  'settings',
  'bestScore',
  'etoClues',
  'hasSeenIntro',
  'shelterChoice',
];

/** 从 localStorage 还原 state 的持久化字段 */
export function loadPersistedState() {
  try {
    const raw = window.localStorage.getItem('starsea_state_v1');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const merged = getInitialState();
    PERSIST_KEYS.forEach((k) => {
      if (parsed[k] !== undefined) merged[k] = parsed[k];
    });
    return merged;
  } catch (e) {
    return null;
  }
}

export function gameReducer(state, action) {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...state,
        phase: GAME_PHASE.CHAPTER_1,
        currentChapter: 1,
        chapterScores: getInitialState().chapterScores, // 重置关卡分数
      };

    case 'SET_DIFFICULTY':
      return { ...state, difficulty: action.difficulty };

    case 'TOGGLE_SETTING': {
      const settings = { ...state.settings, [action.key]: !state.settings[action.key] };
      return { ...state, settings };
    }

    case 'SET_MUTED':
      return { ...state, muted: action.value };

    case 'BEGIN_TRANSITION':
      return {
        ...state,
        phase: GAME_PHASE.TRANSITION,
        transition: { from: action.from, to: action.to },
      };

    case 'ENTER_CHAPTER': {
      const chapter = action.chapter;
      return {
        ...state,
        phase: GAME_PHASE[`CHAPTER_${chapter}`],
        currentChapter: chapter,
      };
    }

    case 'COMPLETE_CHAPTER': {
      const { chapter, score } = action;
      return {
        ...state,
        chapterScores: {
          ...state.chapterScores,
          [`chapter${chapter}`]: { ...state.chapterScores[`chapter${chapter}`], ...score },
        },
      };
    }

    case 'GAME_OVER':
      return {
        ...state,
        phase: GAME_PHASE.GAME_OVER,
        gameOver: { active: true, reason: action.reason, chapter: action.chapter },
      };

    case 'ENTER_ENDING':
      return { ...state, phase: GAME_PHASE.ENDING, endingVariant: action.variant || 'success' };

    case 'RESTART':
      return {
        ...getInitialState(),
        difficulty: state.difficulty,
        settings: state.settings,
        muted: state.muted,
        bestScore: state.bestScore,
        etoClues: state.etoClues,
        hasSeenIntro: true,
        shelterChoice: null,
      };

    /* ---------- 局外页面 phase 切换 ---------- */
    case 'GOTO_MENU':
      return { ...state, phase: GAME_PHASE.MENU };
    case 'GOTO_SETTINGS':
      return { ...state, phase: GAME_PHASE.SETTINGS };
    case 'GOTO_HELP':
      return { ...state, phase: GAME_PHASE.HELP };
    case 'GOTO_CREDITS':
      return { ...state, phase: GAME_PHASE.CREDITS };

    /* ---------- 持久化字段 ---------- */
    case 'END_INTRO':
      return { ...state, hasSeenIntro: true };

    case 'FOUND_ETO_CLUE': {
      if (state.etoClues.includes(action.id)) return state;
      return { ...state, etoClues: [...state.etoClues, action.id] };
    }

    case 'SET_BEST_SCORE': {
      const cur = state.bestScore ?? 0;
      return { ...state, bestScore: Math.max(cur, action.score) };
    }

    case 'SET_SHELTER_CHOICE':
      return { ...state, shelterChoice: action.choice };

    case 'RESET_STORAGE':
      return {
        ...state,
        bestScore: null,
        etoClues: [],
        hasSeenIntro: false,
        shelterChoice: null,
        settings: getInitialState().settings,
      };

    default:
      return state;
  }
}

/* ============== 计算总评分（黑暗森林威慑度） ============== */
export function computeOverallRating(chapterScores) {
  // 每关满分 25 分，总分 100
  const scores = [];
  const c1 = chapterScores.chapter1;
  // 第1关：60 秒内通关得 25 分，每多 5 秒扣 1 分
  scores.push(Math.max(0, 25 - Math.floor(c1.timeUsed / 5) - c1.errors * 2));

  const c2 = chapterScores.chapter2;
  scores.push(Math.max(0, 25 - c2.warnings * 5 - Math.floor(c2.timeUsed / 5)));

  const c3 = chapterScores.chapter3;
  scores.push(Math.max(0, 25 + (c3.correctHits || 0) * 5 - (c3.errors || 0) * 8));

  const c4 = chapterScores.chapter4;
  scores.push(Math.max(0, 25 - Math.floor(c4.timeUsed / 4)));

  const total = scores.reduce((a, b) => a + b, 0);
  return Math.min(100, Math.max(0, total));
}