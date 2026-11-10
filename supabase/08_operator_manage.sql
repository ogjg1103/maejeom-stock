-- 매점부(승인된 운영자)도 상품 추가·수정(가격, 숨기기)을 할 수 있게
-- 재고 수정은 원래 운영자도 가능 (03_quantity_and_admin.sql)
-- 운영자 승인·해제, 메뉴 요청 답변은 계속 관리자만

drop policy "관리자는 숨긴 상품도 조회" on public.product;
drop policy "관리자만 상품 추가" on public.product;
drop policy "관리자만 상품 수정" on public.product;

create policy "운영자는 숨긴 상품도 조회" on public.product
  for select to authenticated using (public.is_operator());

create policy "운영자만 상품 추가" on public.product
  for insert to authenticated with check (public.is_operator());

create policy "운영자만 상품 수정" on public.product
  for update to authenticated using (public.is_operator()) with check (public.is_operator());
