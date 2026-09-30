import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';

import { getCategories } from '../api/categories.js';
import { isCanceled } from '../api/client.js';
import { deleteMenu, getMenu, getMenus, getSortedMenuPage, searchMenusByPrice } from '../api/menus.js';
import BurnDialog from '../components/BurnDialog.jsx';
import BurnEffect from '../components/BurnEffect.jsx';
import CardBack from '../components/CardBack.jsx';
import CardFace from '../components/CardFace.jsx';
import { useBackpack } from '../components/backpack.js';
import { BagIcon, ChevronLeftIcon, ChevronRightIcon, FlameIcon } from '../components/Icons.jsx';
import StateCard from '../components/StateCard.jsx';
import { PAGE_SIZE, applyClientFilters, hasFilters, readFilters, toSearchParams } from '../components/menuFilters.js';
import { DEFAULT_SORT, findSort } from '../components/menuSort.js';
import { formatCardNo, formatGold, getRarity } from '../components/rarity.js';
import useTilt from '../components/useTilt.js';

// 주소의 menuCode 가 양의 정수가 아니면 서버에 묻지 않는다. (서버는 500 을 돌려준다)
const readMenuCode = (value) => {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 ? number : null;
};

// 진열장과 똑같은 순서의 목록을 받는다.
// - 조건이 있거나 기본 순서면 진열장도 전체를 화면에서 거르고 정렬하므로, 같은 규칙으로 정렬한다.
// - 조건 없이 순서만 바꿨으면 진열장은 서버 정렬(/pages/sort, 12장씩)을 쓴다. 서버는 값이 같은 카드의 순서를
//   요청 모양에 따라 다르게 주므로, 진열장과 똑같이 12장씩 1쪽부터 끝까지 받아 이어 붙인다.
const fetchOrdered = async (filters, signal) => {
  if (hasFilters(filters) || filters.sort === DEFAULT_SORT) {
    const menus = filters.price !== null ? await searchMenusByPrice({ menuPrice: filters.price, signal }) : await getMenus({ signal });
    return applyClientFilters(menus, filters);
  }
  const { sortBy, direction } = findSort(filters.sort);
  const first = await getSortedMenuPage({ page: 1, size: PAGE_SIZE, sortBy, direction, signal });
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, i) =>
      getSortedMenuPage({ page: i + 2, size: PAGE_SIZE, sortBy, direction, signal }),
    ),
  );
  return [first, ...rest].flatMap((page) => page.content);
};

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

