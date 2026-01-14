<template>
  <div class="app-root">
    <!-- 极简渐变背景 -->
    <div class="bg-surface"></div>

    <div class="app-container">
      <!-- 极简顶部导航 -->
      <header class="navbar">
        <div class="brand">
          <div class="brand-mark"></div>
          <h1 class="brand-text">RollCall <span class="badge">Plus Pro Max</span></h1>
        </div>
        
        <div class="nav-actions">
          <button class="nav-btn" @click="loadNames" aria-label="Manage List">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke-width="2" stroke-linecap="round"/>
              <circle cx="9" cy="7" r="4" stroke-width="2"/>
              <path d="M20 8v6M23 11h-6" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span>名单管理</span>
          </button>
          
          <button class="nav-btn" :class="{ 'active': isHistoryExpanded }" @click="isHistoryExpanded = !isHistoryExpanded">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span>抽取历史</span>
          </button>
        </div>
      </header>

      <main class="workspace" :class="{ 
        'right-open': isHistoryExpanded, 
        'left-open': isListExpanded 
      }">
        <!-- 核心名单侧边栏 (左侧) -->
        <aside class="list-sidebar">
          <div class="sidebar-inner mirrored">
            <header class="sidebar-head">
              <h3>成员名单</h3>
              <div class="header-badge">{{ names.length }}</div>
            </header>
            
            <div class="history-list">
              <transition-group name="item-anim-left">
                <div v-for="(name, idx) in names" :key="name + idx" class="list-entry">
                  <span class="entry-index">{{ idx + 1 }}</span>
                  <span class="entry-name">{{ name }}</span>
                </div>
              </transition-group>
              
              <div v-if="names.length === 0" class="no-history">
                <div class="blank-icon">⚠</div>
                <p>名单当前为空</p>
              </div>
            </div>
          </div>

          <!-- 左侧悬浮折叠按钮 -->
          <button class="sidebar-toggle-float left" @click="isListExpanded = false" v-if="isListExpanded" title="折叠名单">
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </aside>
        <!-- 主交互区 -->
        <section class="selection-hub">
          <div class="hub-container">
            <!-- 配置栏 -->
            <div class="config-bar">
              <div class="config-item">
                <span class="config-label">抽取规模</span>
                <div class="picker-wrapper">
                  <select v-model="pickCount" :disabled="isRolling" class="pro-select">
                    <option v-for="n in 5" :key="n" :value="n">{{ n }} 位成员</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- 展示舞台 -->
            <div class="display-stage" :class="{ 'is-rolling': isRolling }">
              <div v-if="!listLoaded" class="empty-state">
                <h2 class="empty-title">尚未加载名单</h2>
                <p class="empty-desc">请从右上方或下方按钮导入您的成员名单</p>
                <button class="ghost-cta" @click="loadNames">
                  开始同步名单
                </button>
              </div>

              <div v-else class="results-grid">
                <transition-group :name="isRolling ? 'name-anim' : 'result-anim'">
                  <div v-for="(name, index) in displayNames" 
                       :key="index + '-' + name" 
                       class="name-tile">
                    <span class="name-text">{{ name }}</span>
                  </div>
                </transition-group>
              </div>
            </div>

            <!-- 动作区域 -->
            <div v-if="listLoaded" class="action-dock">
              <template v-if="names.length > 0 || isRolling">
                <button 
                  class="prime-btn" 
                  @click="startPick" 
                  :disabled="names.length === 0 && !isRolling"
                >
                  <div class="btn-inner">
                    <span v-if="!isRolling">开启随机筛选</span>
                    <span v-else class="rolling-text">停止滚动</span>
                  </div>
                  <div class="btn-progress" :style="{ width: isRolling ? '100%' : '0%' }"></div>
                </button>
              </template>
              <div v-else class="exhausted-hint">
                <p class="exhaust-msg">名单已全部抽取完毕</p>
                <button class="ghost-cta mini" @click="loadNames">
                  重新同步名单
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- 侧边历史记录 -->
        <aside class="history-sidebar">
          <!-- 悬浮折叠按钮 -->
          <button class="sidebar-toggle-float" @click="isHistoryExpanded = false" v-if="isHistoryExpanded" title="折叠历史">
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          
          <div class="sidebar-inner">
            <header class="sidebar-head">
              <h3>记录回顾</h3>
              <button v-if="history.length > 0" class="clear-btn" @click="clearHistory">清除全部</button>
            </header>
            
            <div class="history-list">
              <transition-group name="item-anim">
                <div v-for="item in history" :key="item.id" class="history-entry">
                  <div class="entry-meta">
                    <span class="entry-time">{{ item.time }}</span>
                    <span class="entry-count">{{ item.names.length }}人</span>
                  </div>
                  <div class="entry-names">{{ item.names.join('、') }}</div>
                </div>
              </transition-group>
              
              <div v-if="history.length === 0" class="no-history">
                <div class="blank-icon">∅</div>
                <p>尚无筛选记录</p>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <!-- 状态页脚 -->
      <footer class="footer">
        <div class="footer-left" @click="isListExpanded = !isListExpanded" title="展开/收起成员名单">
          <span class="status-dot" :class="{ 'has-data': names.length > 0 }"></span>
          <span>当前名单共 {{ names.length }} 人</span>
        </div>
        <div class="footer-right">
          &copy; 2026 DIGITAL ROLLCALL SYSTEM
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

