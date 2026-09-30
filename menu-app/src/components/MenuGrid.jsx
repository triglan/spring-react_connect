import MenuCard from './MenuCard.jsx';

const MenuGrid = ({ menus }) => (
  <div className="menu-grid">
    {menus.map((menu) => (
      <MenuCard key={menu.menuCode} menu={menu} />
    ))}
  </div>
);

export default MenuGrid;
