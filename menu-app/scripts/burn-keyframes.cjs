// 불태우기 연출의 불길 경계 키프레임을 만든다. 출력(@keyframes burn-*)을 src/App.css 의 "연출: 불태우기" 절에 붙여 넣는다.
// 실행: node scripts/burn-keyframes.cjs
// 불길 경계 키프레임 — 오른쪽 아래에서 왼쪽 위로 사선을 따라 타오른다.
// 좌표계: c = x + y (왼쪽 위 0 → 오른쪽 아래 200), v = x - y (경계를 따라가는 방향)
// 경계 지점마다 c 가 줄어드는 속도가 달라 경계가 고르지 않다. 시간에 따른 흔들림은 없다.
let seed = 11;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const N = 21;
const vs = Array.from({ length: N }, (_, i) => -140 + (i * 280) / (N - 1));
const speed = vs.map(() => 0.82 + rand() * 0.4);
const lag = vs.map(() => (rand() - 0.5) * 16); // 지점마다 고정된 들쭉날쭉함
const charW = vs.map(() => 10 + rand() * 10);
const frames = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const START = 214, END = -40;
const front = (i, t) => {
  if (t === 0) return START;
  const c = START - t * (START - END) * speed[i] * 1.18 + lag[i] * Math.sin(Math.PI * Math.min(1, t));
  return Math.max(END - 20, c);
};
const P = (c, v) => `${((c + v) / 2).toFixed(1)}% ${((c - v) / 2).toFixed(1)}%`;
const poly = (pts) => `polygon(${pts.join(', ')})`;
const kf = (name, fn) =>
  `@keyframes ${name} {\n` + frames.map((f) => `  ${f}% { clip-path: ${fn(f / 100)}; }`).join('\n') + '\n}';
// 남은 카드: 왼쪽 위 먼 모서리 + 경계
const remain = (t) => poly(['-120% -120%', ...[...vs.keys()].reverse().map((i) => P(front(i, t), vs[i]))]);
// 경계를 기준으로 왼쪽 위(up)·오른쪽 아래(down)로 두께를 준 띠
const band = (up, down) => (t) =>
  poly([
    ...[...vs.keys()].reverse().map((i) => P(front(i, t) - up(i), vs[i])),
    ...[...vs.keys()].map((i) => P(front(i, t) + down, vs[i])),
  ]);
console.log(kf('burn-remain', remain));
console.log(kf('burn-haze', band((i) => charW[i] + 22, 0)));
console.log(kf('burn-char', band((i) => charW[i], 0.4)));
console.log(kf('burn-glow', band(() => 3, 1.2)));
console.log(kf('burn-ember', band(() => 0.7, 0.7)));
