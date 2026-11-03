import { supabase } from './supabase.js';

// 실시간 반영: 상품·재고 표가 바뀌면 onChange를 불러요.
// - 판매 한 번에 여러 상품이 한꺼번에 바뀌므로, 0.3초 모아서 한 번만 불러요.
// - 휴대폰 화면을 껐다 켜거나 다른 앱에 갔다 오면, 그동안 놓친 변경이 있을 수 있어서 한 번 더 불러요.
// - onStatus(true/false): 실시간 연결이 됐는지 알려 줘요 (화면에 표시용).
export function watchStock(onChange, onStatus = () => {}) {
  let timer = null;
  const refresh = () => {
    clearTimeout(timer);
    timer = setTimeout(onChange, 300);
  };

  supabase
    .channel('stock-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_status' }, refresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'product' }, refresh)
    .subscribe((status) => onStatus(status === 'SUBSCRIBED'));

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refresh();
  });
}
