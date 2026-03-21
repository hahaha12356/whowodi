<template>
  <view class="page">
    <!-- 状态栏占位 -->
    <view class="status-bar"></view>

    <!-- 内容区域 -->
    <view class="content-wrapper">
      <!-- 方案信息头部 -->
      <view v-if="plan && !showCard && !isProcessing" class="plan-header">
        <text class="page-title">身份领取</text>
        <text class="plan-id">{{ plan.planId }}</text>
      </view>

      <!-- 玩家信息 -->
      <view v-if="plan && !showCard && !isProcessing" class="player-info-card">
        <view class="info-row">
          <text class="info-label">总人数</text>
          <text class="info-value">{{ plan.config.totalCount }}人</text>
        </view>
      </view>

      <!-- 正在抽取动画 UI -->
      <view v-if="isProcessing" class="processing-container">
        <view class="radar-scan"></view>
        <text class="processing-text">正在随机分配座位...</text>
      </view>

      <!-- 查看按钮 -->
      <view v-if="!hasViewed && plan && !showCard && !isProcessing" class="view-action">
        <view class="view-btn" @tap="startAutoAssign">
          <text class="view-icon">🖐</text>
          <text class="view-text">点击抽取身份</text>
        </view>
      </view>

      <!-- 已查看状态 -->
      <view v-if="hasViewed && plan && !showCard && !isProcessing" class="viewed-action">
        <view class="viewed-btn" @tap="viewAgain">
          <text class="viewed-icon">👁</text>
          <text class="viewed-text">查看我的身份 ({{ myAssignment.index }}号)</text>
        </view>
      </view>

      <!-- 身份卡片 -->
      <view v-if="showCard && myAssignment" class="identity-card-wrapper">
        <view :class="['identity-card', `type-${myAssignment.type}`]">
          <!-- 词语显示区域 -->
          <view class="word-display-container">
            <text v-if="myAssignment.word" class="word-text">{{ myAssignment.word }}</text>
            <text v-else class="word-text no-word">无词</text>
          </view>

          <!-- 编号显示 -->
          <view class="number-badge">
            <text class="number-text">{{ myAssignment.index }}号</text>
          </view>

          <!-- 隐藏按钮 -->
          <view class="hide-btn" @tap="hideCard">
            <text class="hide-icon">🙈</text>
            <text class="hide-text">隐藏</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 倒计时遮罩 -->
    <view v-if="showCountdown" class="countdown-mask">
      <view class="countdown-content">
        <text class="countdown-number">{{ countdown }}</text>
        <text class="countdown-tip">请确保周围无人偷看</text>
      </view>
    </view>
  </view>
</template>

<script>
import { getPlanById, savePlan } from '@/utils/storage.js'
import { getUserId } from '@/utils/storage.js'
import { TYPE_TEXT, TYPE_TIPS } from '@/utils/constants.js'
import { getPlanFromCloud, getPlanByPlanId, getClaimsForPlan, tryCreateClaimAtomically } from '@/utils/cloud.js'
import { showLoading, hideLoading, showToast } from '@/utils/ui.js'

