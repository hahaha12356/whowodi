<template>
  <view class="page">
    <view class="header">
      <text class="title">意见留言箱</text>
      <text class="subtitle">您的每一条建议都是我们前进的动力</text>
    </view>

    <!-- 留言列表 -->
    <scroll-view scroll-y class="list-container" @scrolltolower="onReachBottom">
      <view v-if="loading && suggestions.length === 0" class="empty-state">
        <text>加载中...</text>
      </view>
      <view v-else-if="suggestions.length === 0" class="empty-state">
        <text>还没有留言，快来当第一个吧！</text>
      </view>
      
      <view v-else class="suggest-list">
        <view v-for="(item, index) in suggestions" :key="item._id" class="suggest-card">
          <view class="card-body">
            <text class="content">{{ item.content }}</text>
            <view class="footer">
              <text class="time">{{ formatDate(item.createTime) }}</text>
              <view class="like-box" @tap="handleLike(item, index)">
                <text class="like-icon" :class="{ 'liked': isLiked(item) }">❤</text>
                <text class="like-count">{{ item.likeCount || 0 }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 底部留白防止遮挡 -->
      <view class="bottom-spacer"></view>
    </scroll-view>

    <!-- 悬浮输入栏 -->
    <view class="input-panel">
      <textarea 
        class="input-area" 
        placeholder="写下您的建议或反馈 (5-200字)" 
        v-model="newContent"
        maxlength="200"
        :disabled="submitting"
      />
      <button class="submit-btn" :loading="submitting" @tap="handleSubmit">
        {{ coolDown > 0 ? coolDown + 's' : '提交留言' }}
      </button>
    </view>
    
    <!-- 流量主广告占位 (仅 UI 展示) -->
    <view class="ad-container" v-if="suggestions.length > 3">
        <text class="ad-tips">此处可放置流量主广告位</text>
    </view>
  </view>
</template>

<script>
import { getSuggestions, addSuggestion, likeSuggestion } from '@/utils/suggest_cloud.js'
import { showToast, showLoading, hideLoading } from '@/utils/ui.js'

export default {
  data() {
    return {
      suggestions: [],
      newContent: '',
      loading: false,
      submitting: false,
      userId: '',
      coolDown: 0,
      timer: null
    }
  },

  onLoad() {
    this.userId = uni.getStorageSync('userId')
    if (!this.userId) {
      this.userId = 'user_' + Math.random().toString(36).substr(2, 9)
      uni.setStorageSync('userId', this.userId)
    }
    this.loadData()
  },

  onPullDownRefresh() {
    this.loadData().finally(() => {
      uni.stopPullDownRefresh()
    })
  },

  methods: {
    async loadData() {
      this.loading = true
      const data = await getSuggestions()
      this.suggestions = data
      this.loading = false
    },

    formatDate(date) {
      if (!date) return ''
      const d = new Date(date)
      return `${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
    },

    isLiked(item) {
      return item.likedUsers && item.likedUsers.includes(this.userId)
    },

    async handleLike(item, index) {
      if (this.isLiked(item)) {
        showToast('您已经点过赞啦')
        return
      }
      
      const success = await likeSuggestion(item._id, this.userId)
      if (success) {
        // 本地更新 UI
        this.suggestions[index].likeCount++
        if (!this.suggestions[index].likedUsers) this.suggestions[index].likedUsers = []
        this.suggestions[index].likedUsers.push(this.userId)
        uni.vibrateShort()
      } else {
        showToast('点赞失败')
      }
    },

    async handleSubmit() {
      if (this.coolDown > 0) return
      
      const content = this.newContent.trim()
      if (content.length < 5) {
        showToast('留言太短啦')
        return
      }
      if (content.length > 200) {
        showToast('内容不能超过200字')
        return
      }

      this.submitting = true
      showLoading('提交中...')
      const res = await addSuggestion(content, this.userId)
      hideLoading()
      this.submitting = false

      if (res.success) {
        showToast('提交成功')
        this.newContent = ''
        this.startCoolDown()
        this.loadData() // 重新加载
      } else {
        showToast('提交失败，请重试')
      }
    },

    startCoolDown() {
      this.coolDown = 60
      this.timer = setInterval(() => {
        this.coolDown--
        if (this.coolDown <= 0) {
          clearInterval(this.timer)
        }
      }, 1000)
    }
  }
}
</script>

<style lang="scss" scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #F8F9FA;
}

.header {
  padding: 40rpx;
  background: #2979FF;
  color: #FFF;
  
  .title { font-size: 40rpx; font-weight: bold; display: block; }
  .subtitle { font-size: 24rpx; opacity: 0.8; margin-top: 8rpx; display: block; }
}

.list-container {
  flex: 1;
  padding: 20rpx;
  box-sizing: border-box;
}

.empty-state {
  text-align: center;
  padding: 100rpx 0;
  color: #999;
  font-size: 28rpx;
}

.suggest-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.suggest-card {
  background: #FFF;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
  
  .content {
    font-size: 30rpx;
    color: #333;
    line-height: 1.6;
    display: block;
    margin-bottom: 20rpx;
    word-break: break-all;
  }
  
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1rpx solid #F0F0F0;
    padding-top: 20rpx;
    
    .time { font-size: 24rpx; color: #999; }
    
    .like-box {
      display: flex;
      align-items: center;
      gap: 8rpx;
      padding: 10rpx 20rpx;
      background: #F5F5F5;
      border-radius: 30rpx;
      
      .like-icon { 
        font-size: 28rpx; color: #CCC; 
        &.liked { color: #FF5252; }
      }
      .like-count { font-size: 26rpx; color: #666; }
    }
  }
}

.bottom-spacer { height: 350rpx; }

.input-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #FFF;
  padding: 30rpx 40rpx;
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  
  .input-area {
    width: 100%;
    height: 160rpx;
    background: #F5F5F5;
    border-radius: 12rpx;
    padding: 20rpx;
    box-sizing: border-box;
    font-size: 28rpx;
  }
  
  .submit-btn {
    background: #2979FF;
    color: #FFF;
    border-radius: 40rpx;
    font-size: 30rpx;
    font-weight: bold;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &::after { border: none; }
  }
}

.ad-container {
  padding: 40rpx;
  text-align: center;
  background: #EEE;
  margin: 20rpx 0;
  border-radius: 12rpx;
  .ad-tips { font-size: 24rpx; color: #999; }
}
</style>
