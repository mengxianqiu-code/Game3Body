/**
 * ChapterTransition（兼容薄壳）
 * 实际功能已迁移到 StorySequence.jsx
 * 保留此文件仅为兼容旧引用
 */
import { StorySequence } from './StorySequence.jsx';

export function ChapterTransition({ from, to, onDone }) {
  return <StorySequence storyKey={`${from}-${to}`} onDone={onDone} />;
}