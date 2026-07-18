/* eslint-disable */
/**
 * 《三体：星际逃亡》全局状态机
 * - 4 关路由：CHAPTER_1 → CHAPTER_2 → CHAPTER_3 → CHAPTER_4 → ENDING
 * - 简化资源模型（聚焦核心玩法，不复用《低语》的燃料/船体/能量/数据多资源）
 * - 每关完成时通过 onComplete 上抛分数，全局 reducer 仅管理 phase 流转
 */

import { GAME_PHASE, DIFFICULTY } from './constants.js';

export function getInitialState() {
  return {
    phase: GAME_PHASE.MENU,
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
    muted: false,
    settings: {
      colorBlindMode: false,
      monoAudio: false,
      showSubtitles: false,
    },
  };
}

export const initialState = getInitialState();

export function gameReducer(state, action) {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...getInitialState(),
        phase: GAME_PHASE.CHAPTER_1,
        currentChapter: 1,
        difficulty: state.difficulty,
        settings: state.settings,
      };

    case 'SET_DIFFICULTY':
      return { ...state, difficulty: action.difficulty };

    case 'TOGGLE_SETTING': {
      const settings = { ...state.settings, [action.key]: !state.settings[action.key] };
      return { ...state, settings };
    }

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
      return { ...getInitialState(), difficulty: state.difficulty, settings: state.settings };

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
  scores.push(Math.max(0, 25 + c3.correctHits * 5 - c3.errors * 8));

  const c4 = chapterScores.chapter4;
  scores.push(Math.max(0, 25 - Math.floor(c4.timeUsed / 4)));

  const total = scores.reduce((a, b) => a + b, 0);
  return Math.min(100, Math.max(0, total));
}