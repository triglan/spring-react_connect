import MenuCard from './MenuCard.jsx';

// 카드마다 --i 만큼 늦게 떠오른다(진열 등장). 순서는 화면에 보이는 순서다.
const MenuGrid = ({ menus }) => (
  <div className="menu-grid enter-grid">
    {menus.map((menu, index) => (
      <MenuCard key={menu.menuCode} menu={menu} order={index} />
    ))}
  </div>
);

export default MenuGrid;
