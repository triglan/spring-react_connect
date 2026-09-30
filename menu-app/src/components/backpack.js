import { createContext, useContext } from 'react';

// 모험가의 배낭 — 여러 화면(헤더·진열장·배낭)이 함께 쓰는 값이라 Context 로 나눈다.
// 서버에 주문 API 가 없어서 브라우저(localStorage)에만 둔다.
// 저장하는 것은 menuCode 와 수량뿐이다. 몸값·판매 여부는 배낭 화면이 열릴 때 서버 값으로 다시 맞춘다.

export const BACKPACK_KEY = 'adventurers-table.backpack';
export const QTY_MAX = 99;

export const BackpackContext = createContext(null);

export const useBackpack = () => {
  const context = useContext(BackpackContext);
  if (!context) throw new Error('useBackpack 은 BackpackProvider 안에서만 쓸 수 있다.');
  return context;
};

// 저장소가 비었거나, 막혀 있거나, 모양이 틀리면 빈 배낭으로 본다.
export const readBackpack = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(BACKPACK_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => Number.isInteger(item?.menuCode) && Number.isInteger(item?.qty) && item.qty > 0)
      .map((item) => ({ menuCode: item.menuCode, qty: Math.min(item.qty, QTY_MAX) }));
  } catch {
    return [];
  }
};

export const writeBackpack = (items) => {
  try {
    window.localStorage.setItem(BACKPACK_KEY, JSON.stringify(items));
  } catch {
    // 저장이 막힌 브라우저(사생활 보호 모드 등)에서는 이번 방문 동안만 기억한다.
  }
};
