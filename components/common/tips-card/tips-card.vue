<template>
  <view :class="['tips-card', `tips-${type}`]">
    <view class="tips-icon">{{ icon }}</view>
    <view class="tips-content">
      <slot></slot>
    </view>
  </view>
</template>

<script>
export default {
  name: 'TipsCard',
  props: {
    type: {
      type: String,
      default: 'info' // info, warning, success, error
    }
  },
  computed: {
    icon() {
      const iconMap = {
        info: '💡',
        warning: '⚠️',
        success: '✅',
        error: '❌'
      }
      return iconMap[this.type] || '💡'
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.tips-card {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 24rpx;
  border-radius: 12rpx;
  margin-top: 16rpx;
}

.tips-info {
  background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
}

.tips-warning {
  background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%);
}

.tips-success {
  background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
}

.tips-error {
  background: linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%);
}

.tips-icon {
  font-size: 32rpx;
  flex-shrink: 0;
}

.tips-content {
  flex: 1;
  font-size: 26rpx;
  color: #333;
  line-height: 1.6;
}
</style>
