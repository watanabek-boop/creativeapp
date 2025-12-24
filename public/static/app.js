// State management
let state = {
  user: null,
  profile: null,
  token: localStorage.getItem('token'),
  works: [],
  currentWork: null,
  dashboard: []
}

// API client
const api = axios.create({
  baseURL: '/api'
})

api.interceptors.request.use(config => {
  if (state.token) {
    config.headers.Authorization = `Bearer ${state.token}`
  }
  return config
})

// ============= Auth Functions =============

async function signup(email, password, role, fullName) {
  try {
    const { data } = await api.post('/auth/signup', { 
      email, 
      password, 
      role: role || 'member',
      full_name: fullName || email
    })
    if (data.session) {
      state.token = data.session.access_token
      localStorage.setItem('token', state.token)
      await loadProfile()
      render()
    }
    return data
  } catch (error) {
    alert('サインアップエラー: ' + (error.response?.data?.error || error.message))
  }
}

async function signin(email, password) {
  try {
    const { data } = await api.post('/auth/signin', { email, password })
    if (data.session) {
      state.token = data.session.access_token
      localStorage.setItem('token', state.token)
      await loadProfile()
      render()
    }
    return data
  } catch (error) {
    alert('ログインエラー: ' + (error.response?.data?.error || error.message))
  }
}

async function signout() {
  try {
    await api.post('/auth/signout')
    state.token = null
    state.user = null
    state.profile = null
    localStorage.removeItem('token')
    render()
  } catch (error) {
    console.error('サインアウトエラー:', error)
  }
}

async function loadProfile() {
  try {
    const { data } = await api.get('/auth/me')
    state.user = data.user
    state.profile = data.profile
  } catch (error) {
    console.error('プロフィール読み込みエラー:', error)
    state.token = null
    localStorage.removeItem('token')
  }
}

// ============= Works Functions =============

async function loadWorks() {
  try {
    const { data } = await api.get('/works')
    state.works = data.works
    render()
  } catch (error) {
    console.error('Work読み込みエラー:', error)
  }
}

async function createWork(goalState, unknowns, waitingOn) {
  try {
    await api.post('/works', {
      goal_state: goalState,
      unknowns: unknowns,
      waiting_on: waitingOn
    })
    await loadWorks()
    return true
  } catch (error) {
    alert('Work作成エラー: ' + (error.response?.data?.error || error.message))
    return false
  }
}

async function loadWorkDetail(workId) {
  try {
    const { data } = await api.get(`/works/\${workId}`)
    state.currentWork = data
    render()
  } catch (error) {
    console.error('Work詳細読み込みエラー:', error)
  }
}

async function createCheckin(workId, checkType) {
  try {
    const checkinData = {
      work_id: workId,
      unknowns_decreased: checkType === 'unknowns_decreased',
      unknowns_increased: checkType === 'unknowns_increased',
      decision_progressed: checkType === 'decision_progressed',
      decision_stalled: checkType === 'decision_stalled',
      no_change: checkType === 'no_change'
    }
    await api.post('/checkins', checkinData)
    await loadWorkDetail(workId)
    return true
  } catch (error) {
    alert('チェックインエラー: ' + (error.response?.data?.error || error.message))
    return false
  }
}

async function loadDashboard() {
  try {
    const { data } = await api.get('/dashboard')
    state.dashboard = data.dashboard
    render()
  } catch (error) {
    console.error('ダッシュボード読み込みエラー:', error)
  }
}

// ============= UI Components =============

function AuthPage() {
  return `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div class="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
        <h1 class="text-3xl font-bold text-center mb-8 text-gray-800">
          <i class="fas fa-rocket mr-2"></i>
          Creative App
        </h1>
        
        <div class="mb-6">
          <button onclick="showSignin()" id="signinTab" class="w-1/2 py-2 border-b-2 border-blue-500 font-semibold text-blue-500">
            ログイン
          </button>
          <button onclick="showSignup()" id="signupTab" class="w-1/2 py-2 border-b-2 border-gray-200 text-gray-500">
            サインアップ
          </button>
        </div>

        <div id="signinForm">
          <form onsubmit="handleSignin(event)" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
              <input type="email" name="email" required 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
              <input type="password" name="password" required 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••">
            </div>
            <button type="submit" class="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition">
              ログイン
            </button>
          </form>
        </div>

        <div id="signupForm" class="hidden">
          <form onsubmit="handleSignup(event)" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
              <input type="email" name="email" required 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">氏名</label>
              <input type="text" name="fullName" required 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="山田太郎">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
              <input type="password" name="password" required minlength="6"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">役割</label>
              <select name="role" 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="member">Member (社員)</option>
                <option value="executive">Executive (経営者)</option>
              </select>
            </div>
            <button type="submit" class="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition">
              サインアップ
            </button>
          </form>
        </div>
      </div>
    </div>
  `
}

