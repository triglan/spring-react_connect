import { FlameIcon } from './Icons.jsx';

// 도감 카드 뒷면 — 입고 개봉 연출에서 앞면이 드러나기 전에 보인다.
const CardBack = () => (
  <div className="card-back" aria-hidden="true">
    <span className="card-back-crest">
      <FlameIcon size={28} />
    </span>
    <span className="label1 display-font">모험가의 식탁</span>
  </div>
);

export default CardBack;
