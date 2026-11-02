-- 남은 개수 표시 + 관리자 상품 추가를 위한 준비

-- 1) 남은 개수 칸 추가 (비어 있으면 "개수 모름" → 상태만 표시)
alter table public.stock_status
  add column quantity integer check (quantity >= 0);

-- 2) 개수가 바뀌면 상태를 자동으로 계산
--    0개 = 품절, 1~3개 = 조금 남음, 4개 이상 = 있음
create or replace function public.sync_status_from_quantity()
returns trigger language plpgsql as $$
begin
  if new.quantity is not null then
    new.status := case
      when new.quantity = 0 then 'out'
      when new.quantity <= 3 then 'low'
      else 'in'
    end;
  end if;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;

create trigger stock_status_sync
  before insert or update on public.stock_status
  for each row execute function public.sync_status_from_quantity();

-- 3) 새 상품을 추가하면 재고 상태 줄도 자동으로 만들기
create or replace function public.create_stock_for_product()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.stock_status (product_id) values (new.id);
  return new;
end $$;

create trigger product_create_stock
  after insert on public.product
  for each row execute function public.create_stock_for_product();

-- 4) 운영자 표 (PRD의 Operator): 로그인한 사람 중 승인된 사람만 등록
create table public.operator (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  role       text not null check (role in ('operator', 'admin')),
  approved   boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.operator enable row level security;

create policy "본인 운영자 정보 조회" on public.operator
  for select to authenticated using (id = auth.uid());

grant select on public.operator to authenticated;

-- 5) "지금 로그인한 사람이 관리자/운영자인가?" 확인 함수
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.operator
    where id = auth.uid() and role = 'admin' and approved
  );
$$;

create or replace function public.is_operator()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.operator
    where id = auth.uid() and role in ('operator', 'admin') and approved
  );
$$;

-- 6) 쓰기 규칙: 관리자만 상품 추가·수정, 운영자·관리자는 재고 수정
create policy "관리자는 숨긴 상품도 조회" on public.product
  for select to authenticated using (public.is_admin());

create policy "관리자만 상품 추가" on public.product
  for insert to authenticated with check (public.is_admin());

create policy "관리자만 상품 수정" on public.product
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "운영자만 재고 수정" on public.stock_status
  for update to authenticated using (public.is_operator()) with check (public.is_operator());

grant insert, update on public.product to authenticated;
grant update on public.stock_status to authenticated;
