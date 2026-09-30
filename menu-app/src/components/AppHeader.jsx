import { Link, NavLink, useLocation } from 'react-router';

import { useBackpack } from './backpack.js';
import { BagIcon, FlameIcon } from './Icons.jsx';

// 진열장은 목록(/)과 카드 상세(/menus/:menuCode)에서 켜진다. 카드 들이기는 /menus/new 에서만.
const isShelfPath = (pathname) => pathname === '/' || (/^\/menus\/[^/]+/.test(pathname) && pathname !== '/menus/new');

const AppHeader = () => {
  const { pathname } = useLocation();
  const { count } = useBackpack();
  const navClass = (active) => `app-nav-link label1 bold${active ? ' active' : ''}`;

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link to="/" className="app-logo">
          <span className="app-logo-mark" aria-hidden="true">
            <FlameIcon />
          </span>
          <span className="heading1 display-font">모험가의 식탁</span>
        </Link>
        <nav aria-label="주요 메뉴">
          <ul className="app-nav">
            <li>
              <NavLink
                to="/"
                className={() => navClass(isShelfPath(pathname))}
                aria-current={isShelfPath(pathname) ? 'page' : undefined}
              >
                진열장
              </NavLink>
            </li>
            <li>
              <NavLink to="/menus/new" end className={({ isActive }) => navClass(isActive)}>
                카드 들이기
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/backpack"
                end
                className={({ isActive }) => navClass(isActive)}
                aria-label={`배낭, 카드 ${count}장`}
              >
                <BagIcon />
                배낭
                {count > 0 && <span className="nav-count caption1 bold">{count}</span>}
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default AppHeader;
