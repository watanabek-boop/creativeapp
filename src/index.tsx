import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { createClient } from '@supabase/supabase-js'

type Bindings = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './' }))

// Supabase client helper
function getSupabaseClient(c: any) {
  const supabaseUrl = c.env.SUPABASE_URL
  const supabaseKey = c.env.SUPABASE_ANON_KEY
  return createClient(supabaseUrl, supabaseKey)
}

// Auth middleware - verify JWT and get user
async function authMiddleware(c: any, next: any) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = getSupabaseClient(c)
  
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  c.set('user', user)
  c.set('supabase', supabase)
  await next()
}

// ============= Auth APIs =============

app.post('/api/auth/signup', async (c) => {
  const { email, password, role, full_name } = await c.req.json()
  const supabase = getSupabaseClient(c)

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: role || 'member',
        full_name: full_name || email
      }
    }
  })

  if (error) {
    return c.json({ error: error.message }, 400)
  }

  return c.json({ user: data.user, session: data.session })
})

app.post('/api/auth/signin', async (c) => {
  const { email, password } = await c.req.json()
  const supabase = getSupabaseClient(c)

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    return c.json({ error: error.message }, 400)
  }

  return c.json({ user: data.user, session: data.session })
})

app.post('/api/auth/signout', async (c) => {
  const supabase = getSupabaseClient(c)
  const { error } = await supabase.auth.signOut()

  if (error) {
    return c.json({ error: error.message }, 400)
  }

  return c.json({ message: 'Signed out successfully' })
})

app.get('/api/auth/me', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = c.get('supabase')

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    return c.json({ error: error.message }, 400)
  }

  return c.json({ user, profile })
})

// ============= Offices APIs =============

app.get('/api/offices', authMiddleware, async (c) => {
  const supabase = c.get('supabase')

  const { data: offices, error } = await supabase
    .from('offices')
    .select('*')
    .order('region', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    return c.json({ error: error.message }, 400)
  }

  return c.json({ offices })
})

// ============= Users APIs =============

app.get('/api/users', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = c.get('supabase')

  // Get user profile to check role and region
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, office_id, region')
    .eq('id', user.id)
    .single()

  let query = supabase
    .from('profiles')
    .select('id, email, full_name, role, office_id, region, offices(id, name, region)')
    .order('full_name', { ascending: true })

  // Regional manager: show all users in the same region
  if (profile?.role === 'regional_manager') {
    query = query.eq('region', profile.region)
  }
  // Base manager: show only users from same office
  else if (profile?.role === 'base_manager') {
    query = query.eq('office_id', profile.office_id)
  }
  // Member: no access to user list (will return empty or their own profile)

  const { data: users, error } = await query

  if (error) {
    return c.json({ error: error.message }, 400)
  }

  return c.json({ users })
})

// ============= Profiles APIs =============

app.put('/api/profiles/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = c.get('supabase')
  const profileId = c.req.param('id')
  const { full_name, office_id, manager_id, role, region } = await c.req.json()

  // Get user profile to check role
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role, region, office_id')
    .eq('id', user.id)
    .single()

  // Check if user has permission to update this profile
  // Self edit: always allowed
  // Regional manager: can edit users in their region
  // Base manager: can edit users in their office
  if (user.id !== profileId) {
    if (currentProfile?.role === 'regional_manager') {
      // Check if target user is in the same region
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('region')
        .eq('id', profileId)
        .single()
      
      if (targetProfile?.region !== currentProfile.region) {
        return c.json({ error: 'Unauthorized: Cannot edit users outside your region' }, 403)
      }
    } else if (currentProfile?.role === 'base_manager') {
      // Check if target user is in the same office
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('office_id')
        .eq('id', profileId)
        .single()
      
      if (targetProfile?.office_id !== currentProfile.office_id) {
        return c.json({ error: 'Unauthorized: Cannot edit users outside your office' }, 403)
      }
    } else {
      // Members can only edit themselves
      return c.json({ error: 'Unauthorized' }, 403)
    }
  }

  // Build update data
  const updateData: any = { full_name, office_id, manager_id }
  
  // Only regional_manager can change role and region
  if (currentProfile?.role === 'regional_manager') {
    if (role) updateData.role = role
    if (region) updateData.region = region
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', profileId)
    .select('*, offices(id, name, region)')
    .single()

  if (error) {
    return c.json({ error: error.message }, 400)
  }

  return c.json({ profile })
})

// ============= Works APIs =============

