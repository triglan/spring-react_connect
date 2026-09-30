import client, { unwrap } from './client.js';

// GET /api/menus — result.menus 에 전체 메뉴 목록 (menuCode 내림차순)
export const getMenus = async ({ signal } = {}) => {
  const { menus } = unwrap(await client.get('/api/menus', { signal }));
  return menus;
};

// GET /api/menus/pages — 페이지 번호는 1부터. result 에 content, totalElements, totalPages, size, number, first, last
export const getMenuPage = async ({ page, size, signal } = {}) =>
  unwrap(await client.get('/api/menus/pages', { params: { page, size }, signal }));

// GET /api/menus/pages/sort — 페이지 번호는 1부터. sortBy(엔티티 필드 이름)·direction(asc|desc)
// result 에 content, totalElements, totalPages, size, number, first, last, sort, direction
export const getSortedMenuPage = async ({ page, size, sortBy, direction, signal }) =>
  unwrap(await client.get('/api/menus/pages/sort', { params: { page, size, sortBy, direction }, signal }));

// GET /api/menus/search — menuPrice 를 "초과"하는 메뉴를 result.menus 에 담아 준다 (menuCode 오름차순)
export const searchMenusByPrice = async ({ menuPrice, signal }) => {
  const { menus } = unwrap(await client.get('/api/menus/search', { params: { menuPrice }, signal }));
  return menus;
};

// 서버로 보내는 본문. menuCode 는 보내지 않는다(등록은 서버가 채우고, 수정은 주소에 있다).
const toMenuBody = ({ menuName, menuPrice, categoryCode, orderableStatus }) => ({
  menuName,
  menuPrice,
  categoryCode,
  orderableStatus,
});

// POST /api/menus — 201, result.menu 에 등록된 메뉴
export const createMenu = async (menu) => {
  const { menu: saved } = unwrap(await client.post('/api/menus', toMenuBody(menu)));
  return saved;
};

// PUT /api/menus/{menuCode} — 200, result.menu 에 수정된 메뉴
export const updateMenu = async (menuCode, menu) => {
  const { menu: saved } = unwrap(await client.put(`/api/menus/${menuCode}`, toMenuBody(menu)));
  return saved;
};

// DELETE /api/menus/{menuCode} — 실제 HTTP 상태는 200, 본문의 httpStatus 는 204.
// 성공 여부는 HTTP 상태(axios 가 2xx 로 판단)로만 본다. 본문의 204 로 분기하지 않는다.
// result.deletedMenuCode 에 지운 메뉴 코드
export const deleteMenu = async (menuCode) => {
  const { deletedMenuCode } = unwrap(await client.delete(`/api/menus/${menuCode}`));
  return deletedMenuCode;
};

// GET /api/menus/{menuCode} — result.menu
export const getMenu = async ({ menuCode, signal }) => {
  const { menu } = unwrap(await client.get(`/api/menus/${menuCode}`, { signal }));
  return menu;
};