function MemberDashboard() {
  const worksWithoutTodayCheckin = state.works.filter(work => {
    if (!work.checkins || work.checkins.length === 0) return true
    const lastCheckin = new Date(work.checkins[0].created_at)
    const today = new Date()
    return lastCheckin.toDateString() !== today.toDateString()
  })

  return `
    <div class="min-h-screen bg-gray-50">
      <nav class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-tasks mr-2"></i>
            My Works
          </h1>
          <div class="flex items-center gap-4">
            <span class="text-gray-600">
              <i class="fas fa-user mr-1"></i>
              \${state.profile?.full_name || state.profile?.email}
            </span>
            <button onclick="signout()" class="text-red-500 hover:text-red-700">
              <i class="fas fa-sign-out-alt mr-1"></i>
              ログアウト
            </button>
          </div>
        </div>
      </nav>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        ${worksWithoutTodayCheckin.length > 0 ? `
          <div class="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
            <p class="text-yellow-700">
              <i class="fas fa-exclamation-triangle mr-2"></i>
              今日まだチェックインしていないWorkが\${worksWithoutTodayCheckin.length}件あります
            </p>
          </div>
        ` : ''}

        <div class="mb-6 flex justify-between items-center">
          <h2 class="text-xl font-semibold text-gray-800">Work一覧</h2>
          <button onclick="showCreateWorkForm()" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
            <i class="fas fa-plus mr-2"></i>
            新規Work作成
          </button>
        </div>

        <div id="createWorkForm" class="hidden bg-white rounded-lg shadow p-6 mb-6">
          <h3 class="text-lg font-semibold mb-4">新しいWork</h3>
          <form onsubmit="handleCreateWork(event)" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">ゴール（状態で書く）</label>
              <input type="text" name="goalState" required 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="例: 新規顧客3社と契約が完了している">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">未確定なこと</label>
              <textarea name="unknowns" required rows="3"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="例: 価格設定が未確定\n競合との差別化ポイントが不明確"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">判断待ちの相手</label>
              <input type="text" name="waitingOn" 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="例: 営業部長、CFO">
            </div>
            <div class="flex gap-2">
              <button type="submit" class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
                作成
              </button>
              <button type="button" onclick="hideCreateWorkForm()" class="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">
                キャンセル
              </button>
            </div>
          </form>
        </div>

        <div class="grid gap-4">
          \${state.works.length === 0 ? `
            <div class="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              <i class="fas fa-inbox text-4xl mb-4"></i>
              <p>まだWorkがありません。最初のWorkを作成しましょう。</p>
            </div>
          ` : state.works.map(work => {
            const needsCheckin = worksWithoutTodayCheckin.some(w => w.id === work.id)
            return `
              <div class="bg-white rounded-lg shadow card p-6 \${needsCheckin ? 'border-l-4 border-yellow-400' : ''}">
                <div class="flex justify-between items-start mb-3">
                  <h3 class="text-lg font-semibold text-gray-800 flex-1">\${work.goal_state}</h3>
                  \${needsCheckin ? '<span class="text-yellow-500 text-sm"><i class="fas fa-clock mr-1"></i>チェックイン待ち</span>' : ''}
                </div>
                <p class="text-sm text-gray-600 mb-2">
                  <strong>未確定:</strong> \${work.unknowns}
                </p>
                \${work.waiting_on ? `
                  <p class="text-sm text-gray-600 mb-3">
                    <strong>判断待ち:</strong> \${work.waiting_on}
                  </p>
                ` : ''}
                <div class="flex justify-between items-center text-sm text-gray-500">
                  <span>作成: \${new Date(work.created_at).toLocaleDateString('ja-JP')}</span>
                  <button onclick="viewWork('\${work.id}')" class="text-blue-500 hover:text-blue-700 font-medium">
                    詳細・チェックイン <i class="fas fa-arrow-right ml-1"></i>
                  </button>
                </div>
              </div>
            `
          }).join('')}
        </div>
      </div>
    </div>
  `
}

