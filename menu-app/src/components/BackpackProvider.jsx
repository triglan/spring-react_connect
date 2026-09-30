import { useCallback, useEffect, useMemo, useState } from 'react';

import { BACKPACK_KEY, BackpackContext, QTY_MAX, readBackpack, writeBackpack } from './backpack.js';

const BackpackProvider = ({ children }) => {
  const [items, setItems] = useState(readBackpack);

  useEffect(() => writeBackpack(items), [items]);

  // 다른 탭에서 배낭을 바꾸면 이 탭도 맞춘다.
  useEffect(() => {
    const sync = (event) => {
      if (event.key === BACKPACK_KEY) setItems(readBackpack());
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const add = useCallback((menuCode) => {
    setItems((prev) => {
      const found = prev.find((item) => item.menuCode === menuCode);
      if (!found) return [...prev, { menuCode, qty: 1 }];
      return prev.map((item) =>
        item.menuCode === menuCode ? { ...item, qty: Math.min(item.qty + 1, QTY_MAX) } : item,
      );
    });
  }, []);

  const setQty = useCallback((menuCode, qty) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((item) => item.menuCode !== menuCode)
        : prev.map((item) => (item.menuCode === menuCode ? { ...item, qty: Math.min(qty, QTY_MAX) } : item)),
    );
  }, []);

  const remove = useCallback((menuCodes) => {
    const drop = new Set([menuCodes].flat());
    setItems((prev) => prev.filter((item) => !drop.has(item.menuCode)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((sum, item) => sum + item.qty, 0),
      qtyOf: (menuCode) => items.find((item) => item.menuCode === menuCode)?.qty ?? 0,
      add,
      setQty,
      remove,
      clear,
    }),
    [items, add, setQty, remove, clear],
  );

  return <BackpackContext.Provider value={value}>{children}</BackpackContext.Provider>;
};

export default BackpackProvider;
