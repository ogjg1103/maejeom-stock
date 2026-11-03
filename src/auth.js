import { supabase } from './supabase.js';

// 관리자 화면과 판매 화면이 함께 쓰는 "문지기"
// 로그인 안 함 → 로그인 화면, 권한 없음 → 승인 필요 화면, 권한 있음 → 본 화면
//
// roles: 이 화면에 들어올 수 있는 역할 (예: ['admin'] 또는 ['operator', 'admin'])
// onEnter: 본 화면을 처음 보여 줄 때 할 일 (예: 상품 불러오기)
export function initAuthGate({ roles, onEnter }) {
  const loginView = document.getElementById('login-view');
  const deniedView = document.getElementById('denied-view');
  const appView = document.getElementById('app-view');
  const logoutBtn = document.getElementById('logout');
  const loginForm = document.getElementById('login-form');
  const loginMsg = document.getElementById('login-msg');

  function show(view) {
    loginView.hidden = view !== 'login';
    deniedView.hidden = view !== 'denied';
    appView.hidden = view !== 'app';
    logoutBtn.hidden = view === 'login';
  }

  // 같은 사람으로 이미 들어와 있으면 다시 확인하지 않기 (상품을 두 번 불러오지 않게)
  let enteredUserId = null;

  async function route(session) {
    if (!session) {
      enteredUserId = null;
      show('login');
      return;
    }
    if (session.user.id === enteredUserId) return;
    enteredUserId = session.user.id;
    // 운영자 표에서 "이 화면에 들어올 수 있는 승인된 사람인지" 확인
    const { data: me } = await supabase
      .from('operator')
      .select('role, approved')
      .eq('id', session.user.id)
      .maybeSingle();

    if (me?.approved && roles.includes(me.role)) {
      show('app');
      onEnter();
    } else {
      show('denied');
    }
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(loginForm);
    const { error } = await supabase.auth.signInWithPassword({
      email: form.get('email'),
      password: form.get('password'),
    });
    if (error) {
      loginMsg.textContent = '이메일 또는 비밀번호가 맞지 않아요.';
      loginMsg.className = 'msg err';
    } else {
      loginForm.reset();
      loginMsg.textContent = '';
    }
  });

  logoutBtn.addEventListener('click', () => supabase.auth.signOut());

  // 처음 열었을 때 + 로그인/로그아웃할 때마다 화면 다시 정하기
  // (onAuthStateChange 안에서 바로 DB를 부르면 멈출 수 있어서 setTimeout으로 한 박자 늦춰요)
  // 토큰이 새로 발급될 때(TOKEN_REFRESHED)는 화면을 다시 그리지 않아요
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED') return;
    setTimeout(() => route(session), 0);
  });
}
