import { useEffect, useRef, useState } from 'react';

import { AlertIcon, FlameIcon } from './Icons.jsx';
import { ErrorRecord } from './StateCard.jsx';

// 불태우기(삭제) 확인 — 상인이 한 번 더 묻는다.
// <dialog>.showModal() 을 쓰면 브라우저가 맨 위 층에 띄우고, 포커스를 가두고, Esc 로 닫아 준다.
const BurnDialog = ({ open, menuName, onConfirm, onClose }) => {
  const dialogRef = useRef(null);
  const [burning, setBurning] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const close = () => {
    if (burning) return;
    setError(null);
    onClose();
  };

  const confirm = async () => {
    setBurning(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err);
      setBurning(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="npc-dialog"
      aria-labelledby="burn-title"
      aria-describedby="burn-desc"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="npc-dialog-inner">
        <div className="npc-head">
          <span className="npc-face">
            <FlameIcon size={22} />
          </span>
          <div className="npc-say-text">
            <p className="npc-name caption1 bold">상인</p>
            <h2 id="burn-title" className="heading2 display-font npc-dialog-title">
              정말 이 카드를 불태우겠나?
            </h2>
          </div>
        </div>
        <p id="burn-desc" className="npc-line body2 regular">
          ‘{menuName}’ 카드가 재가 되면 되돌릴 수 없다네. 태운 뒤에는 진열장으로 돌아가지.
        </p>

        {error && (
          <div className="message message-negative" role="alert">
            <span className="message-icon">
              <AlertIcon size={20} />
            </span>
            <div className="message-body">
              <p className="message-title label1 bold">
                {error.type === 'network' ? '“가게 문이 닫혀 있어 태우지 못했다네.”' : '“카드를 태우지 못했다네.”'}
              </p>
              {error.type === 'network' ? (
                <p className="state-fact label2 regular">서버 응답 없음 · localhost:8080</p>
              ) : (
                <ErrorRecord error={error} />
              )}
            </div>
          </div>
        )}

        <div className="npc-dialog-actions">
          <button type="button" className="btn btn-outlined label1 medium" onClick={close} disabled={burning} autoFocus>
            그만두기
          </button>
          <button type="button" className="btn btn-danger label1 bold" onClick={confirm} disabled={burning}>
            {burning ? '태우는 중…' : '불태우기'}
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default BurnDialog;
