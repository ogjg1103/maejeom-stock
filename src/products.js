// 1단계용 가짜 상품 데이터예요.
// 2단계에서 이 목록은 Supabase 데이터베이스로 옮겨지고, 이 파일은 지워져요.
//
// status(재고 상태)는 PRD에 정한 3가지 중 하나예요.
//   'in'  = 있음,  'low' = 조금 남음,  'out' = 품절
// updatedMinAgo = 몇 분 전에 마지막으로 바뀌었는지 (가짜 값)

export const CATEGORIES = ['전체', '과자', '음료', '빵', '아이스크림'];

export const products = [
  { id: 1,  name: '포카칩 오리지널', category: '과자',       price: 1500, emoji: '🥔', status: 'in',  updatedMinAgo: 3 },
  { id: 2,  name: '새우깡',          category: '과자',       price: 1300, emoji: '🦐', status: 'low', updatedMinAgo: 8 },
  { id: 3,  name: '초코파이',        category: '과자',       price: 600,  emoji: '🍫', status: 'out', updatedMinAgo: 1 },
  { id: 4,  name: '바나나우유',      category: '음료',       price: 1700, emoji: '🍌', status: 'out', updatedMinAgo: 2 },
  { id: 5,  name: '이온음료',        category: '음료',       price: 1500, emoji: '🥤', status: 'in',  updatedMinAgo: 15 },
  { id: 6,  name: '생수 500ml',      category: '음료',       price: 800,  emoji: '💧', status: 'in',  updatedMinAgo: 40 },
  { id: 7,  name: '소보로빵',        category: '빵',         price: 1200, emoji: '🥐', status: 'low', updatedMinAgo: 5 },
  { id: 8,  name: '크림빵',          category: '빵',         price: 1200, emoji: '🍞', status: 'in',  updatedMinAgo: 5 },
  { id: 9,  name: '쭈쭈바',          category: '아이스크림', price: 1000, emoji: '🍦', status: 'in',  updatedMinAgo: 12 },
  { id: 10, name: '콘 아이스크림',   category: '아이스크림', price: 1800, emoji: '🍨', status: 'out', updatedMinAgo: 20 },
];