app.get('/api/works', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = c.get('supabase')

  // Get user profile to check role, region, and office
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, region, office_id')
    .eq('id', user.id)
    .single()

  let query = supabase
    .from('works')
    .select(`
      *, 
      profiles(email, full_name, role, office_id, region),
      offices(id, name, region),
      checkins(id, created_at, unknowns_decreased, unknowns_increased, decision_progressed, decision_stalled, no_change)
    `)
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  // Regional manager: show all works in their region
  if (profile?.role === 'regional_manager') {
    // Filter by region through offices table
    const { data: offices } = await supabase
      .from('offices')
      .select('id')
      .eq('region', profile.region)
    
    const officeIds = offices?.map(o => o.id) || []
    if (officeIds.length > 0) {
      query = query.in('office_id', officeIds)
    }
  }
  // Base manager: show only works from their office
  else if (profile?.role === 'base_manager') {
    query = query.eq('office_id', profile.office_id)
  }
  // Member: show only their own works
  else if (profile?.role === 'member') {
    query = query.eq('user_id', user.id)
  }

  const { data: works, error } = await query

  if (error) {
    return c.json({ error: error.message }, 400)
  }

  // Sort checkins by created_at descending for each work
  const worksWithSortedCheckins = works?.map(work => ({
    ...work,
    checkins: work.checkins?.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ) || []
  }))

  return c.json({ works: worksWithSortedCheckins })
})

app.post('/api/works', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = c.get('supabase')
  const { goal_state, unknowns, waiting_on, user_id, office_id } = await c.req.json()

  // Get user profile to check role, region, and office
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, office_id, region')
    .eq('id', user.id)
    .single()

  // Determine the actual user_id for the work
  // Regional manager and base manager can assign to others
  // Members can only create for themselves
  const actualUserId = (profile?.role === 'regional_manager' || profile?.role === 'base_manager') && user_id 
    ? user_id 
    : user.id

  // Determine office_id
  const actualOfficeId = office_id || profile?.office_id

  const { data: work, error } = await supabase
    .from('works')
    .insert({
      user_id: actualUserId,
      assigned_by: actualUserId !== user.id ? user.id : null,
      office_id: actualOfficeId,
      goal_state,
      unknowns,
      waiting_on
    })
    .select()
    .single()

  if (error) {
    return c.json({ error: error.message }, 400)
  }

  return c.json({ work })
})

app.get('/api/works/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = c.get('supabase')
  const workId = c.req.param('id')

  const { data: work, error } = await supabase
    .from('works')
    .select('*, profiles(email, full_name, role)')
    .eq('id', workId)
    .single()

  if (error) {
    return c.json({ error: error.message }, 404)
  }

  // Check if user has access
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'executive' && work.user_id !== user.id) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  // Get checkins for this work
  const { data: checkins } = await supabase
    .from('checkins')
    .select('*')
    .eq('work_id', workId)
    .order('created_at', { ascending: false })

  return c.json({ work, checkins: checkins || [] })
})

app.patch('/api/works/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = c.get('supabase')
  const workId = c.req.param('id')
  const updates = await c.req.json()

  const { data: work, error } = await supabase
    .from('works')
    .update(updates)
    .eq('id', workId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return c.json({ error: error.message }, 400)
  }

  return c.json({ work })
})

// ============= Check-ins APIs =============

app.post('/api/checkins', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = c.get('supabase')
  const { work_id, unknowns_decreased, unknowns_increased, decision_progressed, decision_stalled, no_change } = await c.req.json()

  const { data: checkin, error } = await supabase
    .from('checkins')
    .insert({
      work_id,
      user_id: user.id,
      unknowns_decreased: unknowns_decreased || false,
      unknowns_increased: unknowns_increased || false,
      decision_progressed: decision_progressed || false,
      decision_stalled: decision_stalled || false,
      no_change: no_change || false
    })
    .select()
    .single()

  if (error) {
    return c.json({ error: error.message }, 400)
  }

  return c.json({ checkin })
})

app.get('/api/checkins/:workId', authMiddleware, async (c) => {
  const supabase = c.get('supabase')
  const workId = c.req.param('workId')

  const { data: checkins, error } = await supabase
    .from('checkins')
    .select('*')
    .eq('work_id', workId)
    .order('created_at', { ascending: false })

  if (error) {
    return c.json({ error: error.message }, 400)
  }

  return c.json({ checkins })
})

// ============= Dashboard API (Executive) =============

app.get('/api/dashboard', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = c.get('supabase')

  // Get user profile to check role, region, and office
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, region, office_id')
    .eq('id', user.id)
    .single()

  // Only managers can access dashboard
  if (profile?.role !== 'regional_manager' && profile?.role !== 'base_manager') {
    return c.json({ error: 'Forbidden - Manager access required' }, 403)
  }

  // Build query based on role
  let query = supabase
    .from('works')
    .select('*, profiles(email, full_name, office_id, region), offices(id, name, region)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  // Regional manager: show all works in their region
  if (profile?.role === 'regional_manager') {
    const { data: offices } = await supabase
      .from('offices')
      .select('id')
      .eq('region', profile.region)
    
    const officeIds = offices?.map(o => o.id) || []
    if (officeIds.length > 0) {
      query = query.in('office_id', officeIds)
    }
  }
  // Base manager: show only works from their office
  else if (profile?.role === 'base_manager') {
    query = query.eq('office_id', profile.office_id)
  }

  const { data: works, error } = await query

  if (error) {
    return c.json({ error: error.message }, 400)
  }

  // Get all checkins for these works
  const workIds = works.map((w: any) => w.id)
  const { data: allCheckins } = await supabase
    .from('checkins')
    .select('*')
    .in('work_id', workIds)
    .order('created_at', { ascending: false })

  // Calculate intervention level for each work
  const dashboard = works.map((work: any) => {
    const checkins = (allCheckins || []).filter((c: any) => c.work_id === work.id)
    const assessment = assessInterventionLevel(work, checkins)
    
    return {
      ...work,
      checkins,
      intervention: assessment
    }
  })

  // Sort by intervention level: red -> yellow -> green
  const levelOrder = { red: 0, yellow: 1, green: 2 }
  dashboard.sort((a: any, b: any) => levelOrder[a.intervention.level] - levelOrder[b.intervention.level])

  return c.json({ dashboard })
})

