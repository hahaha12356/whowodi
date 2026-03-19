<template>
  <view class="page">
    <!-- 状态栏占位 -->
    <view class="status-bar"></view>

    <!-- 内容区域 -->
    <view class="content-wrapper">
      <!-- Header -->
      <view class="header">
        <view class="title-container">
          <text class="app-title">who是卧底分词小工具</text>
          <view class="help-icon" @tap="showRulesModal = true">
            <text class="help-text">?</text>
          </view>
        </view>
      </view>

      <!-- 游戏规则弹窗 -->
      <view v-if="showRulesModal" class="rules-modal-mask" @tap="showRulesModal = false">
        <view class="rules-modal" @tap.stop>
          <view class="rules-header">
            <text class="rules-title">游戏规则</text>
            <view class="rules-close" @tap="showRulesModal = false">
              <text>✕</text>
            </view>
          </view>
          <scroll-view scroll-y class="rules-content">
            <text class="rules-text">1、在场所有人中只有少数几人拿到与其它人手中的词语不同的词语，{若可能有人拿到白板}除此人以外，其他人则持有相同词语;同时拿到词语后不能说出来。

              2、每人每轮用一句话描述自己拿到的词语，词语禁止重复，话中不能出现所持词语，不能让卧底察觉，也可以给同伴以暗示。

              3、每轮描述完毕，所有在场的人投票选出怀疑谁是卧底，得票最多的人出局。若没有人的得票超过半数（50%），则没有人出局。若卧底都出局，则游戏结束。若卧底未出局，游戏继续。

              4、反复流程。若卧底撑到最后一轮（场上剩3人时），则卧底获胜，反之，则大部队胜利。</text>
            <view class="rules-divider"></view>
            <text class="rules-subtitle">游戏准备</text>
            <text class="rules-text">1、根据参加游戏的人数：确定需要几个平民，几个卧底，是否需要加入白板。

              2、法官可以根据号位，依序安排现场人员，方便通过记词列表判断每个人的身份</text>
          </scroll-view>
        </view>
      </view>

      <!-- 游戏设置卡片 -->
      <view class="settings-card">
        <text class="section-label">DEALING SETTINGS</text>

        <!-- 总人数 -->
        <view class="setting-section">
          <text class="setting-label">总人数</text>
          <view class="counter-control">
            <view class="counter-btn" @tap="adjustPlayerCount(-1)">
              <text class="counter-icon">−</text>
            </view>
            <view class="counter-value">
              <text class="counter-text">{{ playerCount }}</text>
            </view>
            <view class="counter-btn" @tap="adjustPlayerCount(1)">
              <text class="counter-icon">+</text>
            </view>
          </view>
        </view>

        <!-- 卧底人数 -->
        <view class="setting-section">
          <text class="setting-label">卧底人数</text>
          <view class="counter-control">
            <view class="counter-btn" @tap="adjustImpostorCount(-1)">
              <text class="counter-icon">−</text>
            </view>
            <view class="counter-value">
              <text class="counter-text">{{ impostorCount }}</text>
            </view>
            <view class="counter-btn" @tap="adjustImpostorCount(1)">
              <text class="counter-icon">+</text>
            </view>
          </view>
        </view>

        <!-- 白板人数 -->
        <view class="setting-section">
          <text class="setting-label">白板人数</text>
          <view class="counter-control">
            <view class="counter-btn" @tap="adjustBlankCount(-1)">
              <text class="counter-icon">−</text>
            </view>
            <view class="counter-value">
              <text class="counter-text">{{ blankCount }}</text>
            </view>
            <view class="counter-btn" @tap="adjustBlankCount(1)">
              <text class="counter-icon">+</text>
            </view>
          </view>
        </view>

        <!-- 词库分类 -->
        <view class="setting-section">
          <text class="setting-label">词库分类</text>
          <view class="category-tags">
            <view v-for="cat in categories" :key="cat.id"
              :class="['category-tag', { active: selectedCategoryId === cat.id }]" @tap="selectCategory(cat.id)">
              <text class="tag-text">{{ cat.name }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 当前词语卡片 -->
      <view class="word-card">
        <view class="word-header">
          <text class="word-label">当前词语</text>
          <view class="refresh-btn" @tap="shuffleWordPair">
            <text class="refresh-icon">↻</text>
            <text class="refresh-text">切换</text>
          </view>
        </view>

        <view class="word-display">
          <view class="word-side">
            <view class="word-badge word-a">
              <text class="badge-text">平民</text>
            </view>
            <text class="word-value word-a">{{ currentWordPair.wordA }}</text>
          </view>

          <text class="vs-divider">VS</text>

          <view class="word-side">
            <view class="word-badge word-b">
              <text class="badge-text">卧底</text>
            </view>
            <text class="word-value word-b">{{ currentWordPair.wordB }}</text>
          </view>
        </view>
      </view>

      <!-- 开始发牌按钮 -->
      <view class="start-btn" @tap="startDealing">
        <text class="start-btn-text">开始发牌</text>
      </view>

      <!-- 无法官模式入口 -->
      <view class="no-judge-btn" @tap="goToNoJudgeMode">
        <text class="no-judge-btn-text">🤖 进入无法官模式（系统发牌）</text>
      </view>
      
      <!-- 意见箱入口 -->
      <view class="suggest-btn" @tap="goToSuggest">
        <text class="suggest-btn-text">💡 意见留言箱</text>
      </view>

      <!-- 使用提示 -->
      <view class="tips-card">
        <view class="tips-header">
          <text class="tips-icon">💡</text>
          <text class="tips-title">使用提示</text>
        </view>
        <text class="tips-content">1. 设置人数和卧底数量
          2. 点击「开始发牌」生成方案
          3. 分享到微信群，玩家点击领取身份</text>
      </view>
    </view>
  </view>
</template>

<script>
import { generatePlan, getRecommendConfig } from '@/utils/algorithm.js'
import { savePlan } from '@/utils/storage.js'
import { showLoading, hideLoading, showToast } from '@/utils/ui.js'
import { wordLibrary } from '@/static/data/wordLibrary.js'

export default {
  data() {
    return {
      playerCount: 4,
      impostorCount: 1,
      blankCount: 0,
      showRulesModal: false,
      selectedCategoryId: 'classic',
      categories: [],
      currentWordPair: {
        wordA: '桃子',
        wordB: '李子'
      }
    }
  },

  onLoad() {
    this.loadCategories()
    this.loadRandomWordPair()
  },

  onShow() {
    this.checkClipboard()
  },

  methods: {
    // 检查剪贴板口令
    checkClipboard() {
      uni.getClipboardData({
        success: (res) => {
          const content = res.data || ''
          // 匹配口令格式: 🔑谁是卧底口令【...】
          const match = content.match(/🔑谁是卧底口令【(.*?)】/)
          if (match && match[1]) {
            const qVal = match[1]
            console.log('检测到口令:', qVal)

            // 避免重复检测（比如在这个页面反复切换）
            const lastToken = uni.getStorageSync('last_token')
            if (lastToken === qVal) return

            uni.showModal({
              title: '发现口令',
              content: '检测到谁是卧底游戏口令，是否立即领取身份？',
              confirmText: '去领取',
              success: (res) => {
                if (res.confirm) {
                  // 记录本次处理过的token，避免重复弹窗
                  uni.setStorageSync('last_token', qVal)
                  // 清空剪贴板，避免干扰
                  uni.setClipboardData({ data: ' ' })

                  uni.navigateTo({
                    url: `/pages/view/view?q=${encodeURIComponent(qVal)}`
                  })
                }
              }
            })
          }
        },
        fail: () => {
          // 获取剪贴板失败，忽略
        }
      })
    },

    // 加载词库分类
    loadCategories() {
      this.categories = wordLibrary.categories.filter(c => c.enabled)
      if (this.categories.length > 0) {
        this.selectedCategoryId = this.categories[0].id
      }
    },

    // 调整人数
    adjustPlayerCount(delta) {
      const newValue = this.playerCount + delta
      if (newValue >= 3 && newValue <= 20) {
        this.playerCount = newValue
        // 自动调整卧底数量
        const maxImpostor = Math.floor(this.playerCount / 3)
        if (this.impostorCount > maxImpostor) {
          this.impostorCount = maxImpostor
        }
        // 自动调整白板数量
        const maxBlank = 2
        const remainingSlots = this.playerCount - this.impostorCount - 1
        if (this.blankCount > Math.min(maxBlank, remainingSlots)) {
          this.blankCount = Math.max(0, Math.min(maxBlank, remainingSlots))
        }
      }
    },

    // 调整卧底人数
    adjustImpostorCount(delta) {
      const newValue = this.impostorCount + delta
      const maxImpostor = Math.floor(this.playerCount / 3)
      if (newValue >= 1 && newValue <= maxImpostor) {
        this.impostorCount = newValue
        // 检查白板是否超限
        const remainingSlots = this.playerCount - this.impostorCount - 1
        if (this.blankCount > remainingSlots) {
          this.blankCount = Math.max(0, remainingSlots)
        }
      }
    },

    // 调整白板人数
    adjustBlankCount(delta) {
      const newValue = this.blankCount + delta
      const maxBlank = 2
      const remainingSlots = this.playerCount - this.impostorCount - 1
      if (newValue >= 0 && newValue <= Math.min(maxBlank, remainingSlots)) {
        this.blankCount = newValue
      }
    },

    // 选择分类
    selectCategory(categoryId) {
      this.selectedCategoryId = categoryId
      this.loadRandomWordPair()
    },

    // 加载随机词语对
    loadRandomWordPair() {
      const category = wordLibrary.categories.find(c => c.id === this.selectedCategoryId)
      if (category && category.words && category.words.length > 0) {
        const randomIndex = Math.floor(Math.random() * category.words.length)
        this.currentWordPair = category.words[randomIndex]
      } else {
        // 随机词库
        const allCategories = wordLibrary.categories.filter(c => c.enabled)
        const randomCat = allCategories[Math.floor(Math.random() * allCategories.length)]
        if (randomCat && randomCat.words && randomCat.words.length > 0) {
          const randomIndex = Math.floor(Math.random() * randomCat.words.length)
          this.currentWordPair = randomCat.words[randomIndex]
        }
      }
    },

    // 切换词语
    shuffleWordPair() {
      this.loadRandomWordPair()
    },

    // 开始发牌
    async startDealing() {
      showLoading('生成中...')

      try {
        // 构建配置
        const config = {
          totalCount: this.playerCount,
          typeACount: this.playerCount - this.impostorCount - this.blankCount,
          typeBCount: this.impostorCount,
          typeCCount: this.blankCount,
          categoryId: this.selectedCategoryId
        }

        // 固定当前词语对（不使用随机）
        config.fixedWordPair = this.currentWordPair

        // 记录创建者ID
        config.creatorId = uni.getStorageSync('userId')

        // 生成方案
        const plan = generatePlan(config)

        // 保存到本地
        await savePlan(plan)

        // 跳转到结果页
        uni.navigateTo({
          url: `/pages/result/result?planId=${plan.planId}`
        })
      } catch (error) {
        console.error('生成方案失败:', error)
        showToast('生成失败，请重试')
      } finally {
        hideLoading()
      }
    },

    // 跳转到无法官模式设置页
    goToNoJudgeMode() {
      uni.navigateTo({
        url: '/pages/no_judge/setup/setup'
      })
    },
    // 跳转到意见留言箱
    goToSuggest() {
      uni.navigateTo({
        url: '/pages/suggest/suggest'
      })
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

.header {
  display: flex;
  justify-content: center;

  .title-container {
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  .app-title {
    font-family: 'Newsreader', 'Times New Roman', serif;
    font-size: 44rpx;
    font-weight: 500;
    color: #1A1A1A;
    line-height: 1.2;
    text-align: center;
    white-space: nowrap;
  }

  .help-icon {
    position: absolute;
    top: -8rpx;
    right: -40rpx;
    width: 36rpx;
    height: 36rpx;
    background: #0D6E6E;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    .help-text {
      font-size: 22rpx;
      color: #FFFFFF;
      font-weight: 600;
    }
  }
}

// 游戏规则弹窗
.rules-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48rpx;
}

.rules-modal {
  width: 100%;
  max-height: 80vh;
  background: #FFFFFF;
  border-radius: 24rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .rules-header {
    padding: 32rpx 40rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2rpx solid #F0F0F0;

    .rules-title {
      font-size: 36rpx;
      font-weight: 600;
      color: #1A1A1A;
    }

    .rules-close {
      width: 48rpx;
      height: 48rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #888888;
      font-size: 32rpx;
    }
  }

  .rules-content {
    padding: 32rpx 40rpx;
    flex: 1;
    max-height: 60vh;
    box-sizing: border-box;

    .rules-subtitle {
      display: block;
      font-size: 32rpx;
      font-weight: 600;
      color: #1A1A1A;
      margin-bottom: 24rpx;
    }

    .rules-text {
      font-size: 28rpx;
      color: #333333;
      line-height: 1.8;
      display: block;
      margin-bottom: 24rpx;
      word-wrap: break-word;
      word-break: break-all;
      white-space: pre-wrap;
    }

    .rules-divider {
      height: 2rpx;
      background: #F0F0F0;
      margin: 32rpx 0;
    }
  }
}

.settings-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 48rpx;
  border: 2rpx solid #E5E5E5;

  .section-label {
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 22rpx;
    font-weight: 600;
    color: #888888;
    letter-spacing: 4rpx;
    margin-bottom: 32rpx;
  }

  .setting-section {
    margin-bottom: 32rpx;

    &:last-child {
      margin-bottom: 0;
    }

    .setting-label {
      display: block;
      font-family: 'Newsreader', serif;
      font-size: 32rpx;
      font-weight: 500;
      color: #1A1A1A;
      margin-bottom: 24rpx;
    }

    .counter-control {
      display: flex;
      align-items: center;
      height: 88rpx;
      background: #F0F0F0;
      border-radius: 16rpx;
      padding: 8rpx;
      gap: 8rpx;

      .counter-btn {
        width: 80rpx;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12rpx;
        transition: background 0.2s;

        &:active {
          background: rgba(0, 0, 0, 0.05);
        }

        .counter-icon {
          font-size: 36rpx;
          color: #1A1A1A;
          font-weight: 300;
        }
      }

      .counter-value {
        flex: 1;
        height: 100%;
        background: #FFFFFF;
        border-radius: 12rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);

        .counter-text {
          font-family: 'Inter', sans-serif;
          font-size: 30rpx;
          font-weight: 600;
          color: #1A1A1A;
        }
      }
    }
  }

  .category-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;

    .category-tag {
      padding: 16rpx 24rpx;
      border-radius: 12rpx;
      border: 2rpx solid #E5E5E5;
      background: transparent;
      transition: all 0.3s;

      &.active {
        background: #0D6E6E;
        border-color: #0D6E6E;

        .tag-text {
          color: #FFFFFF;
        }
      }

      .tag-text {
        font-size: 28rpx;
        font-weight: 500;
        color: #666666;
      }
    }
  }
}

