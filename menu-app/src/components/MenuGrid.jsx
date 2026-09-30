import MenuCard from './MenuCard.jsx';

// 카드마다 --i 만큼 늦게 떠오른다(진열 등장). 순서는 화면에 보이는 순서다.
// linkSearch: 상세로 넘겨줄 진열장 조건(쪽 번호 제외). 상세는 이 조건의 순서로 앞·다음 카드를 넘긴다.
const MenuGrid = ({ menus, linkSearch = '' }) => (
  <div className="menu-grid enter-grid">
    {menus.map((menu, index) => (
      <MenuCard key={menu.menuCode} menu={menu} order={index} linkSearch={linkSearch} />
    ))}
  </div>
);

export default MenuGrid;
