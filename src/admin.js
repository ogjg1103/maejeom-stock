import { supabase } from './supabase.js';
import {
  CATEGORIES, CATEGORY_EMOJI, compareProducts, flattenProduct, formatPrice, stockText,
} from './catalog.js';

const loginView = document.getElementById('login-view');
const deniedView = document.getElementById('denied-view');
const adminView = document.getElementById('admin-view');
const logoutBtn = document.getElementById('logout');
const loginForm = document.getElementById('login-form');
const loginMsg = document.getElementById('login-msg');
const addForm = document.getElementById('add-form');
const addMsg = document.getElementById('add-msg');
const categorySelect = document.getElementById('category-select');
const stockList = document.getElementById('stock-list');

let products = [];

// 세 화면(로그인 / 승인 필요 / 관리자) 중 하나만 보여 주기
function show(view) {
  loginView.hidden = view !== 'login';
  deniedView.hidden = view !== 'denied';
  adminView.hidden = view !== 'admin';
  logoutBtn.hidden = view === 'login';
}

function setMsg(el, text, ok) {
  el.textContent = text;
  el.className = 'msg ' + (ok ? 'ok' : 'err');
}

// 로그인 상태를 보고 알맞은 화면으로 보내기
async function route(session) {
  if (!session) {
    show('login');
    return;
  }
  // 운영자 표에서 "관리자로 승인된 사람인지" 확인
  const { data: me } = await supabase
    .from('operator')
    .select('role, approved')
    .eq('id', session.user.id)
    .maybeSingle();

  if (me?.role === 'admin' && me.approved) {
    show('admin');
    loadProducts();
  } else {
    show('denied');
  }
}

// ── 로그인 / 로그아웃 ──
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(loginForm);
  const { error } = await supabase.auth.signInWithPassword({
    email: form.get('email'),
    password: form.get('password'),
  });
  if (error) setMsg(loginMsg, '이메일 또는 비밀번호가 맞지 않아요.', false);
  else loginForm.reset();
});

logoutBtn.addEventListener('click', () => supabase.auth.signOut());

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

// 처음 열었을 때 + 로그인/로그아웃할 때마다 화면 다시 정하기
// (onAuthStateChange 안에서 바로 DB를 부르면 멈출 수 있어서 setTimeout으로 한 박자 늦춰요)
supabase.auth.onAuthStateChange((_event, session) => {
  setTimeout(() => route(session), 0);
});
