// 진열 순서. URL 의 ?sort= 값 → 서버 정렬(sortBy·direction)과 화면 정렬(compare)을 같이 정의한다.
// 서버는 sortBy 에 엔티티 필드 이름을 그대로 받고, 없는 필드면 500 을 돌려준다. 그래서 여기 있는 것만 보낸다.
// 값이 같을 때는 최근 들어온 순(menuCode 내림차순)으로 한 번 더 가른다.
const byRecent = (a, b) => b.menuCode - a.menuCode;

export const SORT_OPTIONS = [
  { value: 'recent', label: '최근 들어온 순', sortBy: 'menuCode', direction: 'desc', compare: byRecent },
  { value: 'oldest', label: '오래된 순', sortBy: 'menuCode', direction: 'asc', compare: (a, b) => a.menuCode - b.menuCode },
  {
    value: 'price-desc',
    label: '몸값 높은 순',
    sortBy: 'menuPrice',
    direction: 'desc',
    compare: (a, b) => b.menuPrice - a.menuPrice || byRecent(a, b),
  },
  {
    value: 'price-asc',
    label: '몸값 낮은 순',
    sortBy: 'menuPrice',
    direction: 'asc',
    compare: (a, b) => a.menuPrice - b.menuPrice || byRecent(a, b),
  },
  {
    value: 'name',
    label: '이름순',
    sortBy: 'menuName',
    direction: 'asc',
    compare: (a, b) => a.menuName.localeCompare(b.menuName, 'ko') || byRecent(a, b),
  },
];

export const DEFAULT_SORT = 'recent';

export const findSort = (value) => SORT_OPTIONS.find((option) => option.value === value) ?? SORT_OPTIONS[0];
