import { defineConfig } from 'vite';

// 페이지가 4개(학생 화면, 관리자 화면, 판매 화면, 메뉴 요청)라서 모두 만들어 달라고 알려 줘요
// base: GitHub Pages 주소는 "아이디.github.io/저장소이름/"이라서, 올릴 때만 폴더 이름을 알려 줘요
//       (내 컴퓨터에서 미리 볼 때는 그냥 "/")
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        admin: 'admin.html',
        sell: 'sell.html',
        request: 'request.html',
      },
    },
  },
});