.word-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 40rpx;
  border: 2rpx solid #E5E5E5;

  .word-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32rpx;

    .word-label {
      font-size: 28rpx;
      color: #666666;
    }

    .refresh-btn {
      display: flex;
      align-items: center;
      gap: 12rpx;
      padding: 12rpx 24rpx;
      background: #F0F0F0;
      border-radius: 12rpx;

      .refresh-icon {
        font-size: 28rpx;
        color: #0D6E6E;
      }

      .refresh-text {
        font-size: 24rpx;
        font-weight: 600;
        color: #0D6E6E;
      }
    }
  }

  .word-display {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24rpx;

    .word-side {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16rpx;

      .word-badge {
        padding: 8rpx 16rpx;
        border-radius: 8rpx;

        &.word-a {
          background: rgba(13, 110, 110, 0.1);

          .badge-text {
            color: #0D6E6E;
          }
        }

        &.word-b {
          background: rgba(224, 123, 84, 0.1);

          .badge-text {
            color: #E07B54;
          }
        }

        .badge-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 22rpx;
          font-weight: 600;
        }
      }

      .word-value {
        font-family: 'Newsreader', serif;
        font-size: 40rpx;
        font-weight: 500;
        text-align: center;

        &.word-a {
          color: #1A1A1A;
        }

        &.word-b {
          color: #E07B54;
        }
      }
    }

    .vs-divider {
      font-family: 'JetBrains Mono', monospace;
      font-size: 28rpx;
      font-weight: 700;
      color: #CCCCCC;
    }
  }
}