// Intervention level assessment logic
function assessInterventionLevel(work: any, checkins: any[]) {
  const now = new Date()
  const workAge = Math.floor((now.getTime() - new Date(work.created_at).getTime()) / (1000 * 60 * 60 * 24))
  
  const reasons: string[] = []
  const actions: string[] = []
  let level: 'green' | 'yellow' | 'red' = 'green'

  if (checkins.length === 0) {
    if (workAge >= 2) {
      level = 'red'
      reasons.push('作成から2日以上経過しているが、チェックインが1度もない')
      actions.push('10分ヒアリング: 進捗状況と障害を確認')
    } else {
      level = 'yellow'
      reasons.push('まだチェックインがない')
      actions.push('軽く声をかけて状況確認')
    }
    return { level, reasons, actions, lastCheckin: null }
  }

  const recentCheckins = checkins.slice(0, 5)
  const lastCheckin = checkins[0]
  const daysSinceLastCheckin = Math.floor((now.getTime() - new Date(lastCheckin.created_at).getTime()) / (1000 * 60 * 60 * 24))

  // 🔴 Red conditions
  // 1. decision_stalled for 2+ days
  const stalledCheckins = recentCheckins.filter((c: any) => c.decision_stalled)
  if (stalledCheckins.length > 0 && daysSinceLastCheckin >= 2) {
    level = 'red'
    reasons.push('判断が止まった状態が2日以上継続')
    actions.push('緊急ミーティング: 判断に必要な情報を提供')
  }

  // 2. no_change 3+ times in a row
  const noChangeStreak = recentCheckins.filter((c: any) => c.no_change).length
  if (noChangeStreak >= 3) {
    level = 'red'
    reasons.push('3回以上連続で「変化なし」')
    actions.push('20分ミーティング: アプローチの見直しが必要')
  }

  // 3. unknowns_increased with no improvement
  if (lastCheckin.unknowns_increased) {
    const hasImprovement = recentCheckins.slice(1).some((c: any) => 
      c.unknowns_decreased || c.decision_progressed
    )
    if (!hasImprovement) {
      level = 'red'
      reasons.push('未確定事項が増えたまま改善が見られない')
      actions.push('15分ブリーフィング: 優先順位の整理と支援')
    }
  }

  // 🟡 Yellow conditions (if not already red)
  if (level !== 'red') {
    // 1. no_change 2 times in a row
    if (noChangeStreak >= 2) {
      level = 'yellow'
      reasons.push('2回連続で「変化なし」')
      actions.push('5分チェックイン: 障害がないか確認')
    }

    // 2. unknowns_increased recently
    if (lastCheckin.unknowns_increased) {
      level = 'yellow'
      reasons.push('直近で未確定事項が増加')
      actions.push('10分相談: 不明点の整理を手伝う')
    }

    // 3. No checkin for 2+ days
    if (daysSinceLastCheckin >= 2) {
      level = 'yellow'
      reasons.push(`最終チェックインから${daysSinceLastCheckin}日経過`)
      actions.push('軽く声をかけて状況確認')
    }
  }

  // 🟢 Green conditions
  if (level === 'green') {
    const hasPositive = recentCheckins.slice(0, 2).some((c: any) => 
      c.unknowns_decreased || c.decision_progressed
    )
    if (hasPositive) {
      reasons.push('直近で前進あり（未確定が減少 or 判断が進展）')
      actions.push('現状維持でOK - 次回チェックインを待つ')
    } else {
      reasons.push('特に問題は見られない')
      actions.push('様子見で問題なし')
    }
  }

  return {
    level,
    reasons,
    actions,
    lastCheckin: lastCheckin.created_at,
    daysSinceLastCheckin
  }
}

// ============= Frontend =============

app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Creative App - 介入判断ダッシュボード</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          .card { transition: all 0.3s ease; }
          .card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .level-red { border-left: 4px solid #ef4444; }
          .level-yellow { border-left: 4px solid #f59e0b; }
          .level-green { border-left: 4px solid #10b981; }
        </style>
    </head>
    <body class="bg-gray-50">
        <div id="app"></div>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