function WorkDetailPage() {
  const work = state.currentWork?.work
  const checkins = state.currentWork?.checkins || []
  
  if (!work) return '<div class="p-8">Loading...</div>'

  const today = new Date().toDateString()
  const lastCheckin = checkins[0]
  const hasCheckedInToday = lastCheckin && new Date(lastCheckin.created_at).toDateString() === today

  return `
    <div class="min-h-screen bg-gray-50">
      <nav class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button onclick="backToWorks()" class="text-blue-500 hover:text-blue-700">
            <i class="fas fa-arrow-left mr-2"></i>
            Work一覧に戻る
          </button>
        </div>
      </nav>

      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <h2 class="text-2xl font-bold text-gray-800 mb-4">\${work.goal_state}</h2>
          <div class="space-y-3 text-gray-700">
            <div>
              <strong class="text-gray-800">未確定なこと:</strong>
              <p class="mt-1 whitespace-pre-wrap">\${work.unknowns}</p>
            </div>
            \${work.waiting_on ? `
              <div>
                <strong class="text-gray-800">判断待ちの相手:</strong>
                <p class="mt-1">\${work.waiting_on}</p>
              </div>
            ` : ''}
            <div class="text-sm text-gray-500">
              作成日: \${new Date(work.created_at).toLocaleDateString('ja-JP')}
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <h3 class="text-xl font-semibold mb-4">
            今日のチェックイン
            \${hasCheckedInToday ? '<span class="text-green-500 text-sm ml-2"><i class="fas fa-check-circle"></i> 完了</span>' : ''}
          </h3>
          
          \${hasCheckedInToday ? `
            <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
              <p><i class="fas fa-check-circle mr-2"></i>今日のチェックインは完了しています</p>
            </div>
          ` : `
            <p class="text-gray-600 mb-4">今日の状況を選択してください:</p>
            <div class="grid grid-cols-1 gap-3">
              <button onclick="handleCheckin('\${work.id}', 'unknowns_decreased')" 
                class="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 hover:border-green-400 transition text-left">
                <div class="font-semibold text-green-700">✓ 未確定が減った</div>
                <div class="text-sm text-gray-600">不明点や未解決事項が減少した</div>
              </button>
              <button onclick="handleCheckin('\${work.id}', 'decision_progressed')" 
                class="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition text-left">
                <div class="font-semibold text-blue-700">→ 判断が進んだ</div>
                <div class="text-sm text-gray-600">意思決定やアクションが前進した</div>
              </button>
              <button onclick="handleCheckin('\${work.id}', 'no_change')" 
                class="p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition text-left">
                <div class="font-semibold text-gray-700">− 変化なし</div>
                <div class="text-sm text-gray-600">特に進展も後退もない</div>
              </button>
              <button onclick="handleCheckin('\${work.id}', 'unknowns_increased')" 
                class="p-4 border-2 border-yellow-200 rounded-lg hover:bg-yellow-50 hover:border-yellow-400 transition text-left">
                <div class="font-semibold text-yellow-700">↑ 未確定が増えた</div>
                <div class="text-sm text-gray-600">新たな不明点や課題が発生した</div>
              </button>
              <button onclick="handleCheckin('\${work.id}', 'decision_stalled')" 
                class="p-4 border-2 border-red-200 rounded-lg hover:bg-red-50 hover:border-red-400 transition text-left">
                <div class="font-semibold text-red-700">✗ 判断が止まった</div>
                <div class="text-sm text-gray-600">意思決定やアクションが停滞している</div>
              </button>
            </div>
          `}
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-xl font-semibold mb-4">チェックイン履歴</h3>
          \${checkins.length === 0 ? `
            <p class="text-gray-500 text-center py-4">まだチェックインがありません</p>
          ` : `
            <div class="space-y-3">
              \${checkins.map(c => {
                let status = ''
                let color = ''
                if (c.unknowns_decreased) { status = '✓ 未確定が減った'; color = 'text-green-600' }
                else if (c.decision_progressed) { status = '→ 判断が進んだ'; color = 'text-blue-600' }
                else if (c.no_change) { status = '− 変化なし'; color = 'text-gray-600' }
                else if (c.unknowns_increased) { status = '↑ 未確定が増えた'; color = 'text-yellow-600' }
                else if (c.decision_stalled) { status = '✗ 判断が止まった'; color = 'text-red-600' }
                
                return `
                  <div class="flex justify-between items-center border-l-4 \${color.replace('text-', 'border-')} pl-4 py-2">
                    <span class="font-medium \${color}">\${status}</span>
                    <span class="text-sm text-gray-500">\${new Date(c.created_at).toLocaleString('ja-JP')}</span>
                  </div>
                `
              }).join('')}
            </div>
          `}
        </div>
      </div>
    </div>
  `
}

