<template>
  <view :class="['word-card', `card-type-${assignment.type}`]">
    <view class="card-header">
      <text class="card-title">词语卡片</text>
    </view>

    <view class="card-body">
      <view class="identity-section">
        <text class="identity-label">您被分配为</text>
        <text class="identity-type">{{ typeText }}</text>
      </view>

      <view class="word-section">
        <text v-if="assignment.word" class="word-label">您的词语是:</text>
        <text v-if="assignment.word" class="word-value">「 {{ assignment.word }} 」</text>
        <text v-else class="no-word">您没有词语</text>
      </view>

      <view class="tips-section">
        <text class="tip-text">{{ tipText }}</text>
      </view>
    </view>

    <view class="card-footer">
      <text class="assignment-number">编号: {{ assignment.index }}号</text>
      <custom-button type="secondary" size="medium" @click="handleClose">
        我已记住,关闭
      </custom-button>
    </view>
  </view>
</template>

<script>
import { TYPE_TEXT, TYPE_TIPS } from '@/utils/constants.js'

export default {
  name: 'WordCard',
  props: {
    assignment: {
      type: Object,
      required: true
    }
  },
  computed: {
    typeText() {
      return TYPE_TEXT[this.assignment.type] || ''
    },
    tipText() {
      return TYPE_TIPS[this.assignment.type] || ''
    }
  },
  methods: {
    handleClose() {
      this.$emit('close')
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.word-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 48rpx 32rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
  margin: 32rpx;
}

.card-type-A {
  background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
}

.card-type-B {
  background: linear-gradient(135deg, #FFE0B2 0%, #FFCC80 100%);
}

.card-type-C {
  background: linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%);
}

.card-header {
  text-align: center;
  margin-bottom: 40rpx;

  .card-title {
    font-size: 36rpx;
    font-weight: 600;
    color: #333;
  }
}

.card-body {
  .identity-section {
    text-align: center;
    margin-bottom: 48rpx;

    .identity-label {
      display: block;
      font-size: 28rpx;
      color: #666;
      margin-bottom: 16rpx;
    }

    .identity-type {
      display: block;
      font-size: 48rpx;
      font-weight: bold;
      color: #333;
    }
  }

  .word-section {
    text-align: center;
    margin-bottom: 40rpx;

    .word-label {
      display: block;
      font-size: 28rpx;
      color: #666;
      margin-bottom: 16rpx;
    }

    .word-value {
      display: block;
      font-size: 56rpx;
      font-weight: bold;
      color: #1565C0;
      letter-spacing: 4rpx;
    }

    .no-word {
      display: block;
      font-size: 40rpx;
      font-weight: bold;
      color: #999;
    }
  }

  .tips-section {
    background: rgba(255, 255, 255, 0.6);
    border-radius: 12rpx;
    padding: 24rpx;
    text-align: center;

    .tip-text {
      font-size: 26rpx;
      color: #666;
      line-height: 1.6;
    }
  }
}

.card-footer {
  margin-top: 40rpx;
  text-align: center;

  .assignment-number {
    display: block;
    font-size: 28rpx;
    color: #666;
    margin-bottom: 24rpx;
  }
}
</style>
