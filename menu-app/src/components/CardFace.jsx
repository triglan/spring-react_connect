import CategoryArt from './CategoryArt.jsx';
import { formatCardNo, formatGold, getRarity } from './rarity.js';

// 도감 카드 한 장의 앞면. 목록(링크 카드)과 상세(큰 카드)가 같이 쓴다.
const CardFace = ({ menu, as: Tag = 'div', className = '', size = 'normal', ...rest }) => {
  const rarity = getRarity(menu.menuPrice);
  const soldOut = menu.orderableStatus === 'N';
  const classes = ['menu-card', `rarity-${rarity.key}`, soldOut && 'is-soldout', size === 'large' && 'is-large', className]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag className={classes} {...rest}>
      <div className="menu-card-top">
        <span className="card-no caption1 bold">No.{formatCardNo(menu.menuCode)}</span>
        <span className="rarity-tag caption1 bold">
          <span className="gem" aria-hidden="true" />
          {rarity.name}
        </span>
      </div>
      <div className="card-art">
        <CategoryArt categoryName={menu.categoryName} large={size === 'large'} />
        <span className="card-category caption1 medium">{menu.categoryName}</span>
        {soldOut && <span className={`stamp ${size === 'large' ? 'headline2' : 'label1'} bold`}>품절</span>}
      </div>
      <p className="menu-card-name headline1 display-font">{menu.menuName}</p>
      <div className="menu-card-foot">
        <span className="price headline2 bold">
          {formatGold(menu.menuPrice)} <span className="caption1 bold">G</span>
        </span>
        {soldOut ? (
          <span className="status status-off caption1 bold">
            <span className="dot" aria-hidden="true" />
            품절
          </span>
        ) : (
          <span className="status status-on caption1 bold">
            <span className="dot" aria-hidden="true" />
            판매 중
          </span>
        )}
      </div>
    </Tag>
  );
};

export default CardFace;