// 상세 주소에는 진열장에서 보던 조건(?q=&category=&price=&sort=)이 붙어 온다.
// 같은 조건으로 목록을 받아 진열장과 같은 순서로 세우고, 그 순서에서 앞·다음 카드를 정한다.
const MenuDetailPage = () => {
  const params = useParams();
  const menuCode = readMenuCode(params.menuCode);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const filters = readFilters(searchParams);
  const listSearch = toSearchParams({ ...filters, page: 1 }).toString();
  const withSearch = (path) => (listSearch ? `${path}?${listSearch}` : path);

  const [reloadKey, setReloadKey] = useState(0);
  const requestKey = `${menuCode}:${reloadKey}`;
  const [loaded, setLoaded] = useState({ key: null, menu: null, error: null });

  // 이 카드 하나 — GET /api/menus/{menuCode}
  useEffect(() => {
    if (menuCode === null) return undefined;
    const controller = new AbortController();
    getMenu({ menuCode, signal: controller.signal })
      .then((menu) => setLoaded({ key: requestKey, menu, error: null }))
      .catch((error) => {
        if (isCanceled(error)) return;
        setLoaded({ key: requestKey, menu: null, error });
      });
    return () => controller.abort();
  }, [menuCode, requestKey]);

  // 앞·다음 카드를 정할 목록 — 진열장과 같은 조건·같은 순서. 조건이 바뀔 때만 다시 받는다.
  const listKey = `${listSearch}:${reloadKey}`;
  const [list, setList] = useState({ key: null, menus: [] });
  useEffect(() => {
    const controller = new AbortController();
    fetchOrdered(filters, controller.signal)
      .then((menus) => setList({ key: listKey, menus }))
      .catch((error) => {
        // 넘기기는 없어도 상세는 볼 수 있다. 실패하면 넘기기만 숨긴다.
        if (!isCanceled(error)) setList({ key: listKey, menus: [] });
      });
    return () => controller.abort();
    // listKey 가 요청에 쓰는 값(진열장 조건)을 모두 담고 있다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listKey]);

  // 상위 계통 이름 (식사 › 한식)
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    const controller = new AbortController();
    getCategories({ signal: controller.signal })
      .then(setCategories)
      .catch(() => {});
    return () => controller.abort();
  }, []);

  if (menuCode === null) {
    return (
      <section className="page">
        <StateCard
          kind="error"
          line="도감 번호를 알아볼 수 없다네."
          fact={`요청한 번호 · ${params.menuCode}`}
          action={
            <Link to={withSearch('/')} className="btn btn-outlined label1 medium">
              진열장으로
            </Link>
          }
        />
      </section>
    );
  }

  const ordered = list.key === listKey ? list.menus : [];
  const index = ordered.findIndex((m) => m.menuCode === menuCode);
  const prev = index > 0 ? ordered[index - 1] : null;
  const next = index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : null;

  // 서버 응답이 오기 전이라도 목록에 이 카드가 있으면 먼저 보여 준다. (넘길 때 불러오는 화면이 끼지 않는다)
  const fresh = loaded.key === requestKey ? loaded : null;
  const error = fresh?.error ?? null;
  const menu = fresh?.menu ?? (error ? null : list.menus.find((m) => m.menuCode === menuCode) ?? null);

  const category = menu && categories.find((c) => c.categoryCode === menu.categoryCode);
  const categoryPath = category?.refCategoryName ? `${category.refCategoryName} › ${category.categoryName}` : menu?.categoryName;

  const fromList = location.state?.fromList === true;
  // 진열장에서 들어왔으면 뒤로 가서 목록의 조건·쪽을 그대로 되살린다. 주소로 바로 들어왔으면 같은 조건의 진열장으로.
  const backToList = () => (fromList ? navigate(-1) : navigate(withSearch('/')));
  const goTo = (target, direction) =>
    navigate(withSearch(`/menus/${target.menuCode}`), { replace: true, state: { fromList, slide: direction } });
  const retry = () => setReloadKey((key) => key + 1);

  return (
    <section className="page">
      <nav aria-label="현재 위치" className="breadcrumb label2 medium">
        <Link to={withSearch('/')}>진열장</Link>
        <ChevronRightIcon size={14} />
        <span aria-current="page">{menu ? menu.menuName : `No.${formatCardNo(menuCode)}`}</span>
      </nav>

      {menu ? (
        <MenuDetail
          key={menu.menuCode}
          menu={menu}
          categoryPath={categoryPath}
          prev={prev}
          next={next}
          linkTo={(target) => withSearch(`/menus/${target.menuCode}`)}
          onNavigate={goTo}
          slideFrom={location.state?.slide ?? null}
          justCreated={location.state?.justCreated === true}
          // 개봉 연출이 끝나면 표시를 지워 새로고침·뒤로가기 때 다시 나오지 않게 한다.
          onRevealEnd={() => navigate(location.pathname + location.search, { replace: true, state: { fromList } })}
          onBack={backToList}
          // 삭제가 실패하면 여기서 던진 오류를 불태우기 대화창이 장부 기록으로 보여 준다.
          onBurn={() => deleteMenu(menu.menuCode)}
          // 다 타면 진열장으로. 지워진 상세 화면으로 되돌아오지 않도록 기록을 바꿔 치운다.
          onBurned={() => navigate(withSearch('/'), { replace: true, state: { burnedMenuName: menu.menuName } })}
        />
      ) : error ? (
        error.type === 'network' ? (
          <StateCard
            kind="offline"
            speaker="상인의 쪽지"
            line="잠시 가게를 비웠다네. 조금 뒤 다시 두드려 주게."
            fact="서버 응답 없음 · localhost:8080"
            action={
              <button type="button" className="btn btn-primary label1 bold" onClick={retry}>
                다시 두드리기
              </button>
            }
          />
        ) : (
          <StateCard
            kind="error"
            line={error.status === 404 ? '장부에서 그 카드를 찾지 못했다네.' : '장부를 펼치다 문제가 생겼다네.'}
            error={error}
            action={
              <Link to={withSearch('/')} className="btn btn-outlined label1 medium">
                진열장으로
              </Link>
            }
          />
        )
      ) : (
        <DetailSkeleton />
      )}
    </section>
  );
};

