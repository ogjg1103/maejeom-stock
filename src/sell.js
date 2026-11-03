import { supabase } from './supabase.js';
import { initAuthGate } from './auth.js';
import { CATEGORIES, compareProducts, flattenProduct, formatPrice } from './catalog.js';

const TABS = ['전체', ...CATEGORIES];

const grid = document.getElementById('sell-grid');
const tabs = document.getElementById('tabs');
const search = document.getElementById('search');
const cartList = document.getElementById('cart-list');
const cartEmpty = document.getElementById('cart-empty');
const totalEl = document.getElementById('total');
const sellBtn = document.getElementById('sell-btn');
const sellMsg = document.getElementById('sell-msg');
const undoBtn = document.getElementById('undo-btn');
const today = document.getElementById('today');

let products = [];
const cart = new Map(); // 상품 id → 담은 개수
let lastSale = null;    // 방금 판매 (취소용)
let currentCategory = '전체';
let searchText = '';

function setMsg(text, ok) {
  sellMsg.textContent = text;
  sellMsg.className = 'msg ' + (ok ? 'ok' : 'err');
}

// ── 데이터 불러오기 ──
async function loadProducts() {
  const { data, error } = await supabase
    .from('product')
    .select('id, name, category, price, stock_status(status, quantity, updated_at)')
    .eq('hidden', false);
  if (error) {
    grid.textContent = '상품을 불러오지 못했어요.';
    console.error(error);
    return;
  }
  products = data.map(flattenProduct).sort(compareProducts);
  renderGrid();
  renderCart();
}

// 오늘(자정부터 지금까지) 매출 합계
async function loadToday() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from('sale')
    .select('total, sale_item(qty)')
    .gte('created_at', start.toISOString())
    .is('canceled_at', null);
  if (error) {
    console.error(error);
    return;
  }
  const money = data.reduce((sum, s) => sum + s.total, 0);
  const count = data.reduce((sum, s) => sum + s.sale_item.reduce((n, i) => n + i.qty, 0), 0);
  today.textContent = `오늘 매출 ${formatPrice(money)} · ${count}개 판매 · ${data.length}건`;
}

// ── 계산 ──
function cartTotal() {
  let sum = 0;
  for (const [id, qty] of cart) {
    const p = products.find((x) => x.id === id);
    if (p) sum += p.price * qty;
  }
  return sum;
}

// 앱에 적힌 재고보다 많이 담은 상품이 있으면 알려 주기 (그래도 팔 수는 있어요)
function checkStockWarning() {
  const over = [...cart]
    .map(([id, qty]) => ({ p: products.find((x) => x.id === id), qty }))
    .find(({ p, qty }) => p && p.quantity != null && qty > p.quantity);
  if (over) {
    setMsg(`${over.p.name} 재고가 ${over.p.quantity}개로 되어 있어요. 진열대를 확인해 주세요.`, false);
  } else {
    sellMsg.textContent = '';
  }
}

function addToCart(p) {
  cart.set(p.id, (cart.get(p.id) ?? 0) + 1);
  checkStockWarning();
  renderGrid();
  renderCart();
}

function changeQty(id, diff) {
  const next = (cart.get(id) ?? 0) + diff;
  if (next <= 0) cart.delete(id);
  else cart.set(id, next);
  checkStockWarning();
  renderGrid();
  renderCart();
}

// ── 화면 그리기 ──
function renderTabs() {
  tabs.innerHTML = '';
  for (const cat of TABS) {
    const btn = document.createElement('button');
    btn.textContent = cat;
    btn.className = 'tab' + (cat === currentCategory ? ' active' : '');
    btn.addEventListener('click', () => {
      currentCategory = cat;
      renderTabs();
      renderGrid();
    });
    tabs.appendChild(btn);
  }
}