// -- 状态管理 --
const uniqueMode = ref(false) 
const history = ref([])
const names = ref([])
const pickCount = ref(1)
const displayNames = ref(['准备就绪'])
const isRolling = ref(false)
const isHistoryExpanded = ref(false)
const isListExpanded = ref(false)
const listLoaded = ref(false)

let timer = null
let autoStopTimer = null

// -- 核心逻辑 --
function startPick() {
  if (isRolling.value) {
    stopPick()
    return
  }
  
  if (names.value.length === 0) return
  
  isRolling.value = true
  
  // 滚动动画
  timer = setInterval(() => {
    const pool = names.value
    displayNames.value = Array.from({ length: pickCount.value }, () => {
      if (!pool.length) return '空'
      return pool[Math.floor(Math.random() * pool.length)]
    })
  }, 60)

  // 自动停止定时器（改为 8s）
  autoStopTimer = setTimeout(() => {
    stopPick()
  }, 8000)
}

function stopPick() {
  if (!isRolling.value) return
  
  clearInterval(timer)
  if (autoStopTimer) clearTimeout(autoStopTimer)
  
  let currentPool = [...names.value]
  const selected = []
  
  for (let i = 0; i < pickCount.value; i++) {
    if (currentPool.length === 0) break
    const idx = Math.floor(Math.random() * currentPool.length)
    selected.push(currentPool[idx])
    if (uniqueMode.value) currentPool.splice(idx, 1)
  }
  
  displayNames.value = selected
  isRolling.value = false
  
  if (uniqueMode.value) names.value = currentPool

  // 更新历史
  history.value.unshift({
    id: Date.now(),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    names: [...selected]
  })
  
  if (history.value.length > 30) history.value.pop()
  
  timer = null
  autoStopTimer = null
}

async function loadNames() {
  if (!window.electronAPI) {
    // 非桌面环境模拟数据
    names.value = ['张伟', '王芳', '李静', '刘强', '陈洋', '杨明', '黄勇', '吴倩']
    displayNames.value = ['演示名单就绪']
    listLoaded.value = true
    isListExpanded.value = true // 导入后自动展示名单
    return
  }

  try {
    const result = await window.electronAPI.openTxtFile()
    if (result && result.length > 0) {
      names.value = result
      displayNames.value = ['名单已同步 (' + result.length + ')']
      listLoaded.value = true
      isListExpanded.value = true // 导入后自动展示名单
    }
  } catch (err) {
    console.error('File load failed:', err)
  }
}

function clearHistory() {
  history.value = []
}

// -- 持久化 --
onMounted(() => {
  const saved = localStorage.getItem('rollcall-v4')
  if (saved) {
    const s = JSON.parse(saved)
    pickCount.value = s.pickCount || 1
  }
})

