<template>
  <view class="page">
    <!-- 状态栏占位 -->
    <view class="status-bar"></view>

    <!-- 内容区域 -->
    <view v-if="plan" class="content-wrapper">
      <!-- 成功标识和方案ID -->
      <view class="success-header">
        <view class="success-icon">
          <text class="check-mark">✓</text>
        </view>
        <text class="success-title">发牌成功</text>
        <view class="plan-id-container">
          <text class="plan-label">方案ID</text>
          <text class="plan-id">#{{ plan.planId }}</text>
        </view>

        <!-- 云端同步状态 -->
        <view class="cloud-status" :class="{ 'is-ready': isCloudReady }">
          <text v-if="isSyncing" class="status-text loading">☁ 云端同步中...</text>
          <text v-else-if="isCloudReady" class="status-text ready">法官不可参与领牌哦💗</text>
          <text v-else class="status-text offline">📡 本地模式 (已领牌人数无法实时同步)</text>
        </view>
      </view>

      <!-- 词语配对信息 -->
      <view class="words-info-card">
        <view class="word-info-section word-a">
          <view class="role-badge role-a">
            <text class="badge-text">平民</text>
          </view>
          <text class="word-text">{{ plan.wordPair.wordA }}</text>
          <text class="count-text">{{ plan.config.typeACount }}人</text>
        </view>

        <view class="word-divider"></view>

        <view class="word-info-section word-b">
          <view class="role-badge role-b">
            <text class="badge-text">卧底</text>
          </view>
          <text class="word-text">{{ plan.wordPair.wordB }}</text>
          <text class="count-text">{{ plan.config.typeBCount }}人</text>
        </view>

        <view v-if="plan.config.typeCCount" class="word-divider"></view>

        <view v-if="plan.config.typeCCount" class="word-info-section word-c">
          <view class="role-badge role-c">
            <text class="badge-text">白板</text>
          </view>
          <text class="word-text">无词</text>
          <text class="count-text">{{ plan.config.typeCCount }}人</text>
        </view>
      </view>

      <!-- 操作按钮 (移到列表上方提高可见性) -->
      <view class="action-buttons">
        <button class="share-btn" open-type="share">
          <text class="wechat-icon">💬</text>
          <text class="share-text">分享到微信群</text>
        </button>

        <view class="regenerate-btn" @tap="regenerate">
          <text class="regenerate-text">重新发牌</text>
        </view>
      </view>

      <!-- 玩家身份列表 -->
      <view class="players-list-card">
        <view class="card-header">
          <text class="section-label">PLAYER LIST</text>
        </view>

        <view class="players-list">
          <view v-for="assignment in plan.assignments" :key="assignment.index" class="player-item">
            <view class="player-number-badge">
              <text class="player-number">{{ assignment.index }}</text>
            </view>
            <view class="player-info">
              <view class="player-role-badge" :class="`role-${assignment.type}`">
                <text class="role-text">{{ getTypeLabel(assignment.type) }}</text>
              </view>
              <text v-if="assignment.word" class="player-word">{{ assignment.word }}</text>
              <text v-else class="player-word no-word">无词</text>
            </view>
            <view class="player-status">
              <view v-if="assignment.viewed" class="status-dot viewed"></view>
              <view v-else class="status-dot pending"></view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getPlanById, deletePlan, savePlan } from '@/utils/storage.js'
import { generatePlan } from '@/utils/algorithm.js'
import { showLoading, hideLoading, showToast, showModal } from '@/utils/ui.js'
import { TYPE_TEXT } from '@/utils/constants.js'
import { savePlanToCloud } from '@/utils/cloud.js'

