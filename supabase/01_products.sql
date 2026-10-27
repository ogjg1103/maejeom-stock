-- 2단계: 상품 표와 재고 상태 표 만들기
-- Supabase 화면의 SQL Editor에 붙여 넣고 Run을 누르면 실행돼요.

-- 1) 상품 표 (PRD의 Product)
create table public.product (
  id            bigint generated always as identity primary key,
  name          text    not null,
  category      text    not null,
  price         integer not null,
  emoji         text,                         -- 사진이 생기기 전까지 쓰는 그림 글자
  photo_url     text,
  display_order integer not null default 0,   -- 진열 순서 (작을수록 앞)
  hidden        boolean not null default false,
  created_at    timestamptz not null default now()
);

-- 2) 재고 상태 표 (PRD의 StockStatus): 상품 하나당 현재 상태 1개
create table public.stock_status (
  product_id bigint primary key references public.product(id) on delete cascade,
  status     text not null default 'in' check (status in ('in', 'low', 'out')),
  updated_at timestamptz not null default now(),
  updated_by uuid                              -- 5단계(로그인)부터 채워져요
);

-- 3) 출입 규칙(RLS): 지금은 "누구나 읽기만" 가능, 쓰기는 아무도 못 해요
alter table public.product      enable row level security;
alter table public.stock_status enable row level security;

create policy "누구나 숨기지 않은 상품 조회" on public.product
  for select to anon, authenticated using (hidden = false);

create policy "누구나 재고 상태 조회" on public.stock_status
  for select to anon, authenticated using (true);

grant select on public.product, public.stock_status to anon, authenticated;

-- 4) 1단계 가짜 상품 10개 옮겨 넣기
insert into public.product (name, category, price, emoji, display_order) values
  ('포카칩 오리지널', '과자',       1500, '🥔', 1),
  ('새우깡',          '과자',       1300, '🦐', 2),
  ('초코파이',        '과자',        600, '🍫', 3),
  ('바나나우유',      '음료',       1700, '🍌', 4),
  ('이온음료',        '음료',       1500, '🥤', 5),
  ('생수 500ml',      '음료',        800, '💧', 6),
  ('소보로빵',        '빵',         1200, '🥐', 7),
  ('크림빵',          '빵',         1200, '🍞', 8),
  ('쭈쭈바',          '아이스크림', 1000, '🍦', 9),
  ('콘 아이스크림',   '아이스크림', 1800, '🍨', 10);

insert into public.stock_status (product_id, status, updated_at)
select p.id, s.status, now() - (s.min_ago || ' minutes')::interval
from public.product p
join (values
  ('포카칩 오리지널', 'in',  3),
  ('새우깡',          'low', 8),
  ('초코파이',        'out', 1),
  ('바나나우유',      'out', 2),
  ('이온음료',        'in',  15),
  ('생수 500ml',      'in',  40),
  ('소보로빵',        'low', 5),
  ('크림빵',          'in',  5),
  ('쭈쭈바',          'in',  12),
  ('콘 아이스크림',   'out', 20)
) as s(name, status, min_ago) on s.name = p.name;
