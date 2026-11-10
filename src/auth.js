import { supabase } from './supabase.js';

// 관리자 화면과 판매 화면이 함께 쓰는 "문지기"
// 로그인 안 함 → 로그인 화면, 권한 없음 → 승인 필요 화면, 권한 있음 → 본 화면
//
// roles: 이 화면에 들어올 수 있는 역할 (예: ['admin'] 또는 ['operator', 'admin'])
// onEnter(role): 본 화면을 처음 보여 줄 때 할 일 (예: 상품 불러오기). role = 'operator' 또는 'admin'
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
      onEnter(me.role);
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
      loginMsg.textContent =
        error.code === 'email_not_confirmed'
          ? '이메일 확인이 아직 안 됐어요. 관리자에게 알려 주세요.'
          : '이메일 또는 비밀번호가 맞지 않아요.';
      loginMsg.className = 'msg err';
    } else {
      loginForm.reset();
      loginMsg.textContent = '';
    }
  });

  // 로그아웃은 "이 기기만" (같은 계정으로 로그인한 다른 휴대폰은 그대로)
  logoutBtn.addEventListener('click', () => supabase.auth.signOut({ scope: 'local' }));

  setupSignup();
  setupPasswordChange();

  // 처음 열었을 때 + 로그인/로그아웃할 때마다 화면 다시 정하기
  // (onAuthStateChange 안에서 바로 DB를 부르면 멈출 수 있어서 setTimeout으로 한 박자 늦춰요)
  // 토큰이 새로 발급될 때(TOKEN_REFRESHED)는 화면을 다시 그리지 않아요
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED') return;
    setTimeout(() => route(session), 0);
  });
}

// 매점부 가입 (화면에 signup-form이 있을 때만)
// 가입하면 데이터베이스가 "승인 대기" 운영자로 등록해요 (supabase/07_operator_signup.sql)
// 가입과 동시에 로그인되고, 관리자가 승인하기 전까지는 "승인을 기다리는 중" 화면이 보여요.
function setupSignup() {
  const form = document.getElementById('signup-form');
  if (!form) return;
  const msg = document.getElementById('signup-msg');

  const say = (text, ok) => {
    msg.textContent = text;
    msg.className = 'msg ' + (ok ? 'ok' : 'err');
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = data.get('name').trim();
    const password = data.get('password');

    if (!name) {
      say('이름을 적어 주세요.', false);
      return;
    }
    if (password.length < 8) {
      say('비밀번호는 8글자 이상으로 정해 주세요.', false);
      return;
    }
    if (password !== data.get('confirm')) {
      say('두 칸에 적은 비밀번호가 서로 달라요.', false);
      return;
    }

    const button = form.querySelector('button');
    button.disabled = true;
    const { data: result, error } = await supabase.auth.signUp({
      email: data.get('email').trim(),
      password,
      options: { data: { name } },
    });
    button.disabled = false;

    if (error) {
      say(
        error.code === 'user_already_exists'
          ? '이미 가입한 이메일이에요. 위에서 로그인해 주세요.'
          : '가입하지 못했어요. 잠시 후 다시 시도해 주세요.',
        false,
      );
      console.error(error);
      return;
    }
    form.reset();
    // 이메일 확인을 꺼 두었으면 바로 로그인돼서 "승인을 기다리는 중" 화면으로 넘어가요
    if (!result.session) say('가입했어요! 위에서 로그인해 주세요.', true);
  });
}

// 로그인한 사람이 자기 비밀번호를 직접 바꾸는 칸 (화면에 password-form이 있을 때만)
function setupPasswordChange() {
  const form = document.getElementById('password-form');
  if (!form) return;
  const msg = document.getElementById('password-msg');

  const say = (text, ok) => {
    msg.textContent = text;
    msg.className = 'msg ' + (ok ? 'ok' : 'err');
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const password = data.get('password');

    if (password.length < 8) {
      say('비밀번호는 8글자 이상으로 정해 주세요.', false);
      return;
    }
    if (password !== data.get('confirm')) {
      say('두 칸에 적은 비밀번호가 서로 달라요.', false);
      return;
    }

    const button = form.querySelector('button');
    button.disabled = true;
    const { error } = await supabase.auth.updateUser({ password });
    button.disabled = false;

    if (error) {
      say(
        error.code === 'same_password'
          ? '지금 쓰는 비밀번호와 같아요. 다른 비밀번호를 적어 주세요.'
          : '바꾸지 못했어요. 잠시 후 다시 시도해 주세요.',
        false,
      );
      console.error(error);
      return;
    }
    form.reset();
    say('비밀번호를 바꿨어요. 다음 로그인부터 새 비밀번호를 쓰세요.', true);
  });
}
