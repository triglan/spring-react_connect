// 폼 값은 입력칸 그대로(문자열)로 들고 있다가, 보낼 때 서버 형식으로 바꾼다.

export const NAME_MAX = 30; // tbl_menu.menu_name VARCHAR(30)
const PRICE_MAX = 2147483647; // tbl_menu.menu_price INT

export const emptyForm = { menuName: '', menuPrice: '', categoryCode: '', orderableStatus: 'Y' };

export const toForm = (menu) => ({
  menuName: menu.menuName,
  menuPrice: String(menu.menuPrice),
  categoryCode: String(menu.categoryCode),
  orderableStatus: menu.orderableStatus,
});

// 비어 있거나 잘못된 값이 있으면 보내지 않고 화면에 알린다. 메시지는 상인의 말투로.
export const validateForm = (form) => {
  const errors = {};
  const name = form.menuName.trim();
  const price = Number(form.menuPrice);

  if (name === '') errors.menuName = '이름 없는 카드는 팔 수 없다네.';
  else if (name.length > NAME_MAX) errors.menuName = `이름은 ${NAME_MAX}자까지만 적을 수 있다네.`;

  if (form.menuPrice.trim() === '') errors.menuPrice = '몸값을 적어 주게.';
  else if (!Number.isInteger(price) || price <= 0) errors.menuPrice = '몸값은 1 G 이상의 정수로 적어 주게.';
  else if (price > PRICE_MAX) errors.menuPrice = '장부에 적을 수 없을 만큼 큰 몸값이라네.';

  if (form.categoryCode === '') errors.categoryCode = '어느 계통 요리인지 골라 주게.';

  return errors;
};

export const toMenu = (form) => ({
  menuName: form.menuName.trim(),
  menuPrice: Number(form.menuPrice),
  categoryCode: Number(form.categoryCode),
  orderableStatus: form.orderableStatus === 'N' ? 'N' : 'Y',
});
