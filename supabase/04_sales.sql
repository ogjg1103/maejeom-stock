-- 판매 화면: 판매 기록 + "판매 완료"와 "판매 취소" 처리

-- 1) 판매 한 건 (영수증 한 장)
create table public.sale (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  operator_id uuid references auth.users(id) default auth.uid(),
  total       integer not null,             -- 합계
  paid        integer not null,             -- 받은 돈
  canceled_at timestamptz                   -- 취소했으면 취소한 시각
);

-- 2) 판매 한 건에 담긴 상품들 (팔 때의 이름·가격을 그대로 저장)
create table public.sale_item (
  id         bigint generated always as identity primary key,
  sale_id    bigint not null references public.sale(id) on delete cascade,
  product_id bigint references public.product(id) on delete set null,
  name       text    not null,
  price      integer not null,
  qty        integer not null check (qty > 0)
);

alter table public.sale      enable row level security;
alter table public.sale_item enable row level security;

create policy "운영자는 판매 기록 조회" on public.sale
  for select to authenticated using (public.is_operator());
create policy "운영자는 판매 상품 조회" on public.sale_item
  for select to authenticated using (public.is_operator());

grant select on public.sale, public.sale_item to authenticated;

-- 3) 판매 완료: 기록 저장 + 재고 빼기를 한 번에 (중간에 실패하면 전부 없던 일로)
--    가격은 화면이 보낸 값이 아니라 데이터베이스의 현재 가격으로 계산해요.
create or replace function public.make_sale(items jsonb, paid integer)
returns public.sale
language plpgsql security definer set search_path = public as $$
declare
  new_sale  public.sale;
  item      jsonb;
  p         public.product;
  item_qty  integer;
  sum_total integer := 0;
begin
  if not public.is_operator() then
    raise exception '판매 권한이 없어요.';
  end if;
  if items is null or jsonb_array_length(items) = 0 then
    raise exception '담긴 상품이 없어요.';
  end if;

  insert into public.sale (operator_id, total, paid)
  values (auth.uid(), 0, 0)
  returning * into new_sale;

  for item in select * from jsonb_array_elements(items) loop
    item_qty := (item->>'qty')::integer;
    select * into p from public.product where id = (item->>'product_id')::bigint;
    if not found then
      raise exception '없는 상품이 담겨 있어요.';
    end if;

    insert into public.sale_item (sale_id, product_id, name, price, qty)
    values (new_sale.id, p.id, p.name, p.price, item_qty);

    sum_total := sum_total + p.price * item_qty;

    -- 개수를 아는 상품만 빼기 (0개 밑으로는 안 내려가게)
    update public.stock_status
    set quantity = greatest(quantity - item_qty, 0)
    where product_id = p.id and quantity is not null;
  end loop;

  if paid is not null and paid < sum_total then
    raise exception '받은 돈이 합계보다 적어요.';
  end if;

  update public.sale
  set total = sum_total, paid = coalesce(make_sale.paid, sum_total)
  where id = new_sale.id
  returning * into new_sale;

  return new_sale;
end $$;

-- 4) 판매 취소: 취소 표시 + 뺐던 재고 되돌리기
create or replace function public.cancel_sale(target_sale_id bigint)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_operator() then
    raise exception '취소 권한이 없어요.';
  end if;

  update public.sale set canceled_at = now()
  where id = target_sale_id and canceled_at is null;
  if not found then
    raise exception '이미 취소했거나 없는 판매예요.';
  end if;

  update public.stock_status s
  set quantity = s.quantity + i.qty
  from public.sale_item i
  where i.sale_id = target_sale_id
    and i.product_id = s.product_id
    and s.quantity is not null;
end $$;

-- 로그인하지 않은 사람은 아예 부를 수 없게
revoke execute on function public.make_sale(jsonb, integer) from public, anon;
revoke execute on function public.cancel_sale(bigint)       from public, anon;
grant  execute on function public.make_sale(jsonb, integer) to authenticated;
grant  execute on function public.cancel_sale(bigint)       to authenticated;
