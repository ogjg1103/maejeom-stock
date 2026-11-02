import { defineConfig } from 'vite';

// 페이지가 2개(학생 화면, 관리자 화면)라서 둘 다 만들어 달라고 알려 줘요
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        admin: 'admin.html',
      },
    },
  },
});
