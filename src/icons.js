// 상품 아이콘: 직접 그린 단순한 그림 (상표·봉지 디자인은 따라 그리지 않아요)
// 모양(shape) 하나에 색(c = 본색, d = 진한 색, bg = 배경)을 넣어 상품마다 다르게 보여요.

const S = (d, w = 2) => `stroke="${d}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;

const SHAPES = {
  // 감자칩 한 조각
  chip: (c, d) => `
    <path d="M13 35c1-13 14-21 27-18 9 2 14 10 11 19-3 10-15 15-26 12-8-2-12-7-12-13z" fill="${c}" ${S(d)}/>
    <path d="M20 30c6-4 15-5 23-2M19 38c7-3 16-3 24 0" fill="none" ${S(d, 1.5)} opacity=".45"/>`,

  // 새우
  shrimp: (c, d) => `
    <path d="M45 19c-15-3-27 7-27 19 0 6 4 10 10 10" fill="none" stroke="${c}" stroke-width="11" stroke-linecap="round"/>
    <path d="M27 22l3 6M20 29l6 3M18 38l6 1" fill="none" ${S(d)}/>
    <path d="M28 48l-6 5M28 48l2 6" fill="none" ${S(d)}/>
    <path d="M45 19l8-5M45 19l8 2" fill="none" ${S(d)}/>
    <circle cx="42" cy="21" r="1.8" fill="${d}"/>`,

  // 나쵸 삼각형
  nacho: (c, d) => `
    <path d="M32 12L52 48H12z" fill="${c}" ${S(d)}/>
    <circle cx="27" cy="35" r="2.2" fill="${d}"/><circle cx="37" cy="40" r="2.2" fill="${d}"/>
    <circle cx="33" cy="27" r="1.8" fill="${d}"/><circle cx="22" cy="43" r="1.6" fill="${d}"/>`,

  // 여러 겹 바삭한 칩 (거북 등껍질처럼 골이 진 부채꼴)
  layered: (c, d) => `
    <path d="M32 50L12 27C18 12 46 12 52 27z" fill="${c}" ${S(d)}/>
    <path d="M32 50L22 17M32 50L32 14M32 50L42 17M32 50L16 22M32 50L48 22" fill="none" ${S(d, 1.6)} opacity=".55"/>
    <path d="M17 29c9-6 21-6 30 0M22 37c7-4 13-4 20 0" fill="none" ${S(d, 1.6)} opacity=".55"/>`,

  // 츄러스 막대
  churro: (c, d) => `
    <g transform="rotate(35 32 32)">
      <rect x="26" y="8" width="12" height="48" rx="6" fill="${c}" ${S(d)}/>
      <path d="M30 13v38M34 13v38" fill="none" ${S(d, 1.5)} opacity=".55"/>
    </g>
    <circle cx="22" cy="24" r="1.3" fill="#fff"/><circle cx="40" cy="42" r="1.3" fill="#fff"/><circle cx="33" cy="30" r="1.3" fill="#fff"/>`,

  // 휘어진 옥수수 과자 (바나나킥처럼)
  puff: (c, d) => `
    <path d="M15 38c8 9 28 9 35-9" fill="none" stroke="${d}" stroke-width="15" stroke-linecap="round" opacity=".35"/>
    <path d="M15 38c8 9 28 9 35-9" fill="none" stroke="${c}" stroke-width="12" stroke-linecap="round"/>
    <path d="M18 40c7 6 24 6 30-8" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="1 6" stroke-linecap="round" opacity=".8"/>`,

  // 동그란 슈 과자 세 알
  balls: (c, d) => `
    <circle cx="23" cy="39" r="10" fill="${c}" ${S(d)}/><circle cx="41" cy="39" r="10" fill="${c}" ${S(d)}/>
    <circle cx="32" cy="24" r="10" fill="${c}" ${S(d)}/>
    <path d="M28 20a5 5 0 0 1 6-2M19 35a5 5 0 0 1 6-2M37 35a5 5 0 0 1 6-2" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>`,

  // 물결 모양 곡물 칩
  wave: (c, d) => `
    <rect x="13" y="18" width="38" height="28" rx="7" fill="${c}" ${S(d)}/>
    <path d="M17 27q4-4 8 0t8 0 8 0 8 0M17 36q4-4 8 0t8 0 8 0 8 0" fill="none" ${S(d, 1.6)} opacity=".6"/>`,

  // 뻥튀기 알갱이
  puffs: (c, d) => `
    <circle cx="22" cy="26" r="8" fill="${c}" ${S(d, 1.6)}/><circle cx="38" cy="22" r="7" fill="${c}" ${S(d, 1.6)}/>
    <circle cx="30" cy="38" r="9" fill="${c}" ${S(d, 1.6)}/><circle cx="44" cy="38" r="7" fill="${c}" ${S(d, 1.6)}/>
    <circle cx="19" cy="42" r="5" fill="${c}" ${S(d, 1.6)}/>`,

  // 부숴 먹는 면 과자 (꼬불꼬불한 면)
  noodle: (c, d) => `
    <rect x="13" y="16" width="38" height="32" rx="6" fill="${c}" ${S(d)}/>
    <path d="M17 23q3-3 6 0t6 0 6 0 6 0 6 0M17 30q3-3 6 0t6 0 6 0 6 0 6 0M17 37q3-3 6 0t6 0 6 0 6 0 6 0M17 44q3-3 6 0t6 0 6 0 6 0 6 0" fill="none" ${S(d, 1.6)} opacity=".6"/>`,

  // 초코 버섯
  mushroom: (c, d) => `
    <rect x="26" y="30" width="12" height="21" rx="5" fill="${c}" ${S(d, 1.6)}/>
    <path d="M13 33c0-12 9-19 19-19s19 7 19 19z" fill="${d}"/>
    <path d="M21 24a9 9 0 0 1 8-5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".5"/>`,

  // 동그란 비스킷 (안에 초코)
  biscuit: (c, d) => `
    <circle cx="25" cy="36" r="11" fill="${c}" ${S(d)}/><circle cx="40" cy="28" r="11" fill="${c}" ${S(d)}/>
    <circle cx="22" cy="33" r="1.5" fill="${d}"/><circle cx="28" cy="39" r="1.5" fill="${d}"/>
    <circle cx="38" cy="25" r="1.5" fill="${d}"/><circle cx="43" cy="31" r="1.5" fill="${d}"/>`,

  // 바삭한 치킨 알갱이
  nugget: (c, d) => `
    <path d="M18 30c-3-8 5-14 11-11 3-6 13-5 14 2 7 0 10 8 5 13 3 6-3 12-9 10-4 5-13 4-15-2-7-1-10-8-6-12z" fill="${c}" ${S(d)}/>
    <circle cx="27" cy="30" r="1.4" fill="${d}"/><circle cx="37" cy="27" r="1.4" fill="${d}"/>
    <circle cx="33" cy="37" r="1.4" fill="${d}"/><circle cx="41" cy="36" r="1.4" fill="${d}"/>`,

  // 우유 팩
  carton: (c, d) => `
    <path d="M21 21l11-9 11 9v31H21z" fill="#fff" ${S(d)}/>
    <path d="M21 21h22M32 12v9" fill="none" ${S(d, 1.6)}/>
    <rect x="21" y="30" width="22" height="15" fill="${c}"/>
    <path d="M21 21l11-9 11 9v31H21z" fill="none" ${S(d)}/>`,

  // 음료 병
  bottle: (c, d) => `
    <rect x="27" y="9" width="10" height="7" rx="2" fill="${d}"/>
    <path d="M25 17h14l3 7v25a5 5 0 0 1-5 5H27a5 5 0 0 1-5-5V24z" fill="${c}" ${S(d)}/>
    <rect x="22" y="31" width="20" height="10" fill="#fff" opacity=".75"/>
    <path d="M28 22v26" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".6"/>`,

  // 빨대 꽂힌 주스 팩
  juicebox: (c, d) => `
    <path d="M37 19V9l7-3" fill="none" ${S(d, 2.5)}/>
    <rect x="19" y="19" width="26" height="34" rx="3" fill="${c}" ${S(d)}/>
    <circle cx="32" cy="37" r="7" fill="#fff" opacity=".8"/>
    <circle cx="32" cy="37" r="3.5" fill="${d}" opacity=".8"/>`,

  // 음료 캔
  can: (c, d) => `
    <rect x="21" y="11" width="22" height="42" rx="5" fill="${c}" ${S(d)}/>
    <path d="M21 18h22M21 46h22" fill="none" ${S(d, 1.6)}/>
    <path d="M27 26q5 5 10 0M27 34q5 5 10 0" fill="none" ${S(d, 2.5)}/>`,

  // 꿈틀이 젤리 (두 가지 색 줄무늬)
  worm: (c, d) => `
    <path d="M11 40c6-11 12-11 16 0s11 11 16 0c3-7 7-9 10-6" fill="none" stroke="${c}" stroke-width="10" stroke-linecap="round"/>
    <path d="M11 40c6-11 12-11 16 0s11 11 16 0c3-7 7-9 10-6" fill="none" stroke="${d}" stroke-width="10" stroke-linecap="butt" stroke-dasharray="5 5"/>
    <circle cx="51" cy="34" r="1.6" fill="#1c1917"/>`,

  // 곰 모양 새콤 젤리 (설탕 가루)
  gummy: (c, d) => `
    <circle cx="25" cy="16" r="4" fill="${c}"/><circle cx="39" cy="16" r="4" fill="${c}"/>
    <circle cx="32" cy="23" r="9" fill="${c}"/>
    <ellipse cx="32" cy="41" rx="12" ry="13" fill="${c}"/>
    <circle cx="21" cy="37" r="4" fill="${c}"/><circle cx="43" cy="37" r="4" fill="${c}"/>
    <g fill="${d}"><circle cx="28" cy="36" r="1.2"/><circle cx="35" cy="42" r="1.2"/><circle cx="30" cy="47" r="1.2"/><circle cx="36" cy="33" r="1.2"/><circle cx="29" cy="21" r="1.2"/></g>`,

  // 붕어 모양 아이스크림
  fish: (c, d) => `
    <path d="M11 32c6-11 21-15 31-8l10-7v30l-10-7c-10 7-25 3-31-8z" fill="${c}" ${S(d)}/>
    <circle cx="21" cy="30" r="2" fill="${d}"/>
    <path d="M29 27a5 5 0 0 1 0 10M35 27a5 5 0 0 1 0 10" fill="none" ${S(d, 1.6)} opacity=".6"/>`,

  // 빵 사이에 아이스크림
  bun: (c, d) => `
    <path d="M13 27c0-9 8-14 19-14s19 5 19 14z" fill="${c}" ${S(d)}/>
    <path d="M11 27h42v13H11z" fill="#fff6d8" ${S(d, 1.6)}/>
    <path d="M11 40q3.5 4 7 0t7 0 7 0 7 0 7 0 7 0" fill="#fff6d8" ${S(d, 1.6)}/>
    <path d="M14 44h36c0 4-4 7-9 7H23c-5 0-9-3-9-7z" fill="${c}" ${S(d)}/>
    <path d="M24 19h2M31 17h2M38 19h2" ${S('#fff', 2)} opacity=".8"/>`,

  // 막대 아이스크림 (점박이)
  bar: (c, d) => `
    <rect x="29" y="42" width="6" height="15" rx="3" fill="#e2c39a"/>
    <rect x="20" y="9" width="24" height="36" rx="11" fill="${c}"/>
    <g fill="${d}"><circle cx="27" cy="18" r="1.8"/><circle cx="36" cy="22" r="1.8"/><circle cx="29" cy="28" r="1.8"/>
      <circle cx="38" cy="33" r="1.8"/><circle cx="26" cy="37" r="1.8"/><circle cx="34" cy="40" r="1.4"/></g>`,

  // 꽈배기처럼 꼬인 막대 아이스크림
  twist: (c, d) => `
    <rect x="29" y="42" width="6" height="15" rx="3" fill="#e2c39a"/>
    <rect x="20" y="9" width="24" height="36" rx="11" fill="${c}"/>
    <path d="M21 17l22 7M21 27l22 7M21 37l20 6" fill="none" stroke="${d}" stroke-width="4" stroke-linecap="round"/>`,

  // 옥수수 모양 아이스크림
  corn: (c, d) => `
    <rect x="29" y="44" width="6" height="13" rx="3" fill="#e2c39a"/>
    <ellipse cx="32" cy="27" rx="10" ry="19" fill="${c}"/>
    <g fill="#fff" opacity=".55"><circle cx="28" cy="16" r="1.6"/><circle cx="35" cy="16" r="1.6"/><circle cx="28" cy="23" r="1.6"/>
      <circle cx="35" cy="23" r="1.6"/><circle cx="28" cy="30" r="1.6"/><circle cx="35" cy="30" r="1.6"/><circle cx="31" cy="37" r="1.6"/></g>
    <path d="M32 46c-9-2-15-10-16-20 5 4 10 10 16 20zM32 46c9-2 15-10 16-20-5 4-10 10-16 20z" fill="${d}"/>`,

  // 컵 아이스크림 (위에 과일)
  cup: (c, d) => `
    <path d="M18 27h28l-4 24H22z" fill="${c}" ${S(d)}/>
    <path d="M16 27c2-9 30-9 32 0z" fill="#fff" ${S(d)}/>
    <circle cx="32" cy="18" r="4" fill="${d}"/>
    <path d="M22 37h20" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/>`,

  // 짜 먹는 튜브 아이스크림
  pouch: (c, d) => `
    <rect x="28" y="7" width="8" height="6" rx="2" fill="${d}"/>
    <path d="M24 13h16l-2 6v29a6 6 0 0 1-12 0V19z" fill="${c}" ${S(d)}/>
    <path d="M29 22v22" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".55"/>`,
};

