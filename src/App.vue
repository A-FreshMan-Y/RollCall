<template>
  <div class="app-shell">
    <div class="main-wrapper">
      <!-- 极简顶部栏 -->
      <header class="site-header">
        <div class="brand">
          <span class="brand-dot"></span>
          <h1>随机点名 <span class="version">Pro Plus Max</span></h1>
        </div>
        <div class="sys-actions">
          <button class="ghost-btn" @click="loadNames">
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span>名单管理</span>
          </button>
          <button class="ghost-btn" @click="isHistoryExpanded = !isHistoryExpanded" :class="{ 'active': isHistoryExpanded }">
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>点名历史</span>
          </button>
        </div>
      </header>

      <div class="workspace" :class="{ 'sidebar-collapsed': !isHistoryExpanded }">
        <!-- 主交互区 -->
        <section class="stage">
          <div class="stage-inner">
            <div class="controls-grid">
              <div class="control-group">
                <label>抽取人数</label>
                <select v-model="pickCount" :disabled="isRolling" class="minimal-select">
                  <option v-for="n in 5" :key="n" :value="n">{{ n }} 人</option>
                </select>
              </div>
              
              <!-- uniqueMode 默认开启且处于隐藏状态 -->
            </div>

            <div class="result-display" :class="{ 'rolling': isRolling }">
              <div v-if="names.length === 0" class="empty-state-container">
                <div class="empty-hint">请先加载名单以开始点名</div>
                <button class="ghost-btn large" @click="loadNames">
                  <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <span>点击导入名单</span>
                </button>
              </div>
              <transition-group v-else name="name-fade" tag="div" class="names-container">
                <div v-for="(name, index) in displayNames" 
                     :key="index + '-' + name" 
                     class="name-box">
                  {{ name }}
                </div>
              </transition-group>
            </div>

            <div v-if="names.length > 0" class="cta-area">
              <button 
                class="action-btn" 
                :class="{ 'is-loading': isRolling }"
                @click="startPick" 
                :disabled="isRolling"
              >
                {{ isRolling ? '正在抽取...' : '开始抽取' }}
              </button>
            </div>
          </div>
        </section>

        <!-- 侧边栏 / 历史记录 -->
        <aside class="sidebar" :class="{ 'is-collapsed': !isHistoryExpanded }">
          <div class="sidebar-content">
            <div class="sidebar-header">
              <h2>历史记录</h2>
              <button v-if="history.length > 0" class="text-link" @click="clearHistory">清空</button>
            </div>
            <div class="history-scroll">
              <transition-group name="list-slide">
                <div v-for="item in history" :key="item.id" class="history-card">
                  <time>{{ item.time }}</time>
                  <div class="history-names">{{ item.names.join('、') }}</div>
                </div>
              </transition-group>
              <div v-if="history.length === 0" class="empty-history">
                暂无记录
              </div>
            </div>
          </div>
        </aside>
      </div>

      <footer class="site-footer">
        <div class="stats">
          总人数：<strong>{{ names.length }}</strong>
        </div>
        <div class="legal">
          &copy; 2026 随机点名 Pro Plus Max
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const uniqueMode = ref(true)
const history = ref([])
const names = ref([])
const pickCount = ref(1)
const displayNames = ref(['准备就绪'])
const isRolling = ref(false)
const isHistoryExpanded = ref(false)

let timer = null

