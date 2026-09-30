import { useEffect, useRef } from 'react';
import { Link } from 'react-router';

import { FlameIcon } from './Icons.jsx';
import { formatGold } from './rarity.js';

// 계산을 마친 뒤 상인이 값을 받는 대화창. 서버에 주문 API 가 없어 기록은 남지 않는다.
const CheckoutDialog = ({ receipt, onClose }) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (receipt && !dialog.open) dialog.showModal();
    if (!receipt && dialog.open) dialog.close();
  }, [receipt]);

  return (
    <dialog
      ref={dialogRef}
      className="npc-dialog"
      aria-labelledby="pay-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {receipt && (
        <div className="npc-dialog-inner">
          <div className="npc-head">
            <span className="npc-face">
              <FlameIcon size={22} />
            </span>
            <div className="npc-say-text">
              <p className="npc-name caption1 bold">상인</p>
              <h2 id="pay-title" className="heading2 display-font npc-dialog-title">
                좋은 거래였네!
              </h2>
            </div>
          </div>
          <p className="npc-line body2 regular">
            {formatGold(receipt.total)} G, 잘 받았네. 카드 {receipt.count}장은 배낭에서 꺼내 건네주지. 또 들르게, 모험가.
          </p>
          <div className="npc-dialog-actions">
            <button type="button" className="btn btn-outlined label1 medium" onClick={onClose}>
              닫기
            </button>
            <Link to="/" className="btn btn-primary label1 bold">
              진열장으로
            </Link>
          </div>
        </div>
      )}
    </dialog>
  );
};

export default CheckoutDialog;