watch([pickCount], () => {
  localStorage.setItem('rollcall-v4', JSON.stringify({
    pickCount: pickCount.value
  }))
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

:root {
  /* 精选简约色彩体系 */
  --bg-main: #ffffff;
  --bg-accent: #f8f9fa;
  --text-main: #000000;
  --text-dim: #6c757d;
  --text-muted: #adb5bd;
  --primary: #5856d6; 
  --border-light: rgba(0, 0, 0, 0.05);
  --border-medium: rgba(0, 0, 0, 0.1);
  --sidebar-width: 360px;
  --transition-smooth: 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', 'PingFang SC', system-ui, sans-serif;
  color: var(--text-main);
  background-color: var(--bg-main);
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
}

.app-root {
  position: relative;
  height: 100vh;
  width: 100vw;
}

.bg-surface {
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(at 0% 0%, rgba(88, 86, 214, 0.03) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(88, 86, 214, 0.03) 0px, transparent 50%);
  z-index: -1;
}

.app-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0 4vw; /* 使用响应式内边距 */
  max-width: 1600px;
  margin: 0 auto;
}

/* 顶部导航 */
.navbar {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px solid var(--border-light);
}

.brand {
  display: flex;
  align-items: center;
  gap: 16px;
}

.brand-mark {
  width: 14px;
  height: 14px;
  background: var(--text-main);
  border-radius: 2px;
}

.brand-text {
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  text-transform: uppercase;
}

.badge {
  font-weight: 400;
  color: var(--text-dim);
  font-size: 0.8rem;
  margin-left: 8px;
}

.nav-actions {
  display: flex;
  gap: 32px;
}

.nav-btn {
  background: none;
  border: none;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-dim);
  cursor: pointer;
  padding: 12px 0;
  transition: all 0.3s;
  position: relative;
}

.nav-btn:hover, .nav-btn.active {
  color: var(--text-main);
}

.nav-btn.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--text-main);
}

.nav-icon {
  width: 20px;
  height: 20px;
}

/* 工作区结构 - 三栏式 */
.workspace {
  flex: 1;
  display: grid;
  grid-template-columns: 0px 1fr 0px;
  gap: 0;
  padding: 2vh 0;
  overflow: hidden;
  transition: all var(--transition-smooth);
}

.workspace.left-open {
  grid-template-columns: var(--sidebar-width) 1fr 0px;
}

.workspace.right-open {
  grid-template-columns: 0px 1fr var(--sidebar-width);
}

.workspace.left-open.right-open {
  grid-template-columns: var(--sidebar-width) 1fr var(--sidebar-width);
}

/* 点名核心区 */
.selection-hub {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.hub-container {
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* 关键：确保主容器不超出视口高度，并根据需要微调缩放 */
  max-height: 70vh;
  justify-content: center;
}

.config-bar {
  margin-bottom: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.config-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 20px;
}

.pro-select {
  padding: 16px 0;
  border: none;
  border-bottom: 3px solid var(--border-medium);
  background: transparent;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-main);
  outline: none;
  cursor: pointer;
  width: 140px;
  text-align: center;
  transition: border-color 0.4s;
}

.pro-select:focus {
  border-color: var(--text-main);
}

/* 精致切换按钮 */
.toggle-btn {
  background: var(--bg-accent);
  border: 1px solid var(--border-medium);
  border-radius: 30px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 100px;
  position: relative;
}

.toggle-btn.active {
  background: var(--text-main);
  border-color: var(--text-main);
  color: var(--bg-main);
}

.toggle-dot {
  width: 12px;
  height: 12px;
  background: var(--text-muted);
  border-radius: 50%;
  transition: all 0.3s;
}

.toggle-btn.active .toggle-dot {
  background: var(--bg-main);
  transform: scale(1.2);
}

.toggle-text {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.toggle-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 舞台展示 */
.display-stage {
  min-height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 40px;
  position: relative;
  width: 100%;
}

.results-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 32px;
}

.name-tile {
  font-size: clamp(2.5rem, 10vh, 5.5rem); /* 根据高度动态缩放字号 */
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 1.1;
  color: var(--text-main);
  padding: 0.8vh 20px;
  border-bottom: 0.8vh solid var(--text-main);
  transition: all 0.4s ease;
}

.is-rolling .name-tile {
  opacity: 0.3;
  filter: blur(4px);
  transform: scale(0.9);
}

/* 现代留白态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.empty-title {
  font-size: clamp(2rem, 6vh, 3.5rem);
  font-weight: 800;
  color: var(--text-dim);
  letter-spacing: -0.04em;
  line-height: 1.1;
}

.empty-desc {
  color: var(--text-muted);
  font-size: 1.1rem;
  max-width: 400px;
  line-height: 1.6;
}

.ghost-cta {
  background: var(--text-main);
  color: var(--bg-main);
  border: none;
  padding: 20px 40px;
  font-weight: 800;
  font-size: 1rem;
  width: fit-content;
  margin-top: 32px;
  cursor: pointer;
  transition: all 0.3s;
}

.ghost-cta:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.ghost-cta.mini {
  padding: 12px 24px;
  font-size: 0.85rem;
  margin-top: 16px;
}

/* 主要操作按钮 */
.action-dock {
  width: 100%;
  display: flex;
  justify-content: center;
}

