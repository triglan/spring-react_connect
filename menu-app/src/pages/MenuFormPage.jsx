import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import { getCategories, groupCategories } from '../api/categories.js';
import { isCanceled } from '../api/client.js';
import { createMenu, getMenu, updateMenu } from '../api/menus.js';
import { FlameIcon } from '../components/Icons.jsx';
import MenuForm from '../components/MenuForm.jsx';
import StateCard from '../components/StateCard.jsx';
import { emptyForm, toForm } from '../components/menuForm.js';
import { formatCardNo } from '../components/rarity.js';

const readMenuCode = (value) => {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 ? number : null;
};

// /menus/new 는 등록, /menus/:menuCode/edit 는 수정. 둘은 같은 장부(MenuForm)를 쓴다.
const MenuFormPage = () => {
  const params = useParams();
  const isEdit = params.menuCode !== undefined;
  const menuCode = isEdit ? readMenuCode(params.menuCode) : null;
  const navigate = useNavigate();
  const [reloadKey, setReloadKey] = useState(0);
  const requestKey = `${params.menuCode ?? 'new'}:${reloadKey}`;
  const [loaded, setLoaded] = useState({ key: null, groups: [], menu: null, error: null });

  useEffect(() => {
    if (isEdit && menuCode === null) return undefined;
    const controller = new AbortController();
    const { signal } = controller;

    Promise.all([getCategories({ signal }), isEdit ? getMenu({ menuCode, signal }) : Promise.resolve(null)])
      .then(([categories, menu]) =>
        setLoaded({ key: requestKey, groups: groupCategories(categories), categories, menu, error: null }),
      )
      .catch((error) => {
        if (isCanceled(error)) return;
        setLoaded({ key: requestKey, groups: [], menu: null, error });
      });
    return () => controller.abort();
  }, [isEdit, menuCode, requestKey]);

  const title = isEdit ? '장부 고쳐 쓰기' : '장부에 새 카드 적기';

  if (isEdit && menuCode === null) {
    return (
      <section className="page form-page">
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

  // 저장이 끝나면 그 메뉴의 상세 화면으로 간다. 폼으로 되돌아오지 않도록 기록을 바꿔 치운다.
  const submit = async (menu) => {
    const saved = isEdit ? await updateMenu(menuCode, menu) : await createMenu(menu);
    navigate(`/menus/${saved.menuCode}`, { replace: true });
  };

  return (
    <section className="page form-page">
      <div className="page-head-text">
        <h1 className="page-title title2 display-font">
          {title}
          {isEdit && <span className="page-title-sub headline1"> · No.{formatCardNo(menuCode)}</span>}
        </h1>
        <p className="page-desc body2 regular">“이름, 몸값, 요리 계통은 꼭 적어 주게. 빠진 게 있으면 받아 줄 수 없다네.”</p>
      </div>

      {isLoading ? (
        <div className="menu-form panel" aria-busy="true">
          <p className="loading-line label1 medium" role="status">
            <FlameIcon size={16} />
            상인이 장부를 펼치는 중…
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
          <StateCard
            kind="error"
            line={loaded.error.status === 404 ? '장부에서 그 카드를 찾지 못했다네.' : '장부를 펼치다 문제가 생겼다네.'}
            error={loaded.error}
            action={
              <Link to="/" className="btn btn-outlined label1 medium">
                진열장으로
              </Link>
            }
          />
        )
      ) : (
        <MenuForm
          key={requestKey}
          initialForm={loaded.menu ? toForm(loaded.menu) : emptyForm}
          categoryGroups={loaded.groups}
          currentCategory={
            loaded.menu
              ? loaded.categories.find((category) => category.categoryCode === loaded.menu.categoryCode)
              : null
          }
          submitLabel={isEdit ? '고쳐 적기' : '장부에 적기'}
          busyLabel="장부에 적는 중…"
          cancelTo={isEdit ? `/menus/${menuCode}` : '/'}
          onSubmit={submit}
        />
      )}
    </section>
  );
};

export default MenuFormPage;