// 새로 들인 카드를 처음 볼 때 상인이 건네는 말. 전설이면 더 반긴다.
const revealLine = (rarity) =>
  rarity.key === 'legendary'
    ? '“장부에 적었네! 전설 카드라니, 오늘 운이 좋군.”'
    : `“장부에 적었네! ${rarity.name} 카드가 진열장에 들어갔다네.”`;

// 입력 중이거나 대화창이 열려 있으면 ←/→ 로 넘기지 않는다.
const isTyping = (target) =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

const MenuDetail = ({
  menu,
  categoryPath,
  prev,
  next,
  linkTo,
  onNavigate,
  slideFrom,
  justCreated,
  onRevealEnd,
  onBack,
  onBurn,
  onBurned,
}) => {
  const [burnOpen, setBurnOpen] = useState(false);
  // 삭제가 성공한 뒤 카드가 타는 중인지. 다 타면 onBurned 로 진열장에 간다.
  const [burning, setBurning] = useState(false);
  // 이 화면에 머무는 동안은 "방금 들인 카드"로 기억한다. (이동 기록의 표시는 연출이 끝나면 지워진다)
  const [revealing] = useState(justCreated);
  // 넘기는 중이면 'next' | 'prev' — 지금 카드가 밀려난 뒤 옆 카드로 간다.
  const [leaving, setLeaving] = useState(null);
  const leaveTarget = useRef(null);
  const tilt = useTilt();
  const backpack = useBackpack();
  const inBag = backpack.qtyOf(menu.menuCode);
  const rarity = getRarity(menu.menuPrice);
  const soldOut = menu.orderableStatus === 'N';
  const busy = burning || leaving !== null;

  // 동작 줄이기에서는 개봉 애니메이션이 없어 animationend 가 오지 않으므로 표시를 바로 지운다.
  useEffect(() => {
    if (justCreated && reduceMotion()) onRevealEnd();
  }, [justCreated, onRevealEnd]);

  const finishLeave = () => {
    if (!leaveTarget.current) return;
    const { target, direction } = leaveTarget.current;
    leaveTarget.current = null;
    onNavigate(target, direction);
  };

  const startLeave = (target, direction) => {
    if (!target || busy) return;
    leaveTarget.current = { target, direction };
    if (reduceMotion()) {
      finishLeave();
      return;
    }
    setLeaving(direction);
    // 탭이 가려져 애니메이션이 멈춰 있어도 넘어가도록
    window.setTimeout(finishLeave, 400);
  };

  // 키보드 ← → 로 앞·다음 카드
  useEffect(() => {
    const onKey = (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (isTyping(event.target) || document.querySelector('dialog[open]')) return;
      if (event.key === 'ArrowLeft' && prev) startLeave(prev, 'prev');
      if (event.key === 'ArrowRight' && next) startLeave(next, 'next');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const confirmBurn = async () => {
    await onBurn();
    setBurnOpen(false);
    setBurning(true);
  };

  const slideClass = leaving ? `is-leaving-${leaving}` : slideFrom ? `is-entering-${slideFrom}` : '';
  const card = (
    <div className="card-slot detail-card-slot" {...tilt}>
      <CardFace menu={menu} size="large" />
    </div>
  );

  return (
    <article className="detail panel panel-gold">
      <div className="detail-card-col">
        <div
          className={`card-slide ${slideClass}`}
          onAnimationEnd={(event) => {
            if (event.target === event.currentTarget && leaving) finishLeave();
          }}
        >
          {burning ? (
            <BurnEffect onDone={onBurned}>
              <CardFace menu={menu} size="large" />
            </BurnEffect>
          ) : revealing ? (
            <div className={`reveal-stage rarity-${rarity.key}`}>
              <span className="reveal-burst" aria-hidden="true" />
              <div
                className="reveal-card"
                onAnimationEnd={(event) => {
                  if (event.target === event.currentTarget) onRevealEnd();
                }}
              >
                {card}
                <CardBack />
              </div>
            </div>
          ) : (
            card
          )}
        </div>

        {(prev || next) && (
          <>
            <nav className="card-nav" aria-label="도감 넘기기" inert={busy}>
              <NavLink target={prev} direction="prev" linkTo={linkTo} onGo={startLeave} />
              <NavLink target={next} direction="next" linkTo={linkTo} onGo={startLeave} />
            </nav>
            <p className="key-hint caption1 regular">
              키보드 <kbd className="kbd caption1 bold">←</kbd> <kbd className="kbd caption1 bold">→</kbd> 로도 넘긴다
            </p>
          </>
        )}
      </div>

      <div className="detail-body">
        <div className="detail-title">
          <span className={`rarity-tag rarity-${rarity.key} label1 bold`}>
            <span className="gem" aria-hidden="true" />
            {rarity.name} 등급 카드
          </span>
          <h1 className="title2 display-font detail-name">{menu.menuName}</h1>
          <p className="price title3 bold">
            {formatGold(menu.menuPrice)} <span className="headline2 bold">G</span>
          </p>
        </div>

        <div className="npc-say">
          <span className="npc-face">
            <FlameIcon size={20} />
          </span>
          <div className="npc-say-text">
            <p className="npc-name caption1 bold">상인</p>
            <p className="npc-line body2 regular">
              {burning
                ? '“잘 가게… 카드가 재가 되어 사라지는구먼.”'
                : revealing
                ? revealLine(rarity)
                : soldOut
                ? '“아쉽게도 이 카드는 지금 품절이라네. 다시 들어오면 진열해 두지.”'
                : '“눈이 좋군. 이 카드는 지금 바로 내어 줄 수 있다네.”'}
            </p>
          </div>
        </div>

        <dl className="detail-cells">
          <div className="cell">
            <dt className="caption1 medium">도감 번호</dt>
            <dd className="body1 bold">No.{formatCardNo(menu.menuCode)}</dd>
          </div>
          <div className="cell">
            <dt className="caption1 medium">요리 계통</dt>
            <dd className="body1 bold">{categoryPath}</dd>
          </div>
          <div className="cell">
            <dt className="caption1 medium">판매 여부</dt>
            <dd className="body1 bold">{soldOut ? '품절' : '판매 중'}</dd>
          </div>
        </dl>

        {/* 타는 동안에는 다른 동작을 막는다 */}
        <div className="detail-actions" inert={burning}>
          <button type="button" className="btn btn-text label1 medium" onClick={onBack} disabled={burning}>
            <ChevronLeftIcon size={16} />
            진열장으로
          </button>
          <div className="detail-actions-right">
            <Link to={`/menus/${menu.menuCode}/edit`} className="btn btn-outlined label1 medium">
              고쳐 쓰기
            </Link>
            <button
              type="button"
              className="btn btn-primary label1 bold"
              onClick={() => backpack.add(menu.menuCode)}
              disabled={soldOut || burning}
            >
              <BagIcon />
              {soldOut ? '품절이라 담을 수 없음' : inBag > 0 ? `배낭에 ${inBag} · 하나 더` : '배낭에 담기'}
            </button>
            <button
              type="button"
              className="btn btn-danger-outlined label1 bold"
              onClick={() => setBurnOpen(true)}
              disabled={burning}
            >
              {burning ? '타는 중…' : '불태우기'}
            </button>
          </div>
        </div>
      </div>

      <BurnDialog open={burnOpen} menuName={menu.menuName} onConfirm={confirmBurn} onClose={() => setBurnOpen(false)} />
    </article>
  );
};

// 앞·다음 카드. 링크라서 새 탭으로 열 수도 있고, 그냥 누르면 밀어내는 연출 뒤에 넘어간다.
const NavLink = ({ target, direction, linkTo, onGo }) => {
  if (!target) return <span className="card-nav-empty" aria-hidden="true" />;
  const isPrev = direction === 'prev';
  return (
    <Link
      to={linkTo(target)}
      className={`card-nav-link label2 medium is-${direction}`}
      aria-label={`${isPrev ? '앞' : '다음'} 카드: No.${formatCardNo(target.menuCode)} ${target.menuName}`}
      onClick={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        onGo(target, direction);
      }}
    >
      {isPrev && <ChevronLeftIcon size={16} />}
      <span className="nav-text">
        <span className="caption1 medium nav-no">No.{formatCardNo(target.menuCode)}</span>
        <span className="label2 bold nav-name">{target.menuName}</span>
      </span>
      {!isPrev && <ChevronRightIcon size={16} />}
    </Link>
  );
};

const DetailSkeleton = () => (
  <div className="detail panel" aria-busy="true">
    <div className="menu-card is-large skeleton-card">
      <div className="skeleton skeleton-art-large" />
    </div>
    <div className="detail-body">
      <p className="loading-line label1 medium" role="status">
        <FlameIcon size={16} />
        상인이 장부를 뒤지는 중…
      </p>
      <span className="skeleton skeleton-line-long" />
      <span className="skeleton skeleton-line-short" />
    </div>
  </div>
);

export default MenuDetailPage;
