<template>
  <view class="number-stepper">
    <view
      :class="['stepper-btn', { disabled: value <= min }]"
      @tap="decrease"
    >
      −
    </view>
    <view class="stepper-value">{{ value }}</view>
    <view
      :class="['stepper-btn', { disabled: value >= max }]"
      @tap="increase"
    >
      +
    </view>
  </view>
</template>

<script>
export default {
  name: 'NumberStepper',
  props: {
    value: {
      type: Number,
      required: true
    },
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 100
    },
    step: {
      type: Number,
      default: 1
    }
  },
  methods: {
    decrease() {
      if (this.value > this.min) {
        const newValue = this.value - this.step
        this.$emit('change', newValue >= this.min ? newValue : this.min)
      }
    },
    increase() {
      if (this.value < this.max) {
        const newValue = this.value + this.step
        this.$emit('change', newValue <= this.max ? newValue : this.max)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.number-stepper {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.stepper-btn {
  width: 60rpx;
  height: 60rpx;
  line-height: 60rpx;
  text-align: center;
  background: #F5F7FA;
  border-radius: 50%;
  font-size: 32rpx;
  color: #333;
  transition: all 0.3s;

  &:active:not(.disabled) {
    background: #E8EAED;
    transform: scale(0.9);
  }

  &.disabled {
    opacity: 0.4;
    color: #999;
  }
}

.stepper-value {
  min-width: 60rpx;
  text-align: center;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}
</style>
