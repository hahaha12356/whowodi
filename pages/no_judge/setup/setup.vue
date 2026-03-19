<template>
  <view class="page">
    <view class="status-bar"></view>

    <view class="content-wrapper">
      <view class="header">
        <view class="title-container">
          <text class="app-title">无法官模式</text>
        </view>
        <view class="subtitle">
          <text class="app-subtitle">系统自动调度，让所有人都可以参与游戏 🤖</text>
        </view>
      </view>

      <view class="settings-card">
        <text class="section-label">ROOM SETTINGS</text>

        <!-- 总人数 -->
        <view class="setting-section">
          <text class="setting-label">总人数 (至少3人)</text>
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
        <view class="setting-section" v-if="playerCount > 3">
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
        <view class="setting-section" v-else>
          <text class="setting-label disable-label">白板人数 (3人局不支持白板)</text>
        </view>

        <!-- 词库分类 -->
        <view class="setting-section">
          <text class="setting-label">选择词库</text>
          <view class="category-tags">
            <view v-for="cat in categories" :key="cat.id"
              :class="['category-tag', { active: selectedCategoryId === cat.id }]" @tap="selectedCategoryId = cat.id">
              <text class="tag-text">{{ cat.name }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 创建房间按钮 -->
      <view class="start-btn" @tap="createRoom">
        <text class="start-btn-text">创建房间</text>
      </view>
    </view>
  </view>
</template>

<script>
import { wordLibrary } from '@/static/data/wordLibrary.js'
import { generatePlanId } from '@/utils/algorithm.js'
import { showLoading, hideLoading, showToast } from '@/utils/ui.js'

export default {
  data() {
    return {
      playerCount: 4,
      impostorCount: 1,
      blankCount: 0,
      selectedCategoryId: 'classic',
      categories: []
    }
  },

  onLoad() {
    this.categories = wordLibrary.categories.filter(c => c.enabled)
    if (this.categories.length > 0) {
      this.selectedCategoryId = this.categories[0].id
    }
  },

  methods: {
    adjustPlayerCount(delta) {
      const newValue = this.playerCount + delta
      if (newValue >= 3 && newValue <= 20) {
        this.playerCount = newValue
        const maxImpostor = Math.floor(this.playerCount / 3) || 1
        if (this.impostorCount > maxImpostor) {
          this.impostorCount = maxImpostor
        }
        
        if (this.playerCount <= 3) {
          this.blankCount = 0
        } else {
          const maxBlank = 2
          const remainingSlots = this.playerCount - this.impostorCount - 1
          if (this.blankCount > Math.min(maxBlank, remainingSlots)) {
            this.blankCount = Math.max(0, Math.min(maxBlank, remainingSlots))
          }
        }
      }
    },

    adjustImpostorCount(delta) {
      const newValue = this.impostorCount + delta
      const maxImpostor = Math.floor(this.playerCount / 3) || 1
      if (newValue >= 1 && newValue <= maxImpostor) {
        this.impostorCount = newValue
        const remainingSlots = this.playerCount - this.impostorCount - 1
        if (this.blankCount > remainingSlots) {
          this.blankCount = Math.max(0, remainingSlots)
        }
      }
    },

    adjustBlankCount(delta) {
      if (this.playerCount <= 3) return
      const newValue = this.blankCount + delta
      const maxBlank = 2
      const remainingSlots = this.playerCount - this.impostorCount - 1
      if (newValue >= 0 && newValue <= Math.min(maxBlank, remainingSlots)) {
        this.blankCount = newValue
      }
    },

    async createRoom() {
      showLoading('创建房间中...')
      
      try {
        const db = wx.cloud.database()
        
        // 随机获取一个词语作为本场词语
        let category = wordLibrary.categories.find(c => c.id === this.selectedCategoryId)
        if (!category && this.categories.length > 0) {
          category = this.categories[0]
        }
        if (this.selectedCategoryId === 'random') {
           category = this.categories[Math.floor(Math.random() * this.categories.length)]
        }
        const wordPair = category.words[Math.floor(Math.random() * category.words.length)]
        
        // 生成房间号(6位随机字符，避免和4位planId冲突)
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        let roomId = ''
        for (let i = 0; i < 6; i++) {
          roomId += chars.charAt(Math.floor(Math.random() * chars.length))
        }

        // 构造角色列表
        let roles = []
        for(let i=0; i<this.playerCount - this.impostorCount - this.blankCount; i++) roles.push({type: 'civilian', word: wordPair.wordA})
        for(let i=0; i<this.impostorCount; i++) roles.push({type: 'impostor', word: wordPair.wordB})
        for(let i=0; i<this.blankCount; i++) roles.push({type: 'blank', word: '白板'})
        
        // 洗牌 roles
        roles.sort(() => Math.random() - 0.5)

        const roomData = {
          roomId,
          creatorId: uni.getStorageSync('userId') || '',
          config: {
            playerCount: this.playerCount,
            impostorCount: this.impostorCount,
            blankCount: this.blankCount,
            categoryId: this.selectedCategoryId
          },
          wordPair: {
            wordA: wordPair.wordA,
            wordB: wordPair.wordB
          },
          roles: roles,
          players: [], // 加入的玩家 [{ userId, seatIndex, role, word, isOut }]
          status: 'waiting', // waiting, speaking, voting, game_over
          currentRound: 1,
          speakingFinishedList: [], // 当前回合已发言完毕的玩家席位号列表
          votes: {}, // 投票记录 { voterSeat: votedSeat }
          tiedPlayers: [], // 平票玩家席位列表，如果有则说明处于惩罚/再次投票阶段
          voteType: 'normal', // normal 或 tiebreaker
          winner: null,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }

        const res = await db.collection('no_judge_rooms').add({ data: roomData })
        
        hideLoading()
        
        uni.navigateTo({
          url: `/pages/no_judge/room/room?roomId=${roomId}&_id=${res._id}`
        })
      } catch (err) {
        console.error('创建房间失败', err)
        hideLoading()
        showToast('创建房间失败，请重试')
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
  height: 62px; // 简单做个状态栏占位
}

.content-wrapper {
  padding: 0 48rpx 48rpx;
  display: flex;
  flex-direction: column;
  gap: 48rpx;
}

.header {
  display: flex;
  flex-direction: column;
  align-items: center;

  .title-container {
    margin-bottom: 12rpx;
  }

  .app-title {
    font-size: 44rpx;
    font-weight: 600;
    color: #1A1A1A;
  }
  
  .subtitle {
    .app-subtitle {
      font-size: 26rpx;
      color: #666666;
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
    &:last-child { margin-bottom: 0; }

    .setting-label {
      display: block;
      font-size: 30rpx;
      font-weight: 500;
      color: #1A1A1A;
      margin-bottom: 24rpx;
    }
    .disable-label {
      color: #999999;
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
        
        .counter-icon {
          font-size: 36rpx;
          color: #1A1A1A;
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
          font-size: 30rpx;
          font-weight: 600;
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
        .tag-text { color: #FFFFFF; }
      }

      .tag-text {
        font-size: 28rpx;
        color: #666666;
      }
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
    font-size: 34rpx;
    font-weight: 600;
    color: #FFFFFF;
  }
}
</style>
