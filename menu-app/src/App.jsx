import { Route, Routes } from 'react-router';

import Layout from './components/Layout.jsx';
import BackpackPage from './pages/BackpackPage.jsx';
import MenuDetailPage from './pages/MenuDetailPage.jsx';
import MenuFormPage from './pages/MenuFormPage.jsx';
import MenuListPage from './pages/MenuListPage.jsx';
import './App.css';

const App = () => (
  <Routes>
    <Route element={<Layout />}>
      <Route index element={<MenuListPage />} />
      <Route path="menus/new" element={<MenuFormPage />} />
      <Route path="menus/:menuCode" element={<MenuDetailPage />} />
      <Route path="menus/:menuCode/edit" element={<MenuFormPage />} />
      <Route path="backpack" element={<BackpackPage />} />
    </Route>
  </Routes>
);

export default App;
