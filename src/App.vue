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
            <span>点名历史</span>
          </button>
        </div>
      </header>

      <main class="workspace" :class="{ 'sidebar-open': isHistoryExpanded }">
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
              <div v-if="names.length === 0" class="empty-state">
                <h2 class="empty-title">尚未加载名单</h2>
                <p class="empty-desc">请从右上方或下方按钮导入您的成员名单</p>
                <button class="ghost-cta" @click="loadNames">
                  开始同步名单
                </button>
              </div>

              <div v-else class="results-grid">
                <transition-group name="name-anim">
                  <div v-for="(name, index) in displayNames" 
                       :key="index + '-' + name" 
                       class="name-tile">
                    <span class="name-text">{{ name }}</span>
                  </div>
                </transition-group>
              </div>
            </div>

            <!-- 动作区域 -->
            <div v-if="names.length > 0" class="action-dock">
              <button 
                class="prime-btn" 
                @click="startPick" 
                :disabled="isRolling"
              >
                <div class="btn-inner">
                  <span v-if="!isRolling">开启随机筛选</span>
                  <span v-else class="rolling-text">正在检索...</span>
                </div>
                <div class="btn-progress" :style="{ width: isRolling ? '100%' : '0%' }"></div>
              </button>
            </div>
          </div>
        </section>

        <!-- 侧边历史记录 -->
        <aside class="history-sidebar">
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
        <div class="footer-left">
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
const uniqueMode = ref(true) 
const history = ref([])
const names = ref([])
const pickCount = ref(1)
const displayNames = ref(['准备就绪'])
const isRolling = ref(false)
const isHistoryExpanded = ref(false)

let timer = null

// -- 核心逻辑 --
function startPick() {
  if (isRolling.value || names.value.length === 0) return
  
  isRolling.value = true
  
  // 滚动动画
  timer = setInterval(() => {
    const pool = names.value
    displayNames.value = Array.from({ length: pickCount.value }, () => {
      if (!pool.length) return '空'
      return pool[Math.floor(Math.random() * pool.length)]
    })
  }, 60)

  // 最终选择
  setTimeout(() => {
    clearInterval(timer)
    
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
  }, 1000)
}

async function loadNames() {
  if (!window.electronAPI) {
    // 非桌面环境模拟数据
    names.value = ['张伟', '王芳', '李静', '刘强', '陈洋', '杨明', '黄勇', '吴倩']
    displayNames.value = ['演示名单就绪']
    return
  }

  try {
    const result = await window.electronAPI.openTxtFile()
    if (result && result.length > 0) {
      names.value = result
      displayNames.value = ['名单已同步 (' + result.length + ')']
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
    uniqueMode.value = s.uniqueMode ?? true
    pickCount.value = s.pickCount || 1
  }
})

watch([uniqueMode, pickCount], () => {
  localStorage.setItem('rollcall-v4', JSON.stringify({
    uniqueMode: uniqueMode.value,
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
  padding: 0 60px;
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

/* 工作区结构 */
.workspace {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 0px;
  gap: 0;
  padding: 80px 0;
  overflow: hidden;
  transition: grid-template-columns var(--transition-smooth);
}

.workspace.sidebar-open {
  grid-template-columns: 1fr var(--sidebar-width);
  gap: 80px;
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
}

.config-bar {
  margin-bottom: 60px;
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

/* 舞台展示 */
.display-stage {
  min-height: 280px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 80px;
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
  font-size: 6rem;
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 1.1;
  color: var(--text-main);
  padding: 12px 24px;
  border-bottom: 8px solid var(--text-main);
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
  font-size: 3.5rem;
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

/* 主要操作按钮 */
.action-dock {
  margin-top: auto;
  width: 100%;
  display: flex;
  justify-content: center;
}

.prime-btn {
  position: relative;
  width: 100%;
  max-width: 400px;
  padding: 32px;
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
  cursor: wait;
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

@keyframes pulse {
  0% { opacity: 0.5; }
  100% { opacity: 1; }
}

/* 侧边历史记录 */
.history-sidebar {
  border-left: 2px solid var(--border-light);
  overflow: hidden;
  opacity: 0;
  transform: translateX(40px);
  pointer-events: none;
  transition: all var(--transition-smooth);
}

.sidebar-open .history-sidebar {
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

.sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 40px;
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
.name-anim-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.item-anim-enter-active, .item-anim-leave-active {
  transition: all 0.4s ease;
}
.item-anim-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

/* 自定义滚动条 */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border-medium); border-radius: 10px; }
</style>
