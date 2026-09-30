import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';

import { groupCategories, getCategories } from '../api/categories.js';
import { isCanceled } from '../api/client.js';
import { getMenuPage, getMenus, getSortedMenuPage, searchMenusByPrice } from '../api/menus.js';
import FilterBar from '../components/FilterBar.jsx';
import { FlameIcon, PlusIcon } from '../components/Icons.jsx';
import MenuGrid from '../components/MenuGrid.jsx';
import MenuGridSkeleton from '../components/MenuGridSkeleton.jsx';
import Pagination from '../components/Pagination.jsx';
import StateCard from '../components/StateCard.jsx';
import {
  PAGE_SIZE,
  applyClientFilters,
  describeFilters,
  hasFilters,
  readFilters,
  toSearchParams,
} from '../components/menuFilters.js';
import { DEFAULT_SORT, SORT_OPTIONS, findSort } from '../components/menuSort.js';
import { rarityLegend } from '../components/rarity.js';


// 조회 방식
// - 조건 없음: GET /api/menus/pages 로 서버가 나눈 쪽을 받는다.
//   진열 순서를 바꿨으면 GET /api/menus/pages/sort 로 서버가 정렬해서 나눈 쪽을 받는다.
// - 조건 있음: 가격 조건이 있으면 GET /api/menus/search, 없으면 GET /api/menus 로 전체를 받아
//   이름·카테고리를 화면에서 거르고, 순서를 맞추고, 쪽도 화면에서 나눈다. (서버에 이름·카테고리 검색이 없다)
const fetchFor = (filters, signal) => {
  if (!hasFilters(filters)) {
    const { sortBy, direction } = findSort(filters.sort);
    const request =
      filters.sort === DEFAULT_SORT
        ? getMenuPage({ page: filters.page, size: PAGE_SIZE, signal })
        : getSortedMenuPage({ page: filters.page, size: PAGE_SIZE, sortBy, direction, signal });
    return request.then((data) => ({ mode: 'server', data }));
  }
  const request =
    filters.price !== null ? searchMenusByPrice({ menuPrice: filters.price, signal }) : getMenus({ signal });
  return request.then((menus) => ({ mode: 'client', menus }));
};

// 서버가 나눈 쪽이든 화면에서 나눈 쪽이든 같은 모양으로 맞춘다.
const toView = (result, filters) => {
  if (result.mode === 'server') {
    const { content, totalElements, totalPages } = result.data;
    return { items: content, totalElements, totalPages };
  }
  const matched = applyClientFilters(result.menus, filters);
  const start = (filters.page - 1) * PAGE_SIZE;
  return {
    items: matched.slice(start, start + PAGE_SIZE),
    totalElements: matched.length,
    totalPages: Math.ceil(matched.length / PAGE_SIZE),
  };
};

const MenuListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  // 상세에서 불태우고 넘어오면 한 번 알려 준다. 이동 기록(state)에만 있고 URL·컴포넌트 상태에는 두지 않는다.
  const burnedMenuName = location.state?.burnedMenuName;
  const dismissNotice = () => navigate({ search: location.search }, { replace: true, state: null });
  const filters = readFilters(searchParams);
  const filtered = hasFilters(filters);
  const [reloadKey, setReloadKey] = useState(0);

  // 서버에 다시 물어야 하는 값만 key 에 넣는다. 조건이 있을 때 이름·카테고리·쪽이 바뀌면 받은 목록을 다시 거르기만 한다.
  const requestKey = filtered
    ? `client:${filters.price ?? 'all'}:${reloadKey}`
    : `server:${filters.sort}:${filters.page}:${reloadKey}`;

  const [loaded, setLoaded] = useState({ key: null, result: null, error: null });
  const [categories, setCategories] = useState({ groups: [], failed: false });

  useEffect(() => {
    const controller = new AbortController();
    fetchFor(filters, controller.signal)
      .then((result) => setLoaded({ key: requestKey, result, error: null }))
      .catch((error) => {
        if (isCanceled(error)) return;
        setLoaded({ key: requestKey, result: null, error });
      });
    return () => controller.abort();
    // requestKey 가 fetchFor 에 쓰이는 값(조건 유무·쪽·가격)을 모두 담고 있다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  useEffect(() => {
    const controller = new AbortController();
    getCategories({ signal: controller.signal })
      .then((list) => setCategories({ groups: groupCategories(list), failed: false }))
      .catch((error) => {
        if (isCanceled(error)) return;
        setCategories({ groups: [], failed: true });
      });
    return () => controller.abort();
  }, []);

  const isLoading = loaded.key !== requestKey;
  const view = !isLoading && loaded.result ? toView(loaded.result, filters) : null;
  const error = isLoading ? null : loaded.error;

  const categoryName = categories.groups
    .flatMap((group) => group.children)
    .find((category) => category.categoryCode === filters.category)?.categoryName;

  // 조건을 새로 찾거나 순서를 바꾸면 1쪽부터. 순서는 조건을 찾거나 비워도 유지한다.
  const applyFilters = (next) => setSearchParams(toSearchParams({ ...next, sort: filters.sort }));
  const clearFilters = () => setSearchParams(toSearchParams({ sort: filters.sort }));
  const changeSort = (sort) => setSearchParams(toSearchParams({ ...filters, sort, page: 1 }));
  const goToPage = (page) => {
    setSearchParams(toSearchParams({ ...filters, page }));
    window.scrollTo({ top: 0 });
  };
  const retry = () => setReloadKey((key) => key + 1);

  return (
    <section className="page">
      <div className="page-head">
        <div className="page-head-text">
          <h1 className="page-title title2 display-font">오늘의 진열장</h1>
          <p className="page-desc body2 regular">
            {view && view.totalPages > 0
              ? `${filtered ? '“찾는 카드를 추려 보았네.”' : `“어서 오게, 모험가. 오늘 들어온 카드는 ${view.totalElements}장이라네.”`} · ${filters.page} / ${view.totalPages} 쪽`
              : '“어서 오게, 모험가.”'}
          </p>
        </div>
        <Link to="/menus/new" className="btn btn-primary label1 bold">
          <PlusIcon />
          카드 들이기
        </Link>
      </div>

      {burnedMenuName && (
        <div className="notice" role="status">
          <span className="npc-face">
            <FlameIcon size={20} />
          </span>
          <div className="npc-say-text">
            <p className="npc-name caption1 bold">상인</p>
            <p className="npc-line body2 regular">“‘{burnedMenuName}’ 카드는 재가 되었다네.”</p>
          </div>
          <button type="button" className="btn btn-text label1 medium" onClick={dismissNotice}>
            닫기
          </button>
        </div>
      )}

      <FilterBar
        // 카테고리 선택지가 늦게 도착해도 URL 의 category 가 선택되도록 선택지 수도 key 에 넣는다.
        key={`${searchParams.toString()}|${categories.groups.length}`}
        filters={filters}
        categoryGroups={categories.groups}
        categoriesFailed={categories.failed}
        onSubmit={applyFilters}
        onReset={clearFilters}
      />

      {isLoading ? (
        <MenuGridSkeleton count={PAGE_SIZE} />
      ) : error ? (
        <ListError error={error} onRetry={retry} />
      ) : view.totalElements === 0 ? (
        filtered ? (
          <StateCard
            kind="empty"
            line="그런 카드는 지금 진열장에 없다네."
            fact={`찾은 조건 · ${describeFilters(filters, categoryName)}`}
            action={
              <button type="button" className="btn btn-outlined label1 medium" onClick={clearFilters}>
                조건 비우기
              </button>
            }
          />
        ) : (
          <StateCard
            kind="empty"
            line="아직 진열장에 카드가 한 장도 없다네."
            fact="진열된 카드 0장"
            action={
              <Link to="/menus/new" className="btn btn-outlined label1 medium">
                카드 들이기
              </Link>
            }
          />
        )
      ) : view.items.length === 0 ? (
        <StateCard
          kind="empty"
          line="그 쪽에는 진열된 카드가 없다네."
          fact={`요청한 쪽 ${filters.page} · 전체 ${view.totalPages}쪽`}
          action={
            <button type="button" className="btn btn-outlined label1 medium" onClick={() => goToPage(1)}>
              첫 쪽으로
            </button>
          }
        />
      ) : (
        <>
          <div className="result-bar">
            <p className="label1 medium">
              {filtered
                ? `찾은 카드 ${view.totalElements}장 · ${describeFilters(filters, categoryName)}`
                : `진열된 카드 ${view.items.length}장`}
            </p>
            <div className="sort-control">
              <label className="label2 bold" htmlFor="sort">
                진열 순서
              </label>
              <div className="control control-compact">
                <select
                  id="sort"
                  className="label1 medium"
                  value={filters.sort}
                  onChange={(event) => changeSort(event.target.value)}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <ul className="legend caption1 medium" aria-label="레어도">
              {rarityLegend.map((tier) => (
                <li key={tier.key} className={`legend-item rarity-${tier.key}`}>
                  <span className="gem" aria-hidden="true" />
                  {tier.name}
                </li>
              ))}
            </ul>
          </div>
          {/* 조건·순서·쪽이 바뀌면 격자를 새로 그려 카드가 다시 차례로 떠오르게 한다 */}
          <MenuGrid
            key={searchParams.toString()}
            menus={view.items}
            linkSearch={toSearchParams({ ...filters, page: 1 }).toString()}
          />
          <Pagination page={filters.page} totalPages={view.totalPages} onChange={goToPage} />
        </>
      )}
    </section>
  );
};

const ListError = ({ error, onRetry }) =>
  error.type === 'network' ? (
    <StateCard
      kind="offline"
      speaker="상인의 쪽지"
      line="잠시 가게를 비웠다네. 조금 뒤 다시 두드려 주게."
      fact="서버 응답 없음 · localhost:8080"
      action={
        <button type="button" className="btn btn-primary label1 bold" onClick={onRetry}>
          다시 두드리기
        </button>
      }
    />
  ) : (
    <StateCard
      kind="error"
      line="장부를 펼치다 문제가 생겼다네."
      error={error}
      action={
        <button type="button" className="btn btn-outlined label1 medium" onClick={onRetry}>
          다시 펼치기
        </button>
      }
    />
  );

export default MenuListPage;