export default {
  data() {
    return {
      planId: '',
      planData: null, // 从URL解析的方案数据
      plan: null,
      myAssignment: null,
      hasViewed: false,
      showCountdown: false,
      countdown: 3,
      showCard: false,
      isProcessing: false, // 核心：标记正在分配
      userId: ''
    }
  },

  computed: {
    typeText() {
      return this.myAssignment ? TYPE_TEXT[this.myAssignment.type] || '' : ''
    },
    tipText() {
      return this.myAssignment ? TYPE_TIPS[this.myAssignment.type] || '' : ''
    }
  },

  async onLoad(options) {
    // 先获取userId
    this.userId = getUserId()

    console.log('view页面接收到的参数:', options)

    // 保存 options 供 onShow 使用 (处理热启动)
    this.lastOptions = options

    await this.handleOptions(options)
  },

  async onShow() {
    // 尝试从全局 launchOptions 获取参数 (应对热启动 + 分享卡片)
    // 注意：微信基础库 2.9.4+ 支持 wx.getEnterOptionsSync()
    let enterOptions = {}
    if (uni.getEnterOptionsSync) {
      enterOptions = uni.getEnterOptionsSync()
    } else {
      enterOptions = uni.getLaunchOptionsSync()
    }

    console.log('App onShow/Enter Options:', enterOptions)

    // 如果当前 plan 还没加载，且从外部通过 query 进来，则尝试重新加载
    if (!this.plan && enterOptions && enterOptions.query) {
      const query = enterOptions.query
      // 避免重复处理：如果 onLoad 已经处理了相同的参数，则跳过
      // 简单的去重判断
      if (JSON.stringify(query) !== JSON.stringify(this.lastOptions)) {
        console.log('检测到新的热启动参数，尝试加载:', query)
        await this.handleOptions(query)
      }
    }
  },

  onShareAppMessage() {
    return {
      title: '谁 is 卧底 - 这个房间在找你',
      path: `/pages/view/view?cid=${this.plan ? (this.plan.cloudId || '') : ''}`,
      imageUrl: '/static/images/share-cover.png'
    }
  },

  methods: {
    // 统一处理参数逻辑
    // 统一处理参数逻辑
    async handleOptions(options) {
      if (options.cid) {
        await this.loadCloudPlan(options.cid)
        return
      }

      if (options.q) {
        try {
          const rawQ = decodeURIComponent(options.q)
          const parts = rawQ.split('|')
          if (parts.length >= 7) {
            const pid = parts[0]
            showLoading('同步中...')
            const cloudPlan = await getPlanByPlanId(pid)
            hideLoading()

            if (cloudPlan) {
              this.planId = pid
              this.plan = cloudPlan
              this.plan.cloudId = cloudPlan._id
              this.checkViewStatus()
              savePlan(this.plan)
              return
            }

            this.planData = {
              pid, tc: parseInt(parts[1]), ac: parseInt(parts[2]),
              bc: parseInt(parts[3]), cc: parseInt(parts[4]),
              wa: parts[5], wb: parts[6]
            }
            this.planId = pid
            this.plan = this.createPlanFromData(this.planData)
            this.checkViewStatus()
            return
          }
        } catch (e) { console.error(e) }
      }

      if (options.pid && options.wa) {
        this.planData = {
          pid: options.pid, tc: parseInt(options.tc),
          ac: parseInt(options.ac), bc: parseInt(options.bc),
          cc: parseInt(options.cc || 0),
          wa: decodeURIComponent(options.wa), wb: decodeURIComponent(options.wb)
        }
        this.planId = options.pid
        this.plan = this.createPlanFromData(this.planData)
        this.checkViewStatus()
        return
      }

      if (options.planId) {
        this.planId = options.planId
        this.init()
      }
    },

    // 核心分配逻辑：自动、随机、使用原子性操作避免并发冲突
    async startAutoAssign() {
      if (this.hasViewed || this.isProcessing) return

      // 检查是否是主持人（发牌人）
      if (this.plan && this.plan.creatorId && this.plan.creatorId === this.userId) {
        uni.showModal({
          title: '主持人不可领牌',
          content: '您是本局游戏的主持人，不能参与领牌。请将链接分享给其他玩家。',
          showCancel: false
        })
        return
      }

      this.isProcessing = true
      // 模拟一点"搜索中"的科技感延迟
      await new Promise(r => setTimeout(r, 800))

      try {
        const assignment = await this.getRobustAssignment()
        this.isProcessing = false

        if (assignment) {
          this.selectedAssignment = assignment
          this.startView() // 进入3秒倒计时
        }
      } catch (err) {
        this.isProcessing = false
        console.error('领取失败:', err)

        // 核心：如果权限不对，给出明确指引，而不是默默降级产生重复
        let content = '网络拥堵，请稍后重试'
        if (err.message && err.message.includes('PERMISSION_DENIED')) {
          content = '数据库权限不足：非房主用户无法写入记录。请联系房主将plans集合权限设置为"所有用户可读、所有用户可写"。'
        }

        uni.showModal({
          title: '领取身份失败',
          content: content,
          showCancel: false
        })
      }
    },

    async getRobustAssignment(retry = 0) {
      const maxRetries = 15  // 增加最大重试次数

      if (retry > maxRetries) {
        console.error('超过最大重试次数:', retry)
        uni.showModal({
          title: '领取失败',
          content: '网络繁忙或所有座位已被占用，请稍后重试',
          showCancel: false
        })
        return null
      }

      const assignments = this.plan.assignments
      const myUserId = this.userId

      // 1. 检查本地缓存（我是否已经领过）
      const localData = uni.getStorageSync(`view_${this.planId}_${this.userId}`)
      if (localData && localData.assignment) {
        console.log('从本地缓存恢复身份:', localData.assignment.index)
        return localData.assignment
      }

      // 2. 获取云端所有领取记录（最新状态）
      const claims = await getClaimsForPlan(this.planId)
      console.log(`第${retry + 1}次尝试 - 当前已领取记录数:`, claims.length)

      // 3. 检查我是否已经在云端领过
      const myClaim = claims.find(c => c.oddrtyId === myUserId)
      if (myClaim) {
        // 我已经领过了，返回对应的assignment
        const myAssign = assignments.find(a => a.index === myClaim.seatIndex)
        if (myAssign) {
          console.log('从云端恢复身份:', myAssign.index)
          return myAssign
        }
      }

      // 4. 筛选出已被占用的座位号
      const claimedSeats = new Set(claims.map(c => c.seatIndex))

      // 5. 筛选出真正的空位
      const emptySeats = assignments.filter(a => !claimedSeats.has(a.index))

      console.log('剩余空位数:', emptySeats.length, '已占用:', claimedSeats.size)

      if (emptySeats.length === 0) {
        console.warn('所有座位已被占用')
        uni.showToast({ title: '所有座位已被占用', icon: 'none', duration: 2000 })
        return null
      }

      // 6. 随机选一个座位（每次都重新选，增加随机性）
      // 使用更好的随机算法，避免总是选择同一个座位
      const randomIndex = Math.floor(Math.random() * emptySeats.length)
      const target = emptySeats[randomIndex]
      console.log(`第${retry + 1}次尝试 - 随机选中座位:`, target.index, '(从', emptySeats.length, '个空位中选择)')

      // 7. 使用原子性操作尝试创建领取记录
      // 这个函数会先检查座位是否被占用，如果被占用会立即返回 conflict: true
      // 避免了两个用户同时写入同一个座位的问题
      const result = await tryCreateClaimAtomically(this.planId, target.index, myUserId)

      if (!result.success) {
        if (result.conflict) {
          // 座位被占用了（可能是被别人抢了），重新尝试
          console.warn(`第${retry + 1}次尝试 - 座位${target.index}冲突，重新选择...`)

          // 根据重试次数调整延迟时间（指数退避）
          const delay = Math.min(100 + retry * 50, 500)
          await new Promise(r => setTimeout(r, delay))

          return this.getRobustAssignment(retry + 1)
        } else {
          // 网络错误或其他问题，重试
          console.error(`第${retry + 1}次尝试 - 网络错误，重试...`)

          const delay = Math.min(300 + retry * 100, 1000)
          await new Promise(r => setTimeout(r, delay))

          return this.getRobustAssignment(retry + 1)
        }
      }

      // 8. 领取成功！
      console.log(`✅ 第${retry + 1}次尝试 - 领取成功! 座位:`, target.index)
      return target
    },

    // 严谨倒计时
    startView() {
      this.countdown = 3
      this.showCountdown = true
      this.startTimer()
    },

    startTimer() {
      if (this.timer) clearInterval(this.timer)
      this.timer = setInterval(() => {
        this.countdown--
        if (this.countdown <= 0) {
          clearInterval(this.timer)
          this.timer = null
          this.showCountdown = false
          this.assignAndShow()
        }
      }, 500)
    },

    async assignAndShow() {
      const a = this.selectedAssignment || this.myAssignment
      if (!a) return

      this.myAssignment = a
      this.showCard = true

      // 记录本地缓存，确保再次点击不用重新分配
      const key = `view_${this.planId}_${this.userId}`
      uni.setStorageSync(key, { assignment: a, time: Date.now() })
      this.hasViewed = true
    },

    async loadCloudPlan(cloudId) {
      try {
        const p = await getPlanFromCloud(cloudId)
        if (p) {
          this.plan = p
          this.plan.cloudId = cloudId
          this.planId = p.planId

          // 顺便校对本地查看状态
          this.checkViewStatus()
          savePlan(this.plan)
        }
      } catch (e) { console.error('拉取云端方案失败', e) }
    },

    createPlanFromData(data) {
      return {
        planId: data.pid,
        config: { totalCount: data.tc, typeACount: data.ac, typeBCount: data.bc, typeCCount: data.cc },
        wordPair: { wordA: data.wa, wordB: data.wb },
        assignments: this.generateAssignments(data),
        createTime: Date.now()
      }
    },

    generateAssignments(data) {
      const arr = []
      for (let i = 0; i < data.ac; i++) arr.push({ type: 'A', word: data.wa })
      for (let i = 0; i < data.bc; i++) arr.push({ type: 'B', word: data.wb })
      for (let i = 0; i < (data.cc || 0); i++) arr.push({ type: 'C', word: null })
      return arr.map((it, i) => ({ ...it, index: i + 1, viewed: false, userId: null }))
    },

    checkViewStatus() {
      const data = uni.getStorageSync(`view_${this.planId}_${this.userId}`)
      if (data) {
        this.hasViewed = true
        this.myAssignment = data.assignment
      }
    },

    viewAgain() { if (this.myAssignment) this.showCard = true },
    hideCard() { this.showCard = false },
    showErrorAndBack() { uni.reLaunch({ url: '/pages/index/index' }) },
    init() { this.loadPlan() },
    async loadPlan() { this.plan = await getPlanById(this.planId) }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.page {
  min-height: 100vh;
  background: #FAFAFA;
  position: relative;
}

.status-bar {
  height: 62px;
}

.content-wrapper {
  padding: 0 48rpx 48rpx;
  display: flex;
  flex-direction: column;
  gap: 48rpx;
  min-height: calc(100vh - 62px);
}

.plan-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
  padding: 48rpx 0 24rpx;

  .page-title {
    font-family: 'Newsreader', serif;
    font-size: 56rpx;
    font-weight: 500;
    color: #1A1A1A;
  }

  .plan-id {
    font-family: 'JetBrains Mono', monospace;
    font-size: 28rpx;
    font-weight: 600;
    color: #888888;
    letter-spacing: 2rpx;
  }
}

.player-info-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 48rpx;
  border: 2rpx solid #E5E5E5;
  display: flex;
  flex-direction: column;
  gap: 32rpx;

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .info-label {
      font-size: 32rpx;
      color: #666666;
      font-weight: 500;
    }

    .info-value-container {
      display: flex;
      align-items: center;
      gap: 16rpx;
    }

    .refresh-indicator {
      width: 48rpx;
      height: 48rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #F0F0F0;
      border-radius: 24rpx;

      &:active {
        background: #E0E0E0;
        transform: scale(0.9);
      }

      .refresh-icon {
        font-size: 24rpx;
      }
    }

    .info-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 32rpx;
      font-weight: 600;
      color: #1A1A1A;
    }
  }
}

