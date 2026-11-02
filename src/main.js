import { supabase } from './supabase.js';
import {
  CATEGORIES, compareProducts, flattenProduct, formatPrice, stockClass, stockText,
} from './catalog.js';

const TABS = ['전체', ...CATEGORIES];

// 데이터베이스에서 받아 온 상품 목록 (처음엔 비어 있어요)
let products = [];

// 지금 고른 카테고리와 검색어를 기억해 두는 곳
let currentCategory = '전체';
let searchText = '';

const grid = document.getElementById('grid');
const tabs = document.getElementById('tabs');
const search = document.getElementById('search');
const empty = document.getElementById('empty');
const updated = document.getElementById('updated');

// 시각 → "몇 분 전"
function minutesAgo(time) {
  return Math.max(0, Math.round((Date.now() - new Date(time).getTime()) / 60000));
}

// 데이터베이스에서 상품 + 재고 상태를 함께 가져오기
async function loadProducts() {
  const { data, error } = await supabase
    .from('product')
    .select('id, name, category, price, emoji, stock_status(status, quantity, updated_at)')
    .eq('hidden', false);

  if (error) {
    updated.textContent = '재고를 불러오지 못했어요. 잠시 후 다시 열어 주세요.';
    console.error(error);
    return;
  }

  products = data.map(flattenProduct).sort(compareProducts);

  renderUpdated();
  renderProducts();
}

// 카테고리 탭 버튼 만들기
function renderTabs() {
  tabs.innerHTML = '';
  for (const cat of TABS) {
    const btn = document.createElement('button');
    btn.textContent = cat;
    btn.className = 'tab' + (cat === currentCategory ? ' active' : '');
    btn.addEventListener('click', () => {
      currentCategory = cat;
      renderTabs();
      renderProducts();
    });
    tabs.appendChild(btn);
  }
}

// 상품 카드 목록 만들기 (카테고리 + 검색어로 걸러서)
function renderProducts() {
  const visible = products.filter((p) => {
    const matchCategory = currentCategory === '전체' || p.category === currentCategory;
    const matchSearch = p.name.includes(searchText);
    return matchCategory && matchSearch;
  });

  grid.innerHTML = '';
  for (const p of visible) {
    const li = document.createElement('li');
    li.className = `card ${stockClass(p)}`;
    li.innerHTML = `
      <div class="thumb" aria-hidden="true"></div>
      <div class="name"></div>
      <div class="price"></div>
      <div class="badge"></div>
    `;
    // 글자는 textContent로 넣어요 (상품 이름에 특수문자가 있어도 안전하게)
    li.querySelector('.thumb').textContent = p.emoji ?? '🛒';
    li.querySelector('.name').textContent = p.name;
    li.querySelector('.price').textContent = formatPrice(p.price);
    li.querySelector('.badge').textContent = stockText(p);
    grid.appendChild(li);
  }
  empty.hidden = visible.length > 0;
}

// 맨 위 "N분 전 업데이트" (가장 최근에 바뀐 상품 기준)
function renderUpdated() {
  const times = products.map((p) => p.updatedAt).filter(Boolean);
  if (times.length === 0) {
    updated.textContent = '';
    return;
  }
  const latest = Math.min(...times.map(minutesAgo));
  updated.textContent = latest === 0 ? '방금 업데이트' : `마지막 업데이트 ${latest}분 전`;
}

// 검색창에 글자를 칠 때마다 목록 다시 그리기
search.addEventListener('input', () => {
  searchText = search.value.trim();
  renderProducts();
});

updated.textContent = '재고 불러오는 중…';
renderTabs();
loadProducts();
