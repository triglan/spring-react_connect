import { useEffect, useRef } from 'react';

// 불똥이 튀는 자리와 시간. 오른쪽 아래부터 차례로 튀어 왼쪽 위로 날아간다.
const sparks = [
  [88, 86, 120],
  [74, 92, 260],
  [70, 64, 480],
  [48, 72, 700],
  [40, 40, 920],
  [18, 30, 1150],
];

const burnDuration = () => {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--motion-duration-burn').trim();
  return Number.parseFloat(value) || 1400;
};

// 카드를 불태운다. 다 타면 onDone 을 한 번 부른다.
// 동작 줄이기에서는 바로, 탭이 가려져 애니메이션이 멈춰 있으면 정해진 시간이 지나면 부른다.
const BurnEffect = ({ children, onDone }) => {
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      onDoneRef.current();
    };
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      finish();
      return undefined;
    }
    const timer = window.setTimeout(finish, burnDuration() + 300);
    return () => window.clearTimeout(timer);
  }, []);

  const handleEnd = (event) => {
    if (event.animationName !== 'burn-remain' || doneRef.current) return;
    doneRef.current = true;
    onDoneRef.current();
  };

  return (
    <div className="burn-wrap" onAnimationEnd={handleEnd} aria-hidden="true">
      {children}
      <span className="burn-fx burn-haze-fx">
        <span className="burn-haze" />
      </span>
      <span className="burn-fx burn-char-fx">
        <span className="burn-char" />
      </span>
      <span className="burn-fx burn-glow-fx">
        <span className="burn-glow" />
      </span>
      <span className="burn-fx burn-ember-fx">
        <span className="burn-ember" />
      </span>
      {sparks.map(([x, y, delay]) => (
        <span key={`${x}-${y}`} className="spark" style={{ '--x': `${x}%`, '--y': `${y}%`, '--d': `${delay}ms` }} />
      ))}
    </div>
  );
};

export default BurnEffect;