.start-btn {
  height: 112rpx;
  background: #0D6E6E;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 24rpx rgba(13, 110, 110, 0.08);

  .start-btn-text {
    font-family: 'Inter', sans-serif;
    font-size: 34rpx;
    font-weight: 600;
    color: #FFFFFF;
  }
}

.no-judge-btn {
  height: 96rpx;
  background: #E8F4F4;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #0D6E6E;
  margin-top: -16rpx;

  .no-judge-btn-text {
    font-family: 'Inter', sans-serif;
    font-size: 32rpx;
    font-weight: 600;
    color: #0D6E6E;
  }
}

.no-judge-btn {
  height: 96rpx;
  background: #E8F4F4;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #0D6E6E;
  margin-top: 16rpx;
  margin-bottom: 24rpx;

  .no-judge-btn-text {
    font-family: 'Inter', sans-serif;
    font-size: 32rpx;
    font-weight: 600;
    color: #0D6E6E;
  }
}

.suggest-btn {
  height: 96rpx;
  background: #FFFFFF;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #2979FF;
  margin-bottom: 40rpx;
  box-shadow: 0 4rpx 12rpx rgba(41, 121, 255, 0.1);

  .suggest-btn-text {
    font-family: 'Inter', sans-serif;
    font-size: 30rpx;
    font-weight: 600;
    color: #2979FF;
  }
}

.tips-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 40rpx;
  border: 2rpx solid #E5E5E5;

  .tips-header {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 24rpx;

    .tips-icon {
      font-size: 36rpx;
    }

    .tips-title {
      font-size: 30rpx;
      font-weight: 500;
      color: #1A1A1A;
    }
  }

  .tips-content {
    font-size: 26rpx;
    color: #666666;
    line-height: 1.8;
    white-space: pre-line;
  }
}
</style>
