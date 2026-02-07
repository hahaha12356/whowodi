/**
 * UI交互工具
 */
import { TOAST_DURATION } from './constants.js'

/**
 * 显示Toast提示
 * @param {string} title - 提示文本
 * @param {string} icon - 图标类型 (success/error/none)
 * @param {number} duration - 持续时间
 */
export function showToast(title, icon = 'none', duration = TOAST_DURATION) {
  uni.showToast({
    title,
    icon,
    duration,
    mask: true
  })
}

/**
 * 显示成功提示
 * @param {string} title - 提示文本
 */
export function showSuccess(title) {
  showToast(title, 'success')
}

/**
 * 显示错误提示
 * @param {string} title - 提示文本
 */
export function showError(title) {
  showToast(title, 'error')
}

/**
 * 显示加载中
 * @param {string} title - 提示文本
 */
export function showLoading(title = '加载中...') {
  uni.showLoading({
    title,
    mask: true
  })
}

/**
 * 隐藏加载
 */
export function hideLoading() {
  uni.hideLoading()
}

/**
 * 显示模态对话框
 * @param {object} options - 配置选项
 * @returns {Promise}
 */
export function showModal(options = {}) {
  return new Promise((resolve, reject) => {
    uni.showModal({
      title: options.title || '提示',
      content: options.content || '',
      showCancel: options.showCancel !== false,
      confirmText: options.confirmText || '确定',
      cancelText: options.cancelText || '取消',
      success: (res) => {
        if (res.confirm) {
          resolve(true)
        } else if (res.cancel) {
          resolve(false)
        }
      },
      fail: reject
    })
  })
}

/**
 * 显示操作菜单
 * @param {Array} items - 菜单项列表
 * @returns {Promise<number>} 选中的索引
 */
export function showActionSheet(items) {
  return new Promise((resolve, reject) => {
    uni.showActionSheet({
      itemList: items,
      success: (res) => {
        resolve(res.tapIndex)
      },
      fail: reject
    })
  })
}

/**
 * 触觉反馈
 * @param {string} type - 反馈类型 (light/medium/heavy)
 */
export function vibrate(type = 'light') {
  uni.vibrateShort({
    type
  })
}

/**
 * 复制到剪贴板
 * @param {string} data - 要复制的内容
 * @returns {Promise}
 */
export function copyToClipboard(data) {
  return new Promise((resolve, reject) => {
    uni.setClipboardData({
      data,
      success: () => {
        showSuccess('已复制')
        resolve()
      },
      fail: reject
    })
  })
}