function startPick() {
  if (isRolling.value || names.value.length === 0) return
  
  isRolling.value = true
  
  timer = setInterval(() => {
    // 滚动动画期间不修改源名单，仅作展示
    const pool = names.value
    displayNames.value = Array.from({ length: pickCount.value }, () => {
      if (!pool.length) return '空'
      const index = Math.floor(Math.random() * pool.length)
      return pool[index]
    })
  }, 50)

  setTimeout(() => {
    clearInterval(timer)
    
    // 最终选定结果：确保结果本身的唯一性（如果开启了不重复抽取）
    let pool = [...names.value]
    const finalSelection = []
    
    for (let i = 0; i < pickCount.value; i++) {
      if (pool.length === 0) break
      const index = Math.floor(Math.random() * pool.length)
      finalSelection.push(pool[index])
      if (uniqueMode.value) {
        pool.splice(index, 1)
      }
    }
    
    displayNames.value = finalSelection
    isRolling.value = false
    
    // 如果开启了不重复抽取，同步更新源名单
    if (uniqueMode.value) {
      names.value = pool
    }

    history.value.unshift({
      id: Date.now(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      names: [...displayNames.value]
    })
    
    if (history.value.length > 30) history.value.pop()
  }, 1200)
}

async function loadNames() {
  if (!window.electronAPI) {
    names.value = ['张伟', '王芳', '李静', '刘强', '陈洋', '杨明', '黄勇', '吴倩']
    displayNames.value = ['演示名单已加载']
    return
  }

  try {
    const result = await window.electronAPI.openTxtFile()
    if (result && result.length > 0) {
      names.value = result
      displayNames.value = ['名单已同步 (' + result.length + ')']
    }
  } catch (err) {
    console.error(err)
  }
}

function clearHistory() {
  history.value = []
}

onMounted(() => {
  const saved = localStorage.getItem('rollcall-v3')
  if (saved) {
    const s = JSON.parse(saved)
    uniqueMode.value = s.uniqueMode ?? true
    pickCount.value = s.pickCount || 1
  }
})

watch([uniqueMode, pickCount], () => {
  localStorage.setItem('rollcall-v3', JSON.stringify({
    uniqueMode: uniqueMode.value,
    pickCount: pickCount.value
  }))
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f9f9fb;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --border-color: #e5e7eb;
  --accent-color: #000000;
  --accent-contrast: #ffffff;
  --danger: #ef4444;
  --safe-area: 40px;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', -apple-system, sans-serif;
  color: var(--text-primary);
  background-color: var(--bg-primary);
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
}

.app-shell {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0 var(--safe-area);
}

.site-header {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
}

.sys-actions {
  display: flex;
  gap: 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-dot {
  width: 10px;
  height: 10px;
  background-color: var(--accent-color);
  border-radius: 50%;
}

.brand h1 {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.brand .version {
  font-weight: 300;
  color: var(--text-secondary);
  font-size: 0.8rem;
  text-transform: uppercase;
  margin-left: 4px;
}

.workspace {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 60px;
  padding: 40px 0;
  overflow: hidden;
  transition: grid-template-columns 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.workspace.sidebar-collapsed {
  grid-template-columns: 1fr 60px;
}

.stage {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.stage-inner {
  max-width: 600px;
}

.controls-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 60px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-group.row {
  flex-direction: row;
  gap: 32px;
}

.control-group label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-secondary);
  letter-spacing: 0.05em;
}

.minimal-select {
  padding: 10px 0;
  border: none;
  border-bottom: 2px solid var(--border-color);
  background: transparent;
  font-size: 1rem;
  font-weight: 500;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
}

.minimal-select:focus {
  border-color: var(--accent-color);
}

.toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.toggle .label-text {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
}

.toggle input { display: none; }

.slider {
  width: 36px;
  height: 20px;
  background-color: var(--border-color);
  border-radius: 20px;
  position: relative;
  transition: 0.3s;
}

.slider::before {
  content: "";
  position: absolute;
  width: 14px;
  height: 14px;
  left: 3px;
  top: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.3s;
}

input:checked + .slider { background-color: var(--accent-color); }
input:checked + .slider::before { transform: translateX(16px); }

.result-display {
  min-height: 200px;
  display: flex;
  align-items: center;
  margin-bottom: 60px;
}

.names-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.name-box {
  font-size: clamp(2rem, 8vw, 4rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.2;
  border-left: 4px solid var(--accent-color);
  padding-left: 12px;
}

.empty-state-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 24px;
}

.empty-hint {
  font-size: clamp(2rem, 8vw, 4rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.2;
  border-left: 4px solid var(--accent-color);
  padding-left: 12px;
  color: var(--text-primary);
}

.ghost-btn.large {
  padding: 12px 24px;
  font-size: 1rem;
}

.action-btn {
  padding: 20px 48px;
  background-color: var(--accent-color);
  color: var(--accent-contrast);
  border: none;
  border-radius: 0;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
}

.action-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.action-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.action-btn:disabled {
  background-color: var(--border-color);
  cursor: not-allowed;
}

.sidebar {
  border-left: 1px solid var(--border-color);
  padding-left: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar.is-collapsed {
  padding-left: 0;
}

.sidebar-content {
  padding-left: 40px;
  opacity: 1;
  transition: opacity 0.3s;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sidebar.is-collapsed .sidebar-content {
  opacity: 0;
  pointer-events: none;
}

.expand-toggle {
  position: absolute;
  left: -20px;
  top: 0;
  width: 40px;
  height: 40px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s;
}

.expand-toggle:hover {
  background: var(--bg-secondary);
  transform: scale(1.1);
}

.transition-icon {
  transition: transform 0.4s ease;
  transform: rotate(180deg);
}

.transition-icon.rotated {
  transform: rotate(0deg);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.sidebar-header h2 {
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.history-scroll {
  flex: 1;
  overflow-y: auto;
  padding-right: 12px;
}

.history-card {
  padding: 16px 0;
  border-bottom: 1px solid var(--bg-secondary);
}

.history-card time {
  font-size: 0.75rem;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 4px;
}

.history-names {
  font-weight: 500;
  font-size: 0.95rem;
}

.empty-history {
  color: var(--text-secondary);
  font-size: 0.875rem;
  padding-top: 20px;
}

.ghost-btn {
  background: none;
  border: 1px solid var(--border-color);
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.ghost-btn:hover, .ghost-btn.active {
  background: var(--bg-secondary);
}

.ghost-btn.active {
  border-color: var(--accent-color);
}

.text-link {
  background: none;
  border: none;
  color: var(--danger);
  font-size: 0.875rem;
  cursor: pointer;
}

.icon-sm {
  width: 16px;
  height: 16px;
}

.site-footer {
  height: 80px;
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.name-fade-enter-active {
  transition: opacity 0.3s, transform 0.3s;
}
.name-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.list-slide-enter-active, .list-slide-leave-active {
  transition: all 0.4s ease;
}
.list-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }
</style>
