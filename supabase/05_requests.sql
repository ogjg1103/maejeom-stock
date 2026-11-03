-- 메뉴 요청 게시판: 학생은 로그인 없이 요청·공감, 관리자는 답변·숨기기
-- 이름·학번은 받지 않고, 기기마다 만든 임의의 번호(device_id)로만 구분해요.

-- 1) 요청 글
create table public.menu_request (
  id         bigint generated always as identity primary key,
  name       text not null check (char_length(name) between 1 and 30),
  note       text check (note is null or char_length(note) <= 100),
  status     text not null default 'new' check (status in ('new', 'reviewing', 'yes', 'no')),
  reply      text check (reply is null or char_length(reply) <= 200),
  votes      integer not null default 0,
  hidden     boolean not null default false,
  device_id  uuid not null,
  created_at timestamptz not null default now()
);

-- 2) "나도 원해요" (한 기기에서 한 요청에 한 번만)
create table public.request_vote (
  request_id bigint not null references public.menu_request(id) on delete cascade,
  device_id  uuid not null,
  created_at timestamptz not null default now(),
  primary key (request_id, device_id)
);

alter table public.menu_request enable row level security;
alter table public.request_vote enable row level security;

-- 3) 읽기: 누구나 숨기지 않은 글, 관리자는 숨긴 글도
create policy "누구나 요청 조회" on public.menu_request
  for select to anon, authenticated using (hidden = false);
create policy "관리자는 숨긴 요청도 조회" on public.menu_request
  for select to authenticated using (public.is_admin());
create policy "관리자만 답변·숨기기" on public.menu_request
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- 기기 번호(device_id)는 읽을 수 없게, 보여 줄 칸만 열어 줘요
-- (Supabase는 새 표에 모든 칸 권한을 기본으로 주기 때문에 먼저 모두 거둬요)
revoke all on public.menu_request, public.request_vote from anon, authenticated;
grant select (id, name, note, status, reply, votes, hidden, created_at)
  on public.menu_request to anon, authenticated;
grant update (status, reply, hidden) on public.menu_request to authenticated;

-- 4) 나도 원해요: 같은 기기는 한 번만 세고, 전체 공감 수를 돌려줘요
create or replace function public.vote_request(target_id bigint, device uuid)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  total integer;
begin
  if not exists (select 1 from public.menu_request where id = target_id and hidden = false) then
    raise exception '없는 요청이에요.';
  end if;

  insert into public.request_vote (request_id, device_id)
  values (target_id, device)
  on conflict do nothing;

  update public.menu_request
  set votes = (select count(*) from public.request_vote where request_id = target_id)
  where id = target_id
  returning votes into total;

  return total;
end $$;

-- 5) 요청하기: 장난 막기 규칙을 지키면 저장
--    - 메뉴 이름 1~30글자, 한마디 100글자까지
--    - 한 기기에서 하루에 3개까지
--    - 이미 있는 메뉴(띄어쓰기·대소문자 무시)면 새 글 대신 "나도 원해요"로 더하기
create or replace function public.add_request(menu_name text, menu_note text, device uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  clean_name text := btrim(regexp_replace(coalesce(menu_name, ''), '\s+', ' ', 'g'));
  clean_note text := nullif(btrim(coalesce(menu_note, '')), '');
  existing   bigint;
  new_id     bigint;
begin
  if char_length(clean_name) not between 1 and 30 then
    raise exception '메뉴 이름은 1~30글자로 적어 주세요.';
  end if;
  if clean_note is not null and char_length(clean_note) > 100 then
    raise exception '한마디는 100글자까지 적을 수 있어요.';
  end if;

  select id into existing
  from public.menu_request
  where hidden = false
    and replace(lower(name), ' ', '') = replace(lower(clean_name), ' ', '')
  limit 1;

  if existing is not null then
    perform public.vote_request(existing, device);
    return jsonb_build_object('id', existing, 'merged', true);
  end if;

  if (select count(*) from public.menu_request
      where device_id = device and created_at > now() - interval '1 day') >= 3 then
    raise exception '요청은 하루에 3개까지 할 수 있어요.';
  end if;

  insert into public.menu_request (name, note, device_id)
  values (clean_name, clean_note, device)
  returning id into new_id;

  perform public.vote_request(new_id, device);
  return jsonb_build_object('id', new_id, 'merged', false);
end $$;

grant execute on function public.vote_request(bigint, uuid)     to anon, authenticated;
grant execute on function public.add_request(text, text, uuid)  to anon, authenticated;
