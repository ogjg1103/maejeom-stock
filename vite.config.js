import { defineConfig } from 'vite';

// 페이지가 4개(학생 화면, 관리자 화면, 판매 화면, 메뉴 요청)라서 모두 만들어 달라고 알려 줘요
export default defineConfig({
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