export default {
  data() {
    return {
      plan: null,
      cloudId: null, // 云端ID
      isSyncing: false // 是否正在上云
    }
  },

  computed: {
    isCloudReady() {
      return !!(this.cloudId || (this.plan && this.plan.cloudId))
    }
  },

  async onLoad(options) {
    const { planId } = options
    if (planId) {
      await this.loadPlan(planId)
      // 加载完成后尝试上云
      this.uploadToCloud()
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshPlanData()
    setTimeout(() => {
      uni.stopPullDownRefresh()
    }, 1000)
  },

  // 分享配置
  onShareAppMessage() {
    if (!this.plan) return {}

    // 优先使用云端ID分享
    if (this.cloudId) {
      console.log('使用云端ID分享:', this.cloudId)
      return {
        title: `谁是卧底 # ${this.plan.planId}`,
        path: `/pages/view/view?cid=${this.cloudId}`
      }
    }

    // 降级使用 q 参数分享
    const qVal = this.getQValue()
    console.log('云端ID未就绪，使用q参数降级分享:', qVal)

    return {
      title: `谁是卧底 # ${this.plan.planId}`,
      path: `/pages/view/view?q=${encodeURIComponent(qVal)}`
    }
  },

  onShareTimeline() {
    if (!this.plan) return {}

    // 优先使用云端ID分享
    if (this.cloudId) {
      return {
        title: `谁是卧底 # ${this.plan.planId}`,
        query: `cid=${this.cloudId}`
      }
    }

    const qVal = this.getQValue()

    return {
      title: `谁是卧底 # ${this.plan.planId}`,
      query: `q=${encodeURIComponent(qVal)}`
    }
  },

  methods: {
    // 上传到云端
    async uploadToCloud() {
      if (!this.plan || this.cloudId || (this.plan && this.plan.cloudId)) {
        if (this.plan && this.plan.cloudId) this.cloudId = this.plan.cloudId
        return
      }

      console.log('开始上传方案到云端...')
      this.isSyncing = true

      try {
        const id = await savePlanToCloud(this.plan)
        if (id) {
          this.cloudId = id
          // 更新本地存储，避免重复上传
          this.plan.cloudId = id
          await savePlan(this.plan)
          console.log('云端保存成功，ID:', id)
        }
      } catch (e) {
        console.error('上传失败，将使用本地分享方案', e)
      } finally {
        this.isSyncing = false
      }
    },

    // 生成精简分享参数
    getQValue() {
      const p = this.plan
      const c = p.config
      const w = p.wordPair

      // 简单替换掉竖线，防止分隔符冲突
      const safeWa = w.wordA.replace(/\|/g, '')
      const safeWb = w.wordB.replace(/\|/g, '')

      return [
        p.planId,
        c.totalCount,
        c.typeACount,
        c.typeBCount,
        c.typeCCount || 0,
        safeWa,
        safeWb
      ].join('|')
    },

    // 复制口令（兜底方案）
    copyToken() {
      const qVal = this.getQValue()
      const token = `🔑谁是卧底口令【${qVal}】复制此段文本打开小程序即可领取身份`

      uni.setClipboardData({
        data: token,
        success: () => {
          utils_ui.showToast('口令已复制，发送给好友即可')
        }
      })
    },

    // 加载方案数据
    async loadPlan(planId) {
      this.plan = await getPlanById(planId)

      if (!this.plan) {
        showToast('方案不存在或已过期')
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      }
    },

    // 获取类型标签
    getTypeLabel(type) {
      return TYPE_TEXT[type] || '未知'
    },

    // 重新生成
    async regenerate() {
      const confirmed = await showModal({
        title: '确认重新发牌？',
        content: '重新发牌将覆盖当前方案'
      })

      if (confirmed) {
        await this.doRegenerate()
      }
    },

    async doRegenerate() {
      showLoading('生成中...')

      try {
        // 删除旧方案
        await deletePlan(this.plan.planId)

        // 生成新方案（传入creatorId）
        const newConfig = { ...this.plan.config }
        newConfig.creatorId = uni.getStorageSync('userId')
        const newPlan = generatePlan(newConfig)
        await savePlan(newPlan)

        // 重置云端状态，确保重新上传
        this.cloudId = null
        this.plan = newPlan

        // 重新上传到云端
        await this.uploadToCloud()

        showToast('重新发牌成功')
      } catch (error) {
        console.error('生成失败:', error)
        showToast('生成失败')
      } finally {
        hideLoading()
      }
    },

    // 刷新方案数据
    async refreshPlanData() {
      if (this.plan) {
        await this.loadPlan(this.plan.planId)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.page {
  min-height: 100vh;
  background: #FAFAFA;
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

.success-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
  padding: 48rpx 0;

  .success-icon {
    width: 128rpx;
    height: 128rpx;
    border-radius: 64rpx;
    background: rgba(13, 110, 110, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;

    .check-mark {
      font-size: 72rpx;
      font-weight: 300;
      color: #0D6E6E;
      line-height: 1;
    }
  }

  .success-title {
    font-family: 'Newsreader', serif;
    font-size: 48rpx;
    font-weight: 500;
    color: #1A1A1A;
  }

  .plan-id-container {
    display: flex;
    align-items: baseline;
    gap: 12rpx;

    .plan-label {
      font-size: 24rpx;
      color: #888888;
      font-weight: 500;
    }

    .plan-id {
      font-family: 'JetBrains Mono', monospace;
      font-size: 36rpx;
      font-weight: 700;
      color: #1A1A1A;
      letter-spacing: 2rpx;
    }
  }

  .cloud-status {
    margin-top: 16rpx;
    padding: 8rpx 24rpx;
    border-radius: 40rpx;
    background: #F0F0F0;

    &.is-ready {
      background: rgba(7, 193, 96, 0.1);
    }

    .status-text {
      font-size: 24rpx;
      font-weight: 500;

      &.loading {
        color: #2979FF;
      }

      &.ready {
        color: #07C160;
      }

      &.offline {
        color: #888888;
      }
    }
  }
}

.words-info-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 48rpx;
  border: 2rpx solid #E5E5E5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32rpx;

  .word-info-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16rpx;

    .role-badge {
      padding: 8rpx 16rpx;
      border-radius: 8rpx;

      &.role-a {
        background: rgba(13, 110, 110, 0.1);

        .badge-text {
          color: #0D6E6E;
        }
      }

      &.role-b {
        background: rgba(224, 123, 84, 0.1);

        .badge-text {
          color: #E07B54;
        }
      }

      &.role-c {
        background: rgba(128, 128, 128, 0.1);

        .badge-text {
          color: #808080;
        }
      }

      .badge-text {
        font-family: 'JetBrains Mono', monospace;
        font-size: 22rpx;
        font-weight: 600;
      }
    }

    .word-text {
      font-family: 'Newsreader', serif;
      font-size: 36rpx;
      font-weight: 500;
      color: #1A1A1A;
    }

    .count-text {
      font-size: 24rpx;
      color: #888888;
    }
  }

  .word-divider {
    width: 2rpx;
    height: 100rpx;
    background: #E5E5E5;
  }
}

.players-list-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 48rpx;
  border: 2rpx solid #E5E5E5;

  .card-header {
    margin-bottom: 32rpx;

    .section-label {
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: 22rpx;
      font-weight: 600;
      color: #888888;
      letter-spacing: 4rpx;
    }
  }

  .players-list {
    display: flex;
    flex-direction: column;
    gap: 24rpx;

    .player-item {
      display: flex;
      align-items: center;
      gap: 24rpx;
      padding: 24rpx;
      background: #FAFAFA;
      border-radius: 16rpx;

      .player-number-badge {
        width: 64rpx;
        height: 64rpx;
        border-radius: 32rpx;
        background: #FFFFFF;
        border: 2rpx solid #E5E5E5;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        .player-number {
          font-family: 'JetBrains Mono', monospace;
          font-size: 26rpx;
          font-weight: 600;
          color: #1A1A1A;
        }
      }

      .player-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8rpx;

        .player-role-badge {
          align-self: flex-start;
          padding: 6rpx 12rpx;
          border-radius: 6rpx;

          &.role-A {
            background: rgba(13, 110, 110, 0.1);

            .role-text {
              color: #0D6E6E;
            }
          }

          &.role-B {
            background: rgba(224, 123, 84, 0.1);

            .role-text {
              color: #E07B54;
            }
          }

          &.role-C {
            background: rgba(128, 128, 128, 0.1);

            .role-text {
              color: #808080;
            }
          }

          .role-text {
            font-family: 'JetBrains Mono', monospace;
            font-size: 20rpx;
            font-weight: 600;
          }
        }

        .player-word {
          font-size: 26rpx;
          color: #1A1A1A;
          font-weight: 500;

          &.no-word {
            color: #888888;
          }
        }
      }

      .player-status {
        flex-shrink: 0;

        .status-dot {
          width: 16rpx;
          height: 16rpx;
          border-radius: 8rpx;

          &.viewed {
            background: #0D6E6E;
          }

          &.pending {
            background: #CCCCCC;
          }
        }
      }
    }
  }
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 24rpx;

  .share-btn {
    height: 112rpx;
    background: #07C160;
    border-radius: 24rpx;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    padding: 0;
    margin: 0;

    // 清除button默认样式
    &::after {
      border: none;
    }

    .wechat-icon {
      font-size: 36rpx;
    }

    .share-text {
      font-family: 'Inter', sans-serif;
      font-size: 34rpx;
      font-weight: 600;
      color: #FFFFFF;
    }
  }

  .regenerate-btn {
    height: 112rpx;
    background: #FFFFFF;
    border: 2rpx solid #E5E5E5;
    border-radius: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    .regenerate-text {
      font-family: 'Inter', sans-serif;
      font-size: 34rpx;
      font-weight: 600;
      color: #1A1A1A;
    }
  }

  .copy-token-btn {
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;

    .token-text {
      font-size: 28rpx;
      color: #0D6E6E;
      text-decoration: underline;
    }

    .token-icon {
      font-size: 28rpx;
    }
  }
}
</style>