// 상품 이름 → 모양과 색
const ICONS = {
  // 과자
  '꼬북칩':                      ['layered', '#f2c35b', '#a46a1f', '#fff4d6'],
  '꼬북칩 초코츄러스':           ['layered', '#9a6a45', '#4a2c1a', '#f3e3d6'],
  '눈을감자':                    ['chip',    '#f6d77a', '#9a6c12', '#fff6db'],
  '도도한 나쵸 사워크림&어니언': ['nacho',   '#f3c14b', '#3f8f4f', '#eaf6e6'],
  '도도한 나쵸 치즈':            ['nacho',   '#f5b335', '#c2410c', '#fff1d6'],
  '도리토스':                    ['nacho',   '#f08c2e', '#9a3412', '#ffe9d6'],
  '매운 새우깡':                 ['shrimp',  '#ef6b4a', '#991b1b', '#ffe4dc'],
  '무뚝뚝 감자칩':               ['chip',    '#eccb78', '#7a5a1c', '#f8efd9'],
  '무뚝뚝 고구마칩':             ['chip',    '#f4c27a', '#7c3a6b', '#f3e4ee'],
  '바나나킥':                    ['puff',    '#f7dd5b', '#a87f12', '#fff8d1'],
  '새우깡':                      ['shrimp',  '#f59e7a', '#c2410c', '#fff0e8'],
  '썬칩':                        ['wave',    '#e9b85c', '#8a5a1f', '#fbefd8'],
  '알새우칩':                    ['chip',    '#f8d3b5', '#e0703f', '#fff3ea'],
  '오감자':                      ['wave',    '#f2d17a', '#b45309', '#fdf3d6'],
  '츄러스':                      ['churro',  '#d99a4e', '#7a4a18', '#fbeedd'],
  '포카칩 어니언':               ['chip',    '#f5d36b', '#3f8f4f', '#e9f5e3'],
  '포카칩 오리지널':             ['chip',    '#f5d36b', '#2563eb', '#e6eefc'],
  '허니버터칩':                  ['chip',    '#f7d24a', '#d97706', '#fff6cc'],
  '홈런볼':                      ['balls',   '#e9c38a', '#7a4a18', '#f8ecdc'],
  '뻥이요':                      ['puffs',   '#fff7e6', '#c9a36a', '#f3eadc'],
  '뿌셔뿌셔 구운양파맛':         ['noodle',  '#f2c46b', '#4d7c0f', '#eef6dc'],
  '뿌셔뿌셔 버터구이오징어맛':   ['noodle',  '#f2c46b', '#7c3aed', '#efe8fb'],
  '뿌셔뿌셔 불고기맛':           ['noodle',  '#e9a75a', '#7c2d12', '#f8e3d3'],
  '뿌셔뿌셔 양념치킨맛':         ['noodle',  '#ef8a4a', '#b91c1c', '#fde2dc'],
  '초코송이':                    ['mushroom','#f1dfb8', '#5b3420', '#f2e6d8'],
  '치킨팝':                      ['nugget',  '#eba54f', '#9a5a14', '#fcebd2'],
  '칸쵸':                        ['biscuit', '#e6b877', '#5b3420', '#f6e9d6'],
  // 음료
  '딸기우유':                    ['carton',  '#f9a8c4', '#be185d', '#fde7ef'],
  '모구모구 리치':               ['bottle',  '#f6d3e3', '#a21caf', '#f8e8f4'],
  '모구모구 복숭아':             ['bottle',  '#fdba9a', '#ea580c', '#ffeadd'],
  '모구모구 요구르트':           ['bottle',  '#dbeefe', '#0284c7', '#e6f3fb'],
  '포카리스웨트':                ['can',     '#e0edff', '#1d4ed8', '#e3ecfb'],
  '피크닉 사과':                 ['juicebox','#f87171', '#b91c1c', '#fde4e4'],
  '피크닉 청포도':               ['juicebox','#a3d977', '#4d7c0f', '#eef7e3'],
  '허쉬초콜릿드링크':            ['juicebox','#8b5a3c', '#3b2416', '#efe3da'],
  '초록매실':                    ['bottle',  '#86d48f', '#15803d', '#e4f5e6'],
  // 젤리
  '왕꿈틀이':                    ['worm',    '#f97316', '#22c55e', '#fff0e3'],
  '츄파춥스 사워 젤리':          ['gummy',   '#facc15', '#ef4444', '#fff7d6'],
  // 아이스크림
  '떡붕어싸만코':                ['fish',    '#e3b36f', '#8a5a1f', '#f8ecda'],
  '빵또아':                      ['bun',     '#d9a05b', '#8a5a1f', '#f8ecda'],
  '까페오레':                    ['pouch',   '#c79a74', '#6b4226', '#f3e7dc'],
  '돼지바':                      ['bar',     '#f8b4c0', '#b91c1c', '#fde6ea'],
  '메가톤':                      ['bar',     '#7a4b2c', '#f5deb3', '#efe3da'],
  '빙빙바':                      ['twist',   '#bfdbfe', '#f472b6', '#eef2ff'],
  '스크류바':                    ['twist',   '#fde047', '#ef4444', '#fff1e0'],
  '요맘때 딸기':                 ['cup',     '#fbcfe8', '#db2777', '#fde7f1'],
  '요맘때 복숭아':               ['cup',     '#fed7aa', '#ea580c', '#ffeedd'],
  '요맘때 블루베리':             ['cup',     '#c7d2fe', '#4338ca', '#e9ebfb'],
  '인절미바':                    ['bar',     '#e8d3a0', '#9a7b3a', '#f6eedc'],
  '찰옥수수':                    ['corn',    '#fcd34d', '#65a30d', '#f2f8df'],
};

// 새로 추가한 상품처럼 목록에 없으면 카테고리별 기본 그림을 써요
const CATEGORY_DEFAULT = {
  과자:       ['chip',   '#f2d17a', '#9a6c12', '#f5f5f4'],
  음료:       ['bottle', '#bae6fd', '#0369a1', '#f5f5f4'],
  젤리:       ['gummy',  '#fca5a5', '#dc2626', '#f5f5f4'],
  아이스크림: ['bar',    '#e0f2fe', '#0ea5e9', '#f5f5f4'],
};

export function iconSvg(product) {
  const [shape, c, d, bg] =
    ICONS[product.name] ?? CATEGORY_DEFAULT[product.category] ?? CATEGORY_DEFAULT['과자'];
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="${bg}"/>${SHAPES[shape](c, d)}</svg>`;
}