.prime-btn {
  position: relative;
  width: 100%;
  max-width: 400px;
  padding: 3vh 32px; /* 响应式内边距 */
  background: var(--text-main);
  color: var(--bg-main);
  border: none;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.4s;
}

.prime-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
}

.prime-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-inner {
  position: relative;
  z-index: 2;
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.btn-progress {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: var(--primary);
  opacity: 0.15;
  transition: width 0.1s linear;
}

.rolling-text {
  animation: pulse 1s infinite alternate;
}

.exhausted-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.exhausted-hint p.exhaust-msg {
  color: var(--text-dim);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

/* 侧边栏悬浮按钮 */
.sidebar-toggle-float {
  position: absolute;
  right: -20px;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  background: var(--bg-main);
  border: 1px solid var(--border-medium);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.sidebar-toggle-float.left {
  right: auto;
  left: auto;
  right: -20px; /* 逻辑调整：始终位于侧边栏与主区交界处 */
}

/* 重新定位 */
.history-sidebar .sidebar-toggle-float {
  left: -20px;
  right: auto;
}

.list-sidebar .sidebar-toggle-float {
  right: -20px;
  left: auto;
}

.sidebar-toggle-float:hover {
  transform: translateY(-50%) scale(1.1);
  background: var(--text-main);
  color: var(--bg-main);
  border-color: var(--text-main);
}

@keyframes pulse {
  0% { opacity: 0.5; }
  100% { opacity: 1; }
}

/* 统一侧边栏基础 */
.history-sidebar, .list-sidebar {
  border-left: 1px solid var(--border-light);
  overflow: hidden;
  opacity: 0;
  transform: translateX(40px);
  pointer-events: none;
  transition: all var(--transition-smooth);
  position: relative;
}

.list-sidebar {
  border-left: none;
  border-right: 1px solid var(--border-light);
  transform: translateX(-40px);
}

.left-open .list-sidebar, .right-open .history-sidebar {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

.sidebar-inner {
  height: 100%;
  padding-left: 40px;
  display: flex;
  flex-direction: column;
}

.sidebar-inner.mirrored {
  padding-left: 0;
  padding-right: 40px;
}

.sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 40px;
}

.header-badge {
  background: var(--text-main);
  color: var(--bg-main);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 800;
}

.list-entry {
  padding: 16px 0;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  gap: 16px;
}

.entry-index {
  color: var(--text-muted);
  font-size: 0.7rem;
  font-weight: 800;
  width: 20px;
}

.entry-name {
  font-weight: 600;
  color: var(--text-main);
}

.sidebar-head h3 {
  font-size: 1rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-dim);
}

.clear-btn {
  background: none;
  border: none;
  color: #ff3b30;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.clear-btn:hover {
  opacity: 1;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 20px;
}

.history-entry {
  padding: 32px 0;
  border-bottom: 1px solid var(--border-light);
}

.entry-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.entry-time {
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--text-muted);
}

.entry-count {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.entry-names {
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.6;
}

.no-history {
  text-align: center;
  color: var(--text-muted);
  padding-top: 120px;
}

.blank-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.2;
}

/* 页脚 */
.footer {
  height: 100px;
  border-top: 2px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

.footer-left {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 16px;
  margin-left: -16px;
  border-radius: 8px;
  transition: all 0.3s;
}

.footer-left:hover {
  background: var(--border-light);
  color: var(--text-main);
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: var(--text-muted);
  border-radius: 50%;
  margin-right: 12px;
}

.status-dot.has-data {
  background: #34c759;
  box-shadow: 0 0 10px rgba(52, 199, 89, 0.4);
}

/* 动效补丁 */
.name-anim-enter-active {
  transition: all 0.6s var(--transition-smooth);
}
.name-anim-leave-active {
  display: none;
}
.name-anim-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

/* 结果展示动效：消除空白 */
.result-anim-enter-active {
  transition: all 0.3s ease-out;
}
.result-anim-leave-active {
  display: none; /* 关键：旧元素立刻消失，不占位 */
}
.result-anim-enter-from {
  opacity: 0;
  transform: scale(0.9); /* 只有轻微缩放，不再有大位移 */
}

.item-anim-enter-active, .item-anim-leave-active,
.item-anim-left-enter-active, .item-anim-left-leave-active {
  transition: all 0.4s ease;
}

.item-anim-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.item-anim-left-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

/* 自定义滚动条 */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border-medium); border-radius: 10px; }
</style>
