<template>
  <div class="app">
    <header class="header">
      🎯 随机点名
    </header>

    <main class="main">
      <div class="control">
        <label>抽取人数：</label>
        <select v-model="pickCount">
          <option>1</option>
          <option>2</option>
          <option>3</option>
          <option>4</option>
          <option>5</option>
        </select>

        <label class="option">
          <input type="checkbox" v-model="allowRepeat" />
          允许重复抽取
        </label>

        <label class="option">
          <input type="checkbox" v-model="removeAfterPick" />
          抽中后移出名单
        </label>
      </div>

      <div class="display">
        <span v-for="(name, index) in displayNames" :key="index">
          {{ name }}
        </span>
      </div>

      <button class="start-btn" @click="startPick">
        开始抽取
      </button>
    </main>

    <footer class="footer">
      <button class="link-btn">⚙ 设置</button>
      <button class="link-btn" @click="loadNames">
        👥 名单管理
      </button>
    </footer>
  </div>

  <div class="history">
    <h3>抽取历史</h3>
    <ul>
      <li v-for="(item, i) in history" :key="i">
        {{ item.time }}：{{ item.names.join('、') }}
      </li>
    </ul>
  </div>
</template>

<script setup>

import { ref } from 'vue'
import { watch, onMounted } from 'vue'

// 是否允许重复抽取
const allowRepeat = ref(true)

// 是否移除已抽取
const removeAfterPick = ref(false)

// 抽取历史
const history = ref([])

// 模拟名单
// const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九']

const names = ref([])

// 抽取人数
const pickCount = ref(1)

// 当前显示的名字数组
const displayNames = ref(['准备开始'])

// 定时器
let timer = null

function startPick() {
  if (timer) return

  timer = setInterval(() => {
    let pool = allowRepeat.value ? names.value : [...names.value]

    displayNames.value = Array.from({ length: pickCount.value }, () => {
      if (!pool.length) return '无可抽取人员'

      const index = Math.floor(Math.random() * pool.length)
      const picked = pool[index]

      if (!allowRepeat.value) {
        pool.splice(index, 1)
      }

      return picked
    })
  }, 80)


  setTimeout(() => {
    clearInterval(timer)
    
    if (removeAfterPick.value) {
      displayNames.value.forEach(name => {
      const index = names.value.indexOf(name)
        if (index !== -1) {
          names.value.splice(index, 1)
        }
      })
    }
    history.value.unshift({
      time: new Date().toLocaleTimeString(),
      names: [...displayNames.value]
    })

    timer = null
  }, 2000)
}

async function loadNames() {
  if (!window.electronAPI) {
    alert('当前不是 Electron 环境')
    return
  }

  const result = await window.electronAPI.openTxtFile()

  if (result.length === 0) return

  names.value = result
  displayNames.value = ['名单已加载']
}

	onMounted(() => {
	const saved = localStorage.getItem('rollcall-settings')
	if (saved) {
		const s = JSON.parse(saved)
		allowRepeat.value = s.allowRepeat
		removeAfterPick.value = s.removeAfterPick
	}
	})
	
	watch([allowRepeat, removeAfterPick], () => {
	localStorage.setItem(
		'rollcall-settings',
		JSON.stringify({
		allowRepeat: allowRepeat.value,
		removeAfterPick: removeAfterPick.value
		})
	)
	})


</script>



<style>
.display {
  flex-wrap: wrap;
}

.display span {
  min-width: 80px;
  text-align: center;
}

.app {
  height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.header {
  padding: 20px;
  text-align: center;
  font-size: 28px;
  font-weight: bold;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.control {
  margin-bottom: 20px;
  font-size: 16px;
}

.control select {
  margin-left: 10px;
  padding: 6px 10px;
}

.display {
  min-width: 400px;
  min-height: 120px;
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  font-size: 24px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
}

.start-btn {
  padding: 14px 40px;
  font-size: 18px;
  border-radius: 30px;
  border: none;
  background: #409eff;
  color: white;
  cursor: pointer;
}

.start-btn:hover {
  background: #337ecc;
}

.footer {
  padding: 16px;
  display: flex;
  justify-content: space-between;
}

.link-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #409eff;
}
</style>
