// 학생 화면과 관리자 화면이 함께 쓰는 정보

export const CATEGORIES = ['과자', '음료', '젤리', '아이스크림'];

// 사진이 생기기 전까지 카테고리별 그림 글자
export const CATEGORY_EMOJI = { 과자: '🍿', 음료: '🥤', 젤리: '🍬', 아이스크림: '🍦' };

// 재고 상태 코드 → 화면에 보일 글자
export const STATUS_LABEL = { in: '있음', low: '조금 남음', out: '품절' };

// 카드에 보일 재고 글자: 개수를 알면 "5개 남음", 모르면 "있음" 같은 상태
export function stockText(p) {
  if (p.quantity == null) return STATUS_LABEL[p.status];
  if (p.quantity === 0) return '품절';
  return `${p.quantity}개 남음`;
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