function renderGrid() {
  const visible = products.filter(
    (p) => (currentCategory === '전체' || p.category === currentCategory) && p.name.includes(searchText),
  );
  grid.innerHTML = '';
  for (const p of visible) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sell-item' + (cart.has(p.id) ? ' in-cart' : '') + (p.quantity === 0 ? ' empty' : '');
    btn.innerHTML = '<span class="item-name"></span><span class="item-price"></span><span class="item-stock"></span>';
    btn.querySelector('.item-name').textContent = p.name;
    btn.querySelector('.item-price').textContent = formatPrice(p.price);
    btn.querySelector('.item-stock').textContent =
      (p.quantity == null ? '재고 –' : `재고 ${p.quantity}`) + (cart.has(p.id) ? ` · 담음 ${cart.get(p.id)}` : '');
    btn.addEventListener('click', () => addToCart(p));
    grid.appendChild(btn);
  }
}

function renderCart() {
  cartList.innerHTML = '';
  for (const [id, qty] of cart) {
    const p = products.find((x) => x.id === id);
    if (!p) continue;
    const li = document.createElement('li');
    li.className = 'cart-line';
    li.innerHTML = `
      <span class="line-name"></span>
      <span class="stepper">
        <button type="button" aria-label="하나 빼기">−</button>
        <span></span>
        <button type="button" aria-label="하나 더하기">+</button>
      </span>
      <span class="line-sum"></span>
    `;
    li.querySelector('.line-name').textContent = p.name;
    li.querySelector('.stepper span').textContent = qty;
    li.querySelector('.line-sum').textContent = formatPrice(p.price * qty);
    const [minus, plus] = li.querySelectorAll('.stepper button');
    minus.addEventListener('click', () => changeQty(id, -1));
    plus.addEventListener('click', () => changeQty(id, +1));
    cartList.appendChild(li);
  }
  cartEmpty.hidden = cart.size > 0;
  renderMoney();
}

// 이체 받을 금액 (계좌이체라서 거스름돈은 없어요)
function renderMoney() {
  totalEl.textContent = formatPrice(cartTotal());
  sellBtn.disabled = cart.size === 0;
}

// ── 판매 완료 / 취소 ──
async function sell() {
  const total = cartTotal();
  const items = [...cart].map(([product_id, qty]) => ({ product_id, qty }));
  sellBtn.disabled = true;

  // 기록 저장과 재고 빼기는 데이터베이스가 한 번에 처리해요 (supabase/04_sales.sql)
  // paid: null = 합계만큼 받음 (계좌이체)
  const { data, error } = await supabase.rpc('make_sale', { items, paid: null });
  if (error) {
    setMsg(error.message || '판매를 저장하지 못했어요.', false);
    renderMoney();
    return;
  }

  lastSale = data;
  setMsg(`판매 완료! ${formatPrice(data.total)}`, true);
  undoBtn.hidden = false;
  undoBtn.textContent = `방금 판매(${formatPrice(total)}) 취소하기`;

  cart.clear();
  await Promise.all([loadProducts(), loadToday()]);
}

async function undo() {
  if (!lastSale) return;
  if (!confirm(`방금 판매(${formatPrice(lastSale.total)})를 취소할까요? 재고도 다시 늘어나요.`)) return;
  const { error } = await supabase.rpc('cancel_sale', { target_sale_id: lastSale.id });
  if (error) {
    setMsg(error.message || '취소하지 못했어요.', false);
    return;
  }
  setMsg(`${formatPrice(lastSale.total)} 판매를 취소했어요.`, true);
  lastSale = null;
  undoBtn.hidden = true;
  await Promise.all([loadProducts(), loadToday()]);
}

// ── 이벤트 연결 ──
search.addEventListener('input', () => {
  searchText = search.value.trim();
  renderGrid();
});

sellBtn.addEventListener('click', sell);
undoBtn.addEventListener('click', undo);

renderTabs();

// 운영 학생과 관리자 모두 판매할 수 있어요
initAuthGate({
  roles: ['operator', 'admin'],
  onEnter: () => {
    loadProducts();
    loadToday();
  },
});