.view-action,
.viewed-action {
  display: flex;
  justify-content: center;
}

.view-btn,
.viewed-btn {
  width: 100%;
  max-width: 560rpx;
  height: 112rpx;
  background: #0D6E6E;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;

  .view-icon,
  .viewed-icon {
    font-size: 36rpx;
  }

  .view-text,
  .viewed-text {
    font-family: 'Inter', sans-serif;
    font-size: 34rpx;
    font-weight: 600;
    color: #FFFFFF;
  }
}

.identity-card-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 0;
}

.identity-card {
  width: 100%;
  max-width: 560rpx;
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 64rpx 48rpx;
  border: 2rpx solid #E5E5E5;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 48rpx;

  &.type-A {
    border: 4rpx solid rgba(13, 110, 110, 0.2);

    .role-badge.role-A {
      background: rgba(13, 110, 110, 0.1);

      .role-badge-text {
        color: #0D6E6E;
      }
    }
  }

  &.type-B {
    border: 4rpx solid rgba(224, 123, 84, 0.2);

    .role-badge.role-B {
      background: rgba(224, 123, 84, 0.1);

      .role-badge-text {
        color: #E07B54;
      }
    }
  }

  &.type-C {
    border: 4rpx solid rgba(128, 128, 128, 0.2);

    .role-badge.role-C {
      background: rgba(128, 128, 128, 0.1);

      .role-badge-text {
        color: #808080;
      }
    }
  }

  .role-badge-container {
    display: flex;
    justify-content: center;
    width: 100%;

    .role-badge {
      padding: 12rpx 24rpx;
      border-radius: 12rpx;

      .role-badge-text {
        font-family: 'JetBrains Mono', monospace;
        font-size: 24rpx;
        font-weight: 600;
      }
    }
  }

  .word-display-container {
    width: 100%;
    min-height: 200rpx;
    background: #FAFAFA;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48rpx;

    .word-text {
      font-family: 'Newsreader', serif;
      font-size: 64rpx;
      font-weight: 500;
      color: #1A1A1A;
      text-align: center;
      line-height: 1.2;

      &.no-word {
        color: #888888;
      }
    }
  }

  .number-badge {
    padding: 16rpx 32rpx;
    background: #F0F0F0;
    border-radius: 12rpx;

    .number-text {
      font-family: 'JetBrains Mono', monospace;
      font-size: 28rpx;
      font-weight: 600;
      color: #1A1A1A;
    }
  }

  .hide-btn {
    height: 88rpx;
    background: #FFFFFF;
    border: 2rpx solid #E5E5E5;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    width: 100%;

    .hide-icon {
      font-size: 32rpx;
    }

    .hide-text {
      font-family: 'Inter', sans-serif;
      font-size: 28rpx;
      font-weight: 600;
      color: #1A1A1A;
    }
  }
}

// 正在处理状态
.processing-container {
  padding: 80rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40rpx;

  .radar-scan {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    background: rgba(13, 110, 110, 0.1);
    position: relative;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: 4rpx solid #0D6E6E;
      border-radius: 50%;
      animation: radar-pulse 1.5s infinite ease-out;
    }
  }

  .processing-text {
    font-size: 28rpx;
    color: #888888;
    font-weight: 500;
  }
}

@keyframes radar-pulse {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }

  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.countdown-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;

  .countdown-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 32rpx;

    .countdown-number {
      font-family: 'Inter', sans-serif;
      font-size: 180rpx;
      font-weight: 300;
      color: #FFFFFF;
      line-height: 1;
    }

    .countdown-tip {
      font-size: 28rpx;
      color: #FFFFFF;
      opacity: 0.8;
      text-align: center;
    }
  }
}
</style>
