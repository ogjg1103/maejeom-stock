import { supabase } from './supabase.js';
import { initAuthGate } from './auth.js';
import { REQUEST_STATUS, fillRequestCard } from './requests-shared.js';
import {
  CATEGORIES, CATEGORY_EMOJI, compareProducts, flattenProduct, formatPrice, stockText,
} from './catalog.js';

const addForm = document.getElementById('add-form');
const addMsg = document.getElementById('add-msg');
const categorySelect = document.getElementById('category-select');
const stockList = document.getElementById('stock-list');

let products = [];

function setMsg(el, text, ok) {
  el.textContent = text;
  el.className = 'msg ' + (ok ? 'ok' : 'err');
}

// ── 상품 목록 불러오기 (관리자는 숨긴 상품도 보여요) ──
async function loadProducts() {
  const { data, error } = await supabase
    .from('product')
    .select('id, name, category, price, hidden, stock_status(status, quantity, updated_at)');
  if (error) {
    stockList.textContent = '상품을 불러오지 못했어요.';
    console.error(error);
    return;
  }
  products = data.map(flattenProduct).sort(compareProducts);
  renderStockList();
}

// ── 새 상품 추가 ──
for (const cat of CATEGORIES) {
  const opt = document.createElement('option');
  opt.value = opt.textContent = cat;
  categorySelect.appendChild(opt);
}

addForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(addForm);
  const name = form.get('name').trim();
  const category = form.get('category');
  const price = Number(form.get('price'));
  const quantityText = form.get('quantity');

  if (products.some((p) => p.name === name)) {
    setMsg(addMsg, `"${name}"은(는) 이미 있는 상품이에요.`, false);
    return;
  }

  const button = addForm.querySelector('button');
  button.disabled = true;

  // 1) 상품 넣기 (재고 줄은 데이터베이스가 자동으로 만들어요)
  const { data: created, error } = await supabase
    .from('product')
    .insert({ name, category, price, emoji: CATEGORY_EMOJI[category] })
    .select('id')
    .single();

  // 2) 남은 개수를 적었다면 함께 저장
  if (!error && quantityText !== '') {
    await saveQuantity(created.id, Number(quantityText));
  }

  button.disabled = false;
  if (error) {
    setMsg(addMsg, '추가하지 못했어요. 다시 시도해 주세요.', false);
    console.error(error);
    return;
  }
  setMsg(addMsg, `"${name}"을(를) 추가했어요.`, true);
  addForm.reset();
  loadProducts();
});

// ── 남은 개수 저장 ──
async function saveQuantity(productId, quantity) {
  const { data, error } = await supabase
    .from('stock_status')
    .update({ quantity })
    .eq('product_id', productId)
    .select('status, quantity, updated_at')
    .single();
  if (error) {
    alert('저장하지 못했어요. 인터넷 연결을 확인해 주세요.');
    console.error(error);
    return null;
  }
  return data;
}

// ── 숨기기 / 다시 보이기 ──
async function setHidden(product, hidden) {
  const { error } = await supabase.from('product').update({ hidden }).eq('id', product.id);
  if (error) {
    alert('바꾸지 못했어요.');
    console.error(error);
    return;
  }
  product.hidden = hidden;
  renderStockList();
}

// ── 남은 개수 목록 그리기 (카테고리별) ──
function renderStockList() {
  stockList.innerHTML = '';
  let lastCategory = null;

  for (const p of products) {
    if (p.category !== lastCategory) {
      const title = document.createElement('li');
      title.className = 'cat-title';
      title.textContent = p.category;
      stockList.appendChild(title);
      lastCategory = p.category;
    }

    const li = document.createElement('li');
    li.className = 'stock-row' + (p.hidden ? ' is-hidden' : '');
    li.innerHTML = `
      <div>
        <div class="row-name"></div>
        <div class="row-sub"></div>
      </div>
      <div class="stepper">
        <button type="button" aria-label="하나 빼기">−</button>
        <input type="number" min="0" inputmode="numeric" aria-label="남은 개수" />
        <button type="button" aria-label="하나 더하기">+</button>
      </div>
      <div class="row-actions"><button type="button" class="link-btn"></button></div>
    `;
    const sub = li.querySelector('.row-sub');
    const input = li.querySelector('input');
    const [minus, plus] = li.querySelectorAll('.stepper button');
    const hideBtn = li.querySelector('.row-actions button');

    li.querySelector('.row-name').textContent = p.name;
    input.value = p.quantity ?? '';
    hideBtn.textContent = p.hidden ? '학생 화면에 다시 보이기' : '학생 화면에서 숨기기';

    const refreshSub = () => {
      sub.textContent = `${formatPrice(p.price)} · ${p.hidden ? '숨김' : stockText(p)}`;
    };
    refreshSub();

    // 개수를 바꾸면 바로 저장하고, 저장된 결과로 글자 갱신
    const update = async (value) => {
      const saved = await saveQuantity(p.id, value);
      if (!saved) return;
      Object.assign(p, { status: saved.status, quantity: saved.quantity, updatedAt: saved.updated_at });
      input.value = p.quantity;
      refreshSub();
    };

    minus.addEventListener('click', () => update(Math.max(0, (p.quantity ?? 0) - 1)));
    plus.addEventListener('click', () => update((p.quantity ?? 0) + 1));
    input.addEventListener('change', () => {
      if (input.value === '') return;
      update(Math.max(0, Math.floor(Number(input.value))));
    });
    hideBtn.addEventListener('click', () => setHidden(p, !p.hidden));

    stockList.appendChild(li);
  }
}

