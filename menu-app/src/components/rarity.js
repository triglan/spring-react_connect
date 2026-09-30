// 레어도는 서버 데이터가 아니라 menuPrice 로 화면에서 계산한다. (AGENTS.md 화면 테마)
const tiers = [
  { min: 20000, key: 'legendary', name: '전설' },
  { min: 12000, key: 'epic', name: '영웅' },
  { min: 8000, key: 'rare', name: '희귀' },
  { min: 5000, key: 'uncommon', name: '고급' },
  { min: 0, key: 'common', name: '일반' },
];

export const getRarity = (price) => tiers.find((tier) => price >= tier.min);

export const rarityLegend = [...tiers].reverse();

export const formatGold = (price) => price.toLocaleString('ko-KR');

export const formatCardNo = (menuCode) => String(menuCode).padStart(3, '0');
