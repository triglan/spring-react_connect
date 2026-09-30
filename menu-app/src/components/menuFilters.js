import { DEFAULT_SORT, findSort } from './menuSort.js';

// 검색 조건과 진열 순서는 URL 쿼리스트링에만 둔다.
//   ?q=이름 &category=하위카테고리코드 &price=기준가격(초과) &sort=진열순서 &page=쪽
// 잘못된 값은 조건이 없는 것(순서는 기본값)으로 본다.

const readPositiveInt = (value, min) => {
  if (value === null || value.trim() === '') return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= min ? number : null;
};

export const readFilters = (searchParams) => ({
  q: (searchParams.get('q') ?? '').trim(),
  category: readPositiveInt(searchParams.get('category'), 1),
  price: readPositiveInt(searchParams.get('price'), 0),
  sort: findSort(searchParams.get('sort')).value,
  page: readPositiveInt(searchParams.get('page'), 1) ?? 1,
});

// 순서는 거르는 조건이 아니다. 순서만 바뀌면 서버 페이징을 그대로 쓴다.
export const hasFilters = ({ q, category, price }) => q !== '' || category !== null || price !== null;

// 비어 있는 값과 기본값은 URL 에 남기지 않는다. 조건이 바뀌면 page 는 빼서 1쪽으로 돌아간다.
export const toSearchParams = ({ q = '', category = null, price = null, sort = DEFAULT_SORT, page = 1 }) => {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (category !== null) params.set('category', String(category));
  if (price !== null) params.set('price', String(price));
  if (sort !== DEFAULT_SORT) params.set('sort', sort);
  if (page > 1) params.set('page', String(page));
  return params;
};

// 이름·카테고리는 서버에 검색 API 가 없어서 화면에서 거른다. 순서도 서버와 같은 기준으로 화면에서 맞춘다.
export const applyClientFilters = (menus, { q, category, sort }) => {
  const keyword = q.toLowerCase();
  return menus
    .filter((menu) => (keyword ? menu.menuName.toLowerCase().includes(keyword) : true))
    .filter((menu) => (category !== null ? menu.categoryCode === category : true))
    .toSorted(findSort(sort).compare);
};

export const describeFilters = ({ q, category, price }, categoryName) =>
  [
    q && `‘${q}’`,
    category !== null && (categoryName ?? `계통 ${category}`),
    price !== null && `${price.toLocaleString('ko-KR')} G 초과`,
  ]
    .filter(Boolean)
    .join(' · ');
