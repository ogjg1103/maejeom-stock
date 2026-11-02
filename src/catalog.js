// 학생 화면과 관리자 화면이 함께 쓰는 정보

export const CATEGORIES = ['과자', '음료', '젤리', '아이스크림'];

// 사진이 생기기 전까지 카테고리별 그림 글자
export const CATEGORY_EMOJI = { 과자: '🍿', 음료: '🥤', 젤리: '🍬', 아이스크림: '🍦' };

// 카드에 보일 재고 글자: 숫자만 ("5개"), 아직 개수를 안 넣었으면 "–"
export function stockText(p) {
  if (p.quantity == null) return '–';
  return `${p.quantity}개`;
}

// 재고 색: 0개 = 빨강, 1개 이상 = 초록, 개수 모름 = 회색
export function stockClass(p) {
  if (p.quantity == null) return 'stock-unknown';
  return p.quantity === 0 ? 'stock-out' : 'stock-in';
}

// 정렬: 카테고리 → 비싼 가격 먼저 → 가나다순
// (새 상품을 추가해도 순서 번호 없이 알아서 제자리에 들어가요)
export function compareProducts(a, b) {
  return (
    CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category) ||
    b.price - a.price ||
    a.name.localeCompare(b.name, 'ko')
  );
}

// 숫자 1500 → "1,500원"
export function formatPrice(won) {
  return won.toLocaleString('ko-KR') + '원';
}

// 데이터베이스에서 받은 상품 한 줄을 화면에서 쓰기 편한 모양으로
export function flattenProduct(p) {
  return {
    ...p,
    status: p.stock_status?.status ?? 'in',
    quantity: p.stock_status?.quantity ?? null,
    updatedAt: p.stock_status?.updated_at ?? null,
  };
}