// ── 메뉴 요청: 상태·답변 저장, 숨기기 ──
const requestList = document.getElementById('admin-request-list');
const requestEmpty = document.getElementById('admin-request-empty');

async function loadRequests() {
  const { data, error } = await supabase
    .from('menu_request')
    .select('id, name, note, status, reply, votes, hidden, created_at')
    .order('votes', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) {
    requestList.textContent = '요청을 불러오지 못했어요.';
    console.error(error);
    return;
  }
  renderRequests(data);
}

function renderRequests(requests) {
  requestList.innerHTML = '';
  for (const r of requests) {
    const li = document.createElement('li');
    fillRequestCard(li, r);

    const votes = document.createElement('div');
    votes.className = 'vote-btn';
    votes.innerHTML = '<strong></strong>원해요';
    votes.querySelector('strong').textContent = r.votes;
    li.insertBefore(votes, li.children[1]);

    const box = document.createElement('div');
    box.className = 'req-admin';
    box.innerHTML = `
      <select aria-label="상태"></select>
      <input maxlength="200" placeholder="답변 (예: 다음 주부터 들여올게요)" aria-label="답변" />
      <button type="button">저장</button>
      <button type="button" class="link-btn"></button>
    `;
    const select = box.querySelector('select');
    for (const [value, label] of Object.entries(REQUEST_STATUS)) {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = label;
      select.appendChild(opt);
    }
    select.value = r.status;
    const input = box.querySelector('input');
    input.value = r.reply ?? '';
    const [saveBtn, hideBtn] = box.querySelectorAll('button');
    hideBtn.textContent = r.hidden ? '학생 화면에 다시 보이기' : '학생 화면에서 숨기기';

    saveBtn.addEventListener('click', () =>
      updateRequest(r.id, { status: select.value, reply: input.value.trim() || null }),
    );
    hideBtn.addEventListener('click', () => updateRequest(r.id, { hidden: !r.hidden }));

    li.appendChild(box);
    requestList.appendChild(li);
  }
  requestEmpty.hidden = requests.length > 0;
}

async function updateRequest(id, changes) {
  const { error } = await supabase.from('menu_request').update(changes).eq('id', id);
  if (error) {
    alert('저장하지 못했어요.');
    console.error(error);
    return;
  }
  loadRequests();
}

// ── 운영자 관리: 승인 대기 → 승인, 승인된 사람 → 해제 ──
const operatorList = document.getElementById('operator-list');
const operatorWaiting = document.getElementById('operator-waiting');

async function loadOperators() {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('operator')
    .select('id, name, email, role, approved, created_at')
    .order('approved') // 승인 대기가 맨 위
    .order('created_at', { ascending: false });
  if (error) {
    operatorList.textContent = '운영자 목록을 불러오지 못했어요.';
    console.error(error);
    return;
  }

  const waiting = data.filter((o) => !o.approved).length;
  operatorWaiting.textContent = waiting ? `· 승인 대기 ${waiting}명` : '';

  operatorList.innerHTML = '';
  for (const o of data) {
    const li = document.createElement('li');
    li.className = 'operator-row' + (o.approved ? '' : ' waiting');
    li.innerHTML = '<div class="op-name"></div><div class="op-sub"></div>';
    li.querySelector('.op-name').textContent =
      `${o.name}${o.role === 'admin' ? ' (관리자)' : ''}${o.approved ? '' : ' · 승인 대기'}`;
    li.querySelector('.op-sub').textContent = o.email ?? '';

    // 나 자신은 바꿀 수 없어요 (실수로 관리자 화면에서 잠기지 않게)
    if (o.id !== user.id) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'op-btn' + (o.approved ? ' off' : '');
      btn.textContent = o.approved ? '해제' : '승인';
      btn.addEventListener('click', () => setApproved(o, !o.approved));
      li.appendChild(btn);
    }
    operatorList.appendChild(li);
  }
}

async function setApproved(o, approved) {
  if (!approved && !confirm(`${o.name}의 판매 권한을 해제할까요? 바로 판매 화면을 못 쓰게 돼요.`)) return;
  const { data, error } = await supabase
    .from('operator')
    .update({ approved })
    .eq('id', o.id)
    .select('id');
  if (error || data.length === 0) {
    alert('바꾸지 못했어요.');
    console.error(error);
    return;
  }
  loadOperators();
}

// 관리자만 들어올 수 있어요. 들어오면 운영자·상품·메뉴 요청 불러오기
initAuthGate({
  roles: ['admin'],
  onEnter: () => {
    loadOperators();
    loadProducts();
    loadRequests();
  },
});
