import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 서버 CORS 가 http://localhost:5173 만 허용한다.
  // 5173 이 이미 쓰이고 있으면 5174 로 넘어가지 않고 실행을 멈춰서 바로 알 수 있게 한다.
  server: { port: 5173, strictPort: true },
})
