import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';

import { isCanceled } from '../api/client.js';
import { deleteMenu, getMenu } from '../api/menus.js';
import BurnDialog from '../components/BurnDialog.jsx';
import CardFace from '../components/CardFace.jsx';
import { ChevronLeftIcon, ChevronRightIcon, FlameIcon } from '../components/Icons.jsx';
import StateCard from '../components/StateCard.jsx';
import { formatCardNo, formatGold, getRarity } from '../components/rarity.js';

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
          onBack={backToList}
          onBurn={async () => {
            await deleteMenu(menu.menuCode);
            // 지운 뒤에는 목록으로. 지워진 상세 화면으로 되돌아오지 않도록 기록을 바꿔 치운다.
            navigate('/', { replace: true, state: { burnedMenuName: menu.menuName } });
          }}
        />
      )}
    </section>
  );
};

const MenuDetail = ({ menu, onBack, onBurn }) => {
  const [burnOpen, setBurnOpen] = useState(false);
  const rarity = getRarity(menu.menuPrice);
  const soldOut = menu.orderableStatus === 'N';

  return (
    <article className="detail panel panel-gold">
      <CardFace menu={menu} size="large" />

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
              {soldOut
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

        <div className="detail-actions">
          <button type="button" className="btn btn-text label1 medium" onClick={onBack}>
            <ChevronLeftIcon size={16} />
            진열장으로
          </button>
          <div className="detail-actions-right">
            <Link to={`/menus/${menu.menuCode}/edit`} className="btn btn-outlined label1 medium">
              고쳐 쓰기
            </Link>
            <button type="button" className="btn btn-danger-outlined label1 bold" onClick={() => setBurnOpen(true)}>
              불태우기
            </button>
          </div>
        </div>
      </div>

      <BurnDialog open={burnOpen} menuName={menu.menuName} onConfirm={onBurn} onClose={() => setBurnOpen(false)} />
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
