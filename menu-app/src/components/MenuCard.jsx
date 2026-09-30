import { Link } from 'react-router';

import CardFace from './CardFace.jsx';

const MenuCard = ({ menu }) => <CardFace as={Link} to={`/menus/${menu.menuCode}`} menu={menu} />;

export default MenuCard;