function ExecutiveDashboard() {
  const redWorks = state.dashboard.filter(w => w.intervention.level === 'red')
  const yellowWorks = state.dashboard.filter(w => w.intervention.level === 'yellow')
  const greenWorks = state.dashboard.filter(w => w.intervention.level === 'green')

  return `
    <div class="min-h-screen bg-gray-50">
      <nav class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-chart-line mr-2"></i>
            介入判断ダッシュボード
          </h1>
          <div class="flex items-center gap-4">
            <button onclick="loadDashboard()" class="text-blue-500 hover:text-blue-700">
              <i class="fas fa-sync-alt mr-1"></i>
              更新
            </button>
            <span class="text-gray-600">
              <i class="fas fa-user-tie mr-1"></i>
              \${state.profile?.full_name || state.profile?.email}
            </span>
            <button onclick="signout()" class="text-red-500 hover:text-red-700">
              <i class="fas fa-sign-out-alt mr-1"></i>
              ログアウト
            </button>
          </div>
        </div>
      </nav>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-3 gap-4 mb-8">
          <div class="bg-white rounded-lg shadow p-6 text-center">
            <div class="text-4xl font-bold text-red-500">\${redWorks.length}</div>
            <div class="text-gray-600 mt-2">🔴 今すぐ介入</div>
          </div>
          <div class="bg-white rounded-lg shadow p-6 text-center">
            <div class="text-4xl font-bold text-yellow-500">\${yellowWorks.length}</div>
            <div class="text-gray-600 mt-2">🟡 そろそろ確認</div>
          </div>
          <div class="bg-white rounded-lg shadow p-6 text-center">
            <div class="text-4xl font-bold text-green-500">\${greenWorks.length}</div>
            <div class="text-gray-600 mt-2">🟢 放置OK</div>
          </div>
        </div>

        ${state.dashboard.length === 0 ? `
          <div class="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            <i class="fas fa-inbox text-4xl mb-4"></i>
            <p>現在進行中のWorkはありません</p>
          </div>
        ` : `
          <div class="space-y-4">
            \${state.dashboard.map(item => {
              const levelColors = {
                red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: '🔴' },
                yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: '🟡' },
                green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: '🟢' }
              }
              const colors = levelColors[item.intervention.level]

              return `
                <div class="bg-white rounded-lg shadow card level-\${item.intervention.level}">
                  <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                      <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                          <span class="text-2xl">\${colors.icon}</span>
                          <h3 class="text-lg font-semibold text-gray-800">\${item.goal_state}</h3>
                        </div>
                        <div class="text-sm text-gray-600">
                          <span><i class="fas fa-user mr-1"></i>\${item.profiles.full_name}</span>
                          <span class="ml-4"><i class="fas fa-clock mr-1"></i>最終チェックイン: \${
                            item.intervention.lastCheckin 
                              ? new Date(item.intervention.lastCheckin).toLocaleDateString('ja-JP') + ' (' + item.intervention.daysSinceLastCheckin + '日前)'
                              : 'なし'
                          }</span>
                        </div>
                      </div>
                    </div>

                    <div class="\${colors.bg} border \${colors.border} rounded-lg p-4 mb-3">
                      <div class="font-semibold \${colors.text} mb-2">判定理由:</div>
                      <ul class="list-disc list-inside space-y-1 text-sm \${colors.text}">
                        \${item.intervention.reasons.map(r => `<li>\${r}</li>`).join('')}
                      </ul>
                    </div>

                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div class="font-semibold text-blue-700 mb-2">
                        <i class="fas fa-lightbulb mr-1"></i>
                        推奨アクション:
                      </div>
                      <ul class="list-disc list-inside space-y-1 text-sm text-blue-700">
                        \${item.intervention.actions.map(a => `<li>\${a}</li>`).join('')}
                      </ul>
                    </div>

                    <div class="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
                      <details>
                        <summary class="cursor-pointer hover:text-blue-500">Work詳細を表示</summary>
                        <div class="mt-3 space-y-2">
                          <div>
                            <strong>未確定事項:</strong>
                            <p class="whitespace-pre-wrap text-gray-700 mt-1">\${item.unknowns}</p>
                          </div>
                          \${item.waiting_on ? `
                            <div>
                              <strong>判断待ち:</strong> \${item.waiting_on}
                            </div>
                          ` : ''}
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              `
            }).join('')}
          </div>
        `}
      </div>
    </div>
  `
}

