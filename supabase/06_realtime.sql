-- 실시간 반영: 상품·재고 표가 바뀌면 열려 있는 화면에 바로 알려 주기
-- (누가 무엇을 볼 수 있는지는 기존 출입 규칙(RLS)을 그대로 따라요)
alter publication supabase_realtime add table public.product, public.stock_status;
