import { useCallback } from 'react';

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

// 카드 기울기와 광택 — 마우스 위치를 CSS 변수(--tilt-x/-y: -1~1, --gloss-x/-y: %)로 요소에 바로 쓴다.
// 움직일 때마다 React 상태를 바꾸면 화면 전체를 다시 그리게 되므로 상태에는 두지 않는다.
// 터치·펜 입력과 '동작 줄이기' 설정에서는 기울이지 않는다.
const useTilt = () => {
  const onPointerMove = useCallback((event) => {
    if (event.pointerType !== 'mouse' || reduceMotion()) return;
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    el.style.setProperty('--tilt-x', ((x - 0.5) * 2).toFixed(3));
    el.style.setProperty('--tilt-y', ((y - 0.5) * 2).toFixed(3));
    el.style.setProperty('--gloss-x', `${(x * 100).toFixed(1)}%`);
    el.style.setProperty('--gloss-y', `${(y * 100).toFixed(1)}%`);
    el.classList.add('is-tilting');
  }, []);

  const onPointerLeave = useCallback((event) => {
    const el = event.currentTarget;
    el.classList.remove('is-tilting');
    ['--tilt-x', '--tilt-y', '--gloss-x', '--gloss-y'].forEach((name) => el.style.removeProperty(name));
  }, []);

  return { onPointerMove, onPointerLeave };
};

export default useTilt;
