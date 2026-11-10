-- 매점부 가입 + 관리자 승인
-- 누구나 가입할 수 있지만, 가입하면 "승인 대기" 운영자로만 등록돼요.
-- 관리자가 승인해야 판매 화면을 쓸 수 있어요.

-- 1) 관리자가 누군지 알아볼 수 있게 이메일 칸 추가
alter table public.operator add column email text;

update public.operator o
set email = u.email
from auth.users u
where u.id = o.id;

-- 2) 가입하면 자동으로 "승인 대기" 운영자 줄 만들기
--    이름은 가입 화면에서 적은 값(raw_user_meta_data.name)
create or replace function public.create_operator_on_signup()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.operator (id, name, role, approved, email)
  values (
    new.id,
    left(coalesce(nullif(btrim(new.raw_user_meta_data->>'name'), ''), '이름 없음'), 20),
    'operator',
    false,
    new.email
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created_operator
  after insert on auth.users
  for each row execute function public.create_operator_on_signup();

-- 3) 관리자: 모든 운영자 보기, 승인·해제하기 (자기 자신은 못 바꿔요 — 실수로 잠기지 않게)
create policy "관리자는 모든 운영자 조회" on public.operator
  for select to authenticated using (public.is_admin());

create policy "관리자만 운영자 승인·해제" on public.operator
  for update to authenticated
  using (public.is_admin() and id <> auth.uid())
  with check (public.is_admin() and id <> auth.uid());

revoke update on public.operator from authenticated;
grant update (approved) on public.operator to authenticated;
