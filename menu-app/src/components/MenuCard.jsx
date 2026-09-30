import { Link } from 'react-router';

import { useBackpack } from './backpack.js';
import CardFace from './CardFace.jsx';
import { BagIcon, CheckIcon } from './Icons.jsx';
import useTilt from './useTilt.js';

// 카드(링크) 안에 버튼을 넣을 수 없어서, 담기 버튼은 같은 칸 위에 겹쳐 둔다.
const MenuCard = ({ menu, order = 0, linkSearch = '' }) => {
  const { qtyOf, add } = useBackpack();
  const qty = qtyOf(menu.menuCode);
  const soldOut = menu.orderableStatus === 'N';
  const tilt = useTilt();

  return (
    // 떠오름·기울기는 이 칸에 걸어 담기 버튼도 카드와 함께 움직이게 한다
    <div className="card-slot" style={{ '--i': order }} {...tilt}>
      <CardFace
        as={Link}
        to={{ pathname: `/menus/${menu.menuCode}`, search: linkSearch }}
        state={{ fromList: true }}
        menu={menu}
      />
      {soldOut ? (
        <button type="button" className="bag-btn caption1 bold" disabled>
          담을 수 없음
        </button>
      ) : (
        <button
          type="button"
          className={`bag-btn caption1 bold${qty > 0 ? ' is-added' : ''}`}
          onClick={() => add(menu.menuCode)}
          aria-label={qty > 0 ? `${menu.menuName} 하나 더 담기, 지금 ${qty}장` : `${menu.menuName} 배낭에 담기`}
        >
          {qty > 0 ? <CheckIcon /> : <BagIcon size={14} />}
          {qty > 0 ? `배낭에 ${qty}` : '담기'}
        </button>
      )}
    </div>
  );
};

export default MenuCard;
