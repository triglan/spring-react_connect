import { Outlet } from 'react-router';

import AppFooter from './AppFooter.jsx';
import AppHeader from './AppHeader.jsx';

const Layout = () => (
  <div className="app-shell">
    <AppHeader />
    <main className="app-main">
      <Outlet />
    </main>
    <AppFooter />
  </div>
);

export default Layout;
