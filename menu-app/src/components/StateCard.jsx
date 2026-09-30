import { AlertIcon, DoorIcon, SearchIcon } from './Icons.jsx';

// 빈 결과·오류·연결 실패는 모두 화자 → 대사 → 사실 → 행동 순서를 따른다.
const icons = {
  empty: SearchIcon,
  error: AlertIcon,
  offline: DoorIcon,
};

const StateCard = ({ kind, speaker = '상인', line, fact, error, action }) => {
  const Icon = icons[kind];

  return (
    <div className={`state-card${kind === 'error' ? ' is-error' : ''}`} role={kind === 'empty' ? 'status' : 'alert'}>
      <span className="npc-face">
        <Icon />
      </span>
      <div className="state-text">
        <p className="npc-name caption1 bold">{speaker}</p>
        <p className="state-line headline1 display-font">“{line}”</p>
        {fact && <p className="state-fact label2 regular">{fact}</p>}
        {error && <ErrorRecord error={error} />}
      </div>
      {action}
    </div>
  );
};

// 서버 ErrorResponse 는 말투를 바꾸지 않고 장부 기록 칸에 그대로 담는다.
export const ErrorRecord = ({ error }) => (
  <div className="record">
    <p className="record-label caption1 bold">장부 기록</p>
    <p className="record-title label2 bold">{error.description}</p>
    {error.detail && <p className="record-detail label2 regular">{error.detail}</p>}
    <p className="record-code caption1 regular">{error.code}</p>
  </div>
);

export default StateCard;
