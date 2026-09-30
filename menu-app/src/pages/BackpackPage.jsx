import { useEffect, useState } from 'react';
import { Link } from 'react-router';

import { isCanceled } from '../api/client.js';
import { getMenus } from '../api/menus.js';
import { QTY_MAX, useBackpack } from '../components/backpack.js';
import CheckoutDialog from '../components/CheckoutDialog.jsx';
import { BagIcon, FlameIcon } from '../components/Icons.jsx';
import StateCard from '../components/StateCard.jsx';
import { formatCardNo, formatGold, getRarity } from '../components/rarity.js';

// 배낭에는 menuCode·수량만 있다. 열 때마다 GET /api/menus 로 몸값·판매 여부를 다시 맞춘다.
// 담은 뒤 품절됐거나(orderableStatus 'N') 진열장에서 사라진 카드는 계산에서 뺀다.
const BackpackPage = () => {
  const { items, setQty, remove } = useBackpack();
  const [reloadKey, setReloadKey] = useState(0);
  const [loaded, setLoaded] = useState({ key: null, menus: null, error: null });
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    getMenus({ signal: controller.signal })
      .then((menus) => setLoaded({ key: reloadKey, menus, error: null }))
      .catch((error) => {
        if (isCanceled(error)) return;
        setLoaded({ key: reloadKey, menus: null, error });
      });
    return () => controller.abort();
  }, [reloadKey]);

  const isLoading = loaded.key !== reloadKey;

  const rows = items.map((item) => {
    const menu = loaded.menus?.find((m) => m.menuCode === item.menuCode) ?? null;
    const state = !menu ? 'gone' : menu.orderableStatus === 'N' ? 'soldout' : 'ok';
    return { ...item, menu, state, subtotal: state === 'ok' ? menu.menuPrice * item.qty : 0 };
  });
  const payable = rows.filter((row) => row.state === 'ok');
  const excluded = rows.filter((row) => row.state !== 'ok');
  const total = payable.reduce((sum, row) => sum + row.subtotal, 0);
  const payableCount = payable.reduce((sum, row) => sum + row.qty, 0);
  const excludedCount = excluded.reduce((sum, row) => sum + row.qty, 0);

  const checkout = () => {
    setReceipt({ total, count: payableCount });
    remove(payable.map((row) => row.menuCode));
  };

  return (
    <section className="page">
      <div className="page-head">
        <div className="page-head-text">
          <h1 className="page-title title2 display-font">모험가의 배낭</h1>
          <p className="page-desc body2 regular">“마음에 드는 카드를 잘 골랐군. 계산은 이쪽에서 하게.”</p>
        </div>
      </div>

      {items.length === 0 ? (
        <StateCard
          kind="empty"
          icon={BagIcon}
          line="배낭이 텅 비었군. 진열장부터 둘러보게."
          fact="담은 카드 0장"
          action={
            <Link to="/" className="btn btn-outlined label1 medium">
              진열장으로
            </Link>
          }
        />
      ) : isLoading ? (
        <div className="panel bag-loading" aria-busy="true">
          <p className="loading-line label1 medium" role="status">
            <FlameIcon size={16} />
            상인이 배낭 속 카드를 장부와 맞춰 보는 중…
          </p>
        </div>
      ) : loaded.error ? (
        loaded.error.type === 'network' ? (
          <StateCard
            kind="offline"
            speaker="상인의 쪽지"
            line="잠시 가게를 비웠다네. 조금 뒤 다시 두드려 주게."
            fact="서버 응답 없음 · localhost:8080"
            action={
              <button type="button" className="btn btn-primary label1 bold" onClick={() => setReloadKey((k) => k + 1)}>
                다시 두드리기
              </button>
            }
          />
        ) : (
          <StateCard kind="error" line="장부를 펼치다 문제가 생겼다네." error={loaded.error} />
        )
      ) : (
        <div className="bag-layout">
          <ul className="panel bag-list" aria-label="배낭에 담은 카드">
            {rows.map((row) => (
              <BagRow key={row.menuCode} row={row} onQty={setQty} onRemove={remove} />
            ))}
          </ul>

          <aside className="panel panel-gold bag-summary" aria-label="계산서">
            <p className="headline1 display-font bag-summary-title">계산서</p>
            <dl className="label1 medium">
              <div>
                <dt>담은 카드</dt>
                <dd>{payableCount}장</dd>
              </div>
              {excludedCount > 0 && (
                <div>
                  <dt>계산에서 빠진 카드</dt>
                  <dd className="warn-tag">{excludedCount}장</dd>
                </div>
              )}
              <div className="bag-total headline2 bold">
                <dt>합계</dt>
                <dd className="price">{formatGold(total)} G</dd>
              </div>
            </dl>
            <button type="button" className="btn btn-primary label1 bold" onClick={checkout} disabled={payableCount === 0}>
              계산하기
            </button>
            <button
              type="button"
              className="btn btn-text label2 medium"
              onClick={() => remove(items.map((item) => item.menuCode))}
            >
              배낭 비우기
            </button>
            <p className="caption1 regular bag-note">
              배낭은 이 브라우저에만 보관된다. 몸값과 판매 여부는 열 때마다 진열장 기준으로 다시 맞춘다.
            </p>
          </aside>
        </div>
      )}

      <CheckoutDialog receipt={receipt} onClose={() => setReceipt(null)} />
    </section>
  );
};

