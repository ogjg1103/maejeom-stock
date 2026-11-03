import { supabase } from './supabase.js';
import { fillRequestCard } from './requests-shared.js';

const form = document.getElementById('request-form');
const msg = document.getElementById('request-msg');
const list = document.getElementById('request-list');
const empty = document.getElementById('request-empty');

// 이 기기의 임의 번호 (이름·학번 대신 "같은 기기인지"만 구분해요)
// 그리고 이 기기에서 "나도 원해요"를 누른 요청 목록
const deviceId = loadDeviceId();
const voted = new Set(readJson('voted-requests', []));

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장이 막힌 브라우저(비공개 창 등)에서는 그냥 넘어가요
  }
}

function loadDeviceId() {
  let id = readJson('device-id', null);
  if (!id) {
    id = crypto.randomUUID();
    saveJson('device-id', id);
  }
  return id;
}

function setMsg(text, ok) {
  msg.textContent = text;
  msg.className = 'msg ' + (ok ? 'ok' : 'err');
}

// ── 요청 목록 (많이 원하는 순 → 최신순) ──
async function loadRequests() {
  const { data, error } = await supabase
    .from('menu_request')
    .select('id, name, note, status, reply, votes, created_at')
    .eq('hidden', false)
    .order('votes', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) {
    list.textContent = '요청을 불러오지 못했어요.';
    console.error(error);
    return;
  }
  render(data);
}

function render(requests) {
  list.innerHTML = '';
  for (const r of requests) {
    const li = document.createElement('li');
    fillRequestCard(li, r);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'vote-btn' + (voted.has(r.id) ? ' voted' : '');
    btn.innerHTML = '<strong></strong>나도 원해요';
    btn.querySelector('strong').textContent = r.votes;
    btn.disabled = voted.has(r.id);
    btn.addEventListener('click', () => vote(r.id));
    li.insertBefore(btn, li.children[1]);

    list.appendChild(li);
  }
  empty.hidden = requests.length > 0;
}

function markVoted(id) {
  voted.add(id);
  saveJson('voted-requests', [...voted]);
}

// ── 나도 원해요 ──
async function vote(id) {
  const { error } = await supabase.rpc('vote_request', { target_id: id, device: deviceId });
  if (error) {
    setMsg(error.message || '누르지 못했어요.', false);
    return;
  }
  markVoted(id);
  loadRequests();
}

// ── 요청하기 ──
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const button = form.querySelector('button');
  button.disabled = true;

  const { data: result, error } = await supabase.rpc('add_request', {
    menu_name: data.get('name'),
    menu_note: data.get('note'),
    device: deviceId,
  });

  button.disabled = false;
  if (error) {
    setMsg(error.message || '요청하지 못했어요. 다시 시도해 주세요.', false);
    return;
  }

  markVoted(result.id);
  setMsg(
    result.merged
      ? '이미 같은 요청이 있어서 "나도 원해요"에 더했어요.'
      : '요청했어요! 매점부가 확인하면 답을 달아 줄 거예요.',
    true,
  );
  form.reset();
  loadRequests();
});

loadRequests();
