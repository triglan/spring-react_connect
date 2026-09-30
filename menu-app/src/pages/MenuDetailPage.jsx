import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';

import { isCanceled } from '../api/client.js';
import { deleteMenu, getMenu } from '../api/menus.js';
import BurnDialog from '../components/BurnDialog.jsx';
import BurnEffect from '../components/BurnEffect.jsx';
import CardBack from '../components/CardBack.jsx';
import CardFace from '../components/CardFace.jsx';
import { ChevronLeftIcon, ChevronRightIcon, FlameIcon } from '../components/Icons.jsx';
import StateCard from '../components/StateCard.jsx';
import { formatCardNo, formatGold, getRarity } from '../components/rarity.js';
import useTilt from '../components/useTilt.js';

// 주소의 menuCode 가 양의 정수가 아니면 서버에 묻지 않는다. (서버는 500 을 돌려준다)
const readMenuCode = (value) => {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 ? number : null;
};

const MenuDetailPage = () => {
  const params = useParams();
  const menuCode = readMenuCode(params.menuCode);
  const navigate = useNavigate();
  const location = useLocation();
  const [reloadKey, setReloadKey] = useState(0);
  const requestKey = `${menuCode}:${reloadKey}`;
  const [loaded, setLoaded] = useState({ key: null, menu: null, error: null });

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

  // 앱 안에서 넘어왔으면 뒤로 가서 목록의 조건·쪽을 그대로 되살린다.
  const backToList = () => (location.key !== 'default' ? navigate(-1) : navigate('/'));
  const retry = () => setReloadKey((key) => key + 1);

  if (menuCode === null) {
    return (
      <section className="page">
        <StateCard
          kind="error"
          line="도감 번호를 알아볼 수 없다네."
          fact={`요청한 번호 · ${params.menuCode}`}
          action={
            <Link to="/" className="btn btn-outlined label1 medium">
              진열장으로
            </Link>
          }
        />
      </section>
    );
  }

  const isLoading = loaded.key !== requestKey;
  const { menu, error } = isLoading ? { menu: null, error: null } : loaded;

  return (
    <section className="page">
      <nav aria-label="현재 위치" className="breadcrumb label2 medium">
        <Link to="/">진열장</Link>
        <ChevronRightIcon size={14} />
        <span aria-current="page">{menu ? menu.menuName : `No.${formatCardNo(menuCode)}`}</span>
      </nav>

      {isLoading ? (
        <DetailSkeleton />
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
              <Link to="/" className="btn btn-outlined label1 medium">
                진열장으로
              </Link>
            }
          />
        )
      ) : (
        <MenuDetail
          menu={menu}
          justCreated={location.state?.justCreated === true}
          // 개봉 연출이 끝나면 표시를 지워 새로고침·뒤로가기 때 다시 나오지 않게 한다.
          onRevealEnd={() => navigate(location.pathname, { replace: true, state: null })}
          onBack={backToList}
          // 삭제가 실패하면 여기서 던진 오류를 불태우기 대화창이 장부 기록으로 보여 준다.
          onBurn={() => deleteMenu(menu.menuCode)}
          // 다 타면 목록으로. 지워진 상세 화면으로 되돌아오지 않도록 기록을 바꿔 치운다.
          onBurned={() => navigate('/', { replace: true, state: { burnedMenuName: menu.menuName } })}
        />
      )}
    </section>
  );
};

// 새로 들인 카드를 처음 볼 때 상인이 건네는 말. 전설이면 더 반긴다.
const revealLine = (rarity) =>
  rarity.key === 'legendary'
    ? '“장부에 적었네! 전설 카드라니, 오늘 운이 좋군.”'
    : `“장부에 적었네! ${rarity.name} 카드가 진열장에 들어갔다네.”`;

const MenuDetail = ({ menu, justCreated, onRevealEnd, onBack, onBurn, onBurned }) => {
  const [burnOpen, setBurnOpen] = useState(false);
  // 삭제가 성공한 뒤 카드가 타는 중인지. 다 타면 onBurned 로 목록에 간다.
  const [burning, setBurning] = useState(false);
  // 이 화면에 머무는 동안은 "방금 들인 카드"로 기억한다. (이동 기록의 표시는 연출이 끝나면 지워진다)
  const [revealing] = useState(justCreated);
  const tilt = useTilt();

  // 동작 줄이기에서는 개봉 애니메이션이 없어 animationend 가 오지 않으므로 표시를 바로 지운다.
  useEffect(() => {
    if (justCreated && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) onRevealEnd();
  }, [justCreated, onRevealEnd]);
  const rarity = getRarity(menu.menuPrice);
  const soldOut = menu.orderableStatus === 'N';
  const card = (
    <div className="card-slot detail-card-slot" {...tilt}>
      <CardFace menu={menu} size="large" />
    </div>
  );

  const confirmBurn = async () => {
    await onBurn();
    setBurnOpen(false);
    setBurning(true);
  };

  return (
    <article className="detail panel panel-gold">
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
            <dd className="body1 bold">{menu.categoryName}</dd>
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