const BagRow = ({ row, onQty, onRemove }) => {
  const { menu, qty, state } = row;

  if (state === 'gone') {
    return (
      <li className="bag-row is-off is-gone">
        <span className="bag-rarity" />
        <div className="bag-name">
          <span className="headline2 display-font bag-gone-name">No.{formatCardNo(row.menuCode)}</span>
          <span className="warn-tag caption1 bold">진열장에서 사라진 카드다 · 계산에서 빠진다</span>
        </div>
        <span />
        <span />
        <button type="button" className="btn btn-text label2 medium" onClick={() => onRemove(row.menuCode)}>
          빼기
        </button>
      </li>
    );
  }

  const rarity = getRarity(menu.menuPrice);
  return (
    <li className={`bag-row rarity-${rarity.key}${state === 'soldout' ? ' is-off' : ''}`}>
      <span className="bag-rarity" />
      <div className="bag-name">
        <Link to={`/menus/${menu.menuCode}`} className="headline2 display-font">
          {menu.menuName}
        </Link>
        {state === 'soldout' ? (
          <span className="warn-tag caption1 bold">담은 뒤 품절됐다네 · 계산에서 빠진다</span>
        ) : (
          <span className="caption1 medium bag-meta">
            No.{formatCardNo(menu.menuCode)} · {menu.categoryName} · <span className="rarity-tag">{rarity.name}</span>
          </span>
        )}
      </div>
      <span className="price label1 bold">{formatGold(menu.menuPrice)} G</span>
      <div className="stepper" role="group" aria-label={`${menu.menuName} 수량`}>
        <button type="button" className="label1 bold" onClick={() => onQty(menu.menuCode, qty - 1)} aria-label="하나 빼기">
          −
        </button>
        <output className="label1 bold" aria-live="polite">
          {qty}
        </output>
        <button
          type="button"
          className="label1 bold"
          onClick={() => onQty(menu.menuCode, qty + 1)}
          disabled={state === 'soldout' || qty >= QTY_MAX}
          aria-label="하나 더"
        >
          +
        </button>
      </div>
      {state === 'soldout' ? (
        <button type="button" className="btn btn-text label2 medium" onClick={() => onRemove(menu.menuCode)}>
          빼기
        </button>
      ) : (
        <span className="price headline2 bold bag-subtotal">{formatGold(row.subtotal)} G</span>
      )}
    </li>
  );
};

export default BackpackPage;
