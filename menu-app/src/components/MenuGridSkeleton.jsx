import { FlameIcon } from './Icons.jsx';

// 카드와 같은 모양의 빈 칸. 사선 빛줄기가 카드마다 조금씩 늦게 지나간다.
const MenuGridSkeleton = ({ count = 8 }) => (
  <div className="loading-block">
    <p className="loading-line label1 medium" role="status">
      <FlameIcon size={16} />
      상인이 장부를 뒤지는 중…
    </p>
    <div className="menu-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="menu-card skeleton-card" style={{ '--shimmer-order': index % 4 }}>
          <div className="menu-card-top">
            <span className="skeleton skeleton-no" />
            <span className="skeleton skeleton-tag" />
          </div>
          <div className="skeleton skeleton-art" />
          <div className="skeleton-name">
            <span className="skeleton skeleton-line-long" />
            <span className="skeleton skeleton-line-short" />
          </div>
          <div className="menu-card-foot">
            <span className="skeleton skeleton-price" />
            <span className="skeleton skeleton-status" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default MenuGridSkeleton;
