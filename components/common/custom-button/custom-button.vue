<template>
  <button
    :class="['custom-button', `btn-${type}`, `btn-${size}`, { disabled: disabled }]"
    :disabled="disabled"
    :loading="loading"
    @click="handleClick"
  >
    <slot></slot>
  </button>
</template>

<script>
export default {
  name: 'CustomButton',
  props: {
    type: {
      type: String,
      default: 'primary' // primary, secondary, text
    },
    size: {
      type: String,
      default: 'medium' // small, medium, large
    },
    disabled: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    handleClick(e) {
      if (!this.disabled && !this.loading) {
        console.log('Button clicked')
        // 触觉反馈
        try {
          uni.vibrateShort({
            type: 'light'
          })
        } catch (e) {
          // 忽略震动失败
        }
        this.$emit('click', e)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.custom-button {
  border: none;
  border-radius: 12rpx;
  font-size: 28rpx;
  text-align: center;
  transition: all 0.3s;

  &::after {
    border: none;
  }

  &:active:not(.disabled) {
    transform: scale(0.95);
  }
}

.btn-primary {
  background: linear-gradient(135deg, #2979FF 0%, #1565C0 100%);
  color: #fff;

  &.disabled {
    background: #ccc;
    opacity: 0.6;
  }
}

.btn-secondary {
  background: #F5F7FA;
  color: #333;

  &.disabled {
    opacity: 0.6;
  }
}

.btn-text {
  background: transparent;
  color: #2979FF;

  &.disabled {
    color: #ccc;
  }
}

.btn-small {
  height: 60rpx;
  line-height: 60rpx;
  padding: 0 24rpx;
  font-size: 24rpx;
}

.btn-medium {
  height: 80rpx;
  line-height: 80rpx;
  padding: 0 32rpx;
}

.btn-large {
  height: 96rpx;
  line-height: 96rpx;
  padding: 0 48rpx;
  font-size: 32rpx;
  font-weight: 600;
}
</style>