// ============= Event Handlers =============

function showSignin() {
  document.getElementById('signinForm').classList.remove('hidden')
  document.getElementById('signupForm').classList.add('hidden')
  document.getElementById('signinTab').classList.add('border-blue-500', 'text-blue-500', 'font-semibold')
  document.getElementById('signinTab').classList.remove('border-gray-200', 'text-gray-500')
  document.getElementById('signupTab').classList.remove('border-blue-500', 'text-blue-500', 'font-semibold')
  document.getElementById('signupTab').classList.add('border-gray-200', 'text-gray-500')
}

function showSignup() {
  document.getElementById('signupForm').classList.remove('hidden')
  document.getElementById('signinForm').classList.add('hidden')
  document.getElementById('signupTab').classList.add('border-blue-500', 'text-blue-500', 'font-semibold')
  document.getElementById('signupTab').classList.remove('border-gray-200', 'text-gray-500')
  document.getElementById('signinTab').classList.remove('border-blue-500', 'text-blue-500', 'font-semibold')
  document.getElementById('signinTab').classList.add('border-gray-200', 'text-gray-500')
}

async function handleSignin(e) {
  e.preventDefault()
  const formData = new FormData(e.target)
  await signin(formData.get('email'), formData.get('password'))
}

async function handleSignup(e) {
  e.preventDefault()
  const formData = new FormData(e.target)
  await signup(
    formData.get('email'), 
    formData.get('password'),
    formData.get('role'),
    formData.get('fullName')
  )
}

function showCreateWorkForm() {
  document.getElementById('createWorkForm').classList.remove('hidden')
}

function hideCreateWorkForm() {
  document.getElementById('createWorkForm').classList.add('hidden')
}

async function handleCreateWork(e) {
  e.preventDefault()
  const formData = new FormData(e.target)
  const success = await createWork(
    formData.get('goalState'),
    formData.get('unknowns'),
    formData.get('waitingOn')
  )
  if (success) {
    e.target.reset()
    hideCreateWorkForm()
  }
}

async function viewWork(workId) {
  await loadWorkDetail(workId)
}

function backToWorks() {
  state.currentWork = null
  render()
}

async function handleCheckin(workId, checkType) {
  const success = await createCheckin(workId, checkType)
  if (success) {
    alert('チェックインを記録しました！')
  }
}

// ============= Render =============

function render() {
  const app = document.getElementById('app')
  
  if (!state.token) {
    app.innerHTML = AuthPage()
    return
  }

  if (!state.profile) {
    app.innerHTML = '<div class="flex items-center justify-center min-h-screen"><div class="text-xl">Loading...</div></div>'
    return
  }

  if (state.currentWork) {
    app.innerHTML = WorkDetailPage()
    return
  }

  if (state.profile.role === 'executive') {
    app.innerHTML = ExecutiveDashboard()
  } else {
    app.innerHTML = MemberDashboard()
  }
}

// ============= Initialize =============

async function init() {
  if (state.token) {
    await loadProfile()
    if (state.profile) {
      if (state.profile.role === 'executive') {
        await loadDashboard()
      } else {
        await loadWorks()
      }
    }
  }
  render()
}

init()
