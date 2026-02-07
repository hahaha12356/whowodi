<template>
  <view class="container">
    <!-- 空状态 -->
    <view v-if="!historyList.length && !loading" class="empty-state">
      <text class="empty-icon">📋</text>
      <text class="empty-text">暂无历史记录</text>
    </view>

    <!-- 历史记录列表 -->
    <view v-else class="history-list">
      <view
        v-for="item in historyList"
        :key="item.planId"
        class="history-item"
        @tap="viewHistory(item.planId)"
      >
        <view class="item-header">
          <text class="plan-id">#{{ item.planId }}</text>
          <text class="create-time">{{ formatRelativeTime(item.createTime) }}</text>
        </view>

        <view class="item-body">
          <view class="word-pair">
            <text class="word">{{ item.wordPair.wordA }}</text>
            <text class="separator">/</text>
            <text class="word">{{ item.wordPair.wordB }}</text>
          </view>

          <view class="config-info">
            <text class="info-text">{{ item.config.totalCount }}人</text>
            <text class="separator">|</text>
            <text class="info-text">A:{{ item.config.typeACount }}</text>
            <text class="separator">|</text>
            <text class="info-text">B:{{ item.config.typeBCount }}</text>
            <text v-if="item.config.typeCCount" class="separator">|</text>
            <text v-if="item.config.typeCCount" class="info-text">C:{{ item.config.typeCCount }}</text>
          </view>
        </view>

        <view class="item-footer">
          <view class="footer-btn" @tap.stop="deleteHistory(item.planId)">
            <text class="icon">🗑️</text>
            <text>删除</text>
          </view>
          <view class="footer-btn primary" @tap.stop="shareHistory(item.planId)">
            <text class="icon">📤</text>
            <text>分享</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 清空按钮 -->
    <view v-if="historyList.length" class="clear-btn" @tap="handleClear">
      <text>清空历史</text>
    </view>
  </view>
</template>

<script>
import { getHistory, deleteHistory, clearHistory } from '@/utils/storage.js'
import { formatRelativeTime } from '@/utils/formatter.js'
import { showModal, showToast, showLoading, hideLoading } from '@/utils/ui.js'

export default {
  data() {
    return {
      historyList: [],
      loading: true
    }
  },

  onLoad() {
    this.loadHistory()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadHistory()
    setTimeout(() => {
      uni.stopPullDownRefresh()
    }, 1000)
  },

  methods: {
    // 加载历史记录
    async loadHistory() {
      this.loading = true
      try {
        this.historyList = await getHistory()
      } catch (error) {
        console.error('加载历史失败:', error)
        showToast('加载失败')
      } finally {
        this.loading = false
      }
    },

    // 查看历史详情
    viewHistory(planId) {
      uni.navigateTo({
        url: `/pages/result/result?planId=${planId}`
      })
    },

    // 删除历史记录
    async deleteHistory(planId) {
      const confirmed = await showModal({
        title: '确认删除',
        content: '确定要删除这条历史记录吗？'
      })

      if (confirmed) {
        showLoading('删除中...')
        try {
          await deleteHistory(planId)
          await this.loadHistory()
          showToast('删除成功')
        } catch (error) {
          console.error('删除失败:', error)
          showToast('删除失败')
        } finally {
          hideLoading()
        }
      }
    },

    // 分享历史
    shareHistory(planId) {
      // 跳转到结果页分享
      uni.navigateTo({
        url: `/pages/result/result?planId=${planId}`
      })
    },

    // 清空历史
    async handleClear() {
      const confirmed = await showModal({
        title: '确认清空',
        content: '确定要清空所有历史记录吗？'
      })

      if (confirmed) {
        showLoading('清空中...')
        try {
          await clearHistory()
          await this.loadHistory()
          showToast('清空成功')
        } catch (error) {
          console.error('清空失败:', error)
          showToast('清空失败')
        } finally {
          hideLoading()
        }
      }
    },

    // 格式化相对时间
    formatRelativeTime
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.container {
  min-height: 100vh;
  background: $bg-color;
  padding: 32rpx;
  padding-bottom: 120rpx;
}

.empty-state {
  @include flex-center;
  flex-direction: column;
  padding: 120rpx 0;

  .empty-icon {
    font-size: 120rpx;
    margin-bottom: 24rpx;
  }

  .empty-text {
    font-size: 28rpx;
    color: $text-secondary;
  }
}

.history-list {
  .history-item {
    background: #fff;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 24rpx;
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16rpx;

      .plan-id {
        font-size: 32rpx;
        font-weight: 600;
        color: $primary-color;
      }

      .create-time {
        font-size: 24rpx;
        color: $text-secondary;
      }
    }

    .item-body {
      padding: 16rpx 0;
      border-top: 1px solid $border-light;
      border-bottom: 1px solid $border-light;

      .word-pair {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12rpx;

        .word {
          font-size: 32rpx;
          font-weight: 600;
          color: $text-primary;
        }

        .separator {
          margin: 0 12rpx;
          color: $text-secondary;
        }
      }

      .config-info {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;

        .info-text {
          font-size: 26rpx;
          color: $text-secondary;
        }

        .separator {
          margin: 0 8rpx;
          color: $text-disabled;
        }
      }
    }

    .item-footer {
      display: flex;
      gap: 16rpx;
      margin-top: 16rpx;

      .footer-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8rpx;
        padding: 16rpx;
        background: $bg-grey;
        border-radius: 8rpx;

        .icon {
          font-size: 28rpx;
        }

        text {
          font-size: 26rpx;
          color: $text-secondary;
        }

        &.primary {
          background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);

          text {
            color: $primary-color;
          }
        }
      }
    }
  }
}

.clear-btn {
  position: fixed;
  bottom: 32rpx;
  left: 50%;
  transform: translateX(-50%);
  padding: 20rpx 48rpx;
  background: #fff;
  border-radius: 48rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);

  text {
    font-size: 28rpx;
    color: $error-color;
  }
}
</style>
