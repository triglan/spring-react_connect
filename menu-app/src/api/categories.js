import client, { unwrap } from './client.js';

// GET /api/categories — result.categories
// CategoryDTO: categoryCode, categoryName, refCategoryCode, refCategoryName (최상위는 ref 두 값이 null)
export const getCategories = async ({ signal } = {}) => {
  const { categories } = unwrap(await client.get('/api/categories', { signal }));
  return categories;
};

// 최상위 카테고리 아래에 하위 카테고리를 묶는다. 선택지로는 하위 카테고리만 쓴다.
export const groupCategories = (categories) =>
  categories
    .filter((category) => category.refCategoryCode === null)
    .map((parent) => ({
      ...parent,
      children: categories.filter((category) => category.refCategoryCode === parent.categoryCode),
    }));
