import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { spawn } from 'child_process'

/**
 * 개발 전용 데모 초기화 엔드포인트
 *
 * 시연·녹화 중 쌓인 신청·결제·평가를 지우고 처음 상태로 되돌린다.
 * 백엔드에는 삭제 API 가 없다 — enrollment/payment/course 세 서비스 모두
 * DELETE 엔드포인트를 노출하지 않는다(review-service 만 있다).
 * 그래서 화면에서 부를 수 있는 자리를 개발 서버 쪽에 둔다.
 *
 *   apply: 'serve'  → 운영 빌드에는 아예 포함되지 않는다
 *   server.host     → localhost 바인딩이라 외부에서 부를 수 없다
 *
 * 셸을 거치지 않고 stdin 으로 SQL 을 흘려보낸다.
 */
function devResetPlugin() {
  const SQL_PATH = resolve(__dirname, '../seed/reset-demo.sql')

  return {
    name: 'pocket-dev-reset',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__dev/reset', (req, res) => {
        const send = (code, body) => {
          res.statusCode = code
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(body))
        }

        if (req.method !== 'POST') return send(405, { error: 'POST 만 받는다' })

        let sql
        try {
          sql = readFileSync(SQL_PATH, 'utf8')
        } catch (e) {
          return send(500, { error: `seed/reset-demo.sql 을 읽지 못했다: ${e.message}` })
        }

        const child = spawn('docker', [
          'exec', '-i', 'lecturedb',
          'mariadb', '-umanager', '-pSqlDba-1', 'lecture_db'
        ])

        let out = ''
        let err = ''
        child.stdout.on('data', (d) => (out += d))
        child.stderr.on('data', (d) => (err += d))
        child.on('error', (e) => send(500, { error: `docker 를 실행하지 못했다: ${e.message}` }))
        child.on('close', (code) => {
          // mariadb 클라이언트는 비밀번호를 인자로 주면 항상 경고를 낸다 — 오류가 아니다
          const noise = err.replace(/.*Using a password on the command line.*\n?/g, '').trim()
          if (code === 0) send(200, { ok: true, output: out.trim() })
          else send(500, { error: noise || `종료 코드 ${code}` })
        })

        child.stdin.on('error', () => {})
        child.stdin.end(sql)
      })
    }
  }
}

export default defineConfig({
  plugins: [vue(), devResetPlugin()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    host: 'localhost',
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      },
      '/oauth2': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      },
    }
  }
})