/**
 * 本地存储工具
 */
import { isPlanExpired } from './algorithm.js'
import { STORAGE_KEYS, MAX_HISTORY_COUNT } from './constants.js'

/**
 * 保存方案
 * @param {object} plan - 方案对象
 */
export async function savePlan(plan) {
  try {
    const plans = await getAllPlans()

    // 检查是否已存在
    const index = plans.findIndex(p => p.planId === plan.planId)

    if (index >= 0) {
      // 更新已有方案
      plans[index] = plan
    } else {
      // 添加新方案
      plans.push(plan)
    }

    // 清理过期方案
    const validPlans = plans.filter(p => !isPlanExpired(p))

    // 保存
    uni.setStorageSync(STORAGE_KEYS.PLANS, validPlans)

    // 同时保存到历史记录
    await saveToHistory(plan)

    return true
  } catch (error) {
    console.error('保存方案失败:', error)
    return false
  }
}

/**
 * 获取所有方案
 * @returns {Array} 方案列表
 */
export async function getAllPlans() {
  try {
    const plans = uni.getStorageSync(STORAGE_KEYS.PLANS)
    return Array.isArray(plans) ? plans : []
  } catch (error) {
    console.error('获取方案失败:', error)
    return []
  }
}

/**
 * 根据ID获取方案
 * @param {string} planId - 方案ID
 * @returns {object|null} 方案对象
 */
export async function getPlanById(planId) {
  try {
    const plans = await getAllPlans()
    const plan = plans.find(p => p.planId === planId)

    if (!plan) {
      return null
    }

    // 检查是否过期
    if (isPlanExpired(plan)) {
      await deletePlan(planId)
      return null
    }

    return plan
  } catch (error) {
    console.error('获取方案失败:', error)
    return null
  }
}

/**
 * 删除方案
 * @param {string} planId - 方案ID
 */
export async function deletePlan(planId) {
  try {
    const plans = await getAllPlans()
    const filtered = plans.filter(p => p.planId !== planId)
    uni.setStorageSync(STORAGE_KEYS.PLANS, filtered)
    return true
  } catch (error) {
    console.error('删除方案失败:', error)
    return false
  }
}

/**
 * 保存到历史记录
 * @param {object} plan - 方案对象
 */
export async function saveToHistory(plan) {
  try {
    const history = await getHistory()

    // 创建历史记录项
    const historyItem = {
      planId: plan.planId,
      wordPair: plan.wordPair,
      config: plan.config,
      createTime: plan.createTime
    }

    // 检查是否已存在
    const index = history.findIndex(h => h.planId === plan.planId)

    if (index >= 0) {
      history[index] = historyItem
    } else {
      history.unshift(historyItem) // 添加到开头
    }

    // 最多保留50条
    const trimmed = history.slice(0, MAX_HISTORY_COUNT)

    uni.setStorageSync(STORAGE_KEYS.HISTORY, trimmed)
  } catch (error) {
    console.error('保存历史失败:', error)
  }
}

/**
 * 获取历史记录
 * @returns {Array} 历史记录列表
 */
export async function getHistory() {
  try {
    const history = uni.getStorageSync(STORAGE_KEYS.HISTORY)
    return Array.isArray(history) ? history : []
  } catch (error) {
    console.error('获取历史失败:', error)
    return []
  }
}

/**
 * 删除历史记录
 * @param {string} planId - 方案ID
 */
export async function deleteHistory(planId) {
  try {
    const history = await getHistory()
    const filtered = history.filter(h => h.planId !== planId)
    uni.setStorageSync(STORAGE_KEYS.HISTORY, filtered)
    return true
  } catch (error) {
    console.error('删除历史失败:', error)
    return false
  }
}

/**
 * 清除历史记录
 */
export async function clearHistory() {
  try {
    uni.removeStorageSync(STORAGE_KEYS.HISTORY)
    return true
  } catch (error) {
    console.error('清除历史失败:', error)
    return false
  }
}

/**
 * 清理过期数据
 */
export async function cleanExpiredData() {
  try {
    const plans = await getAllPlans()
    const validPlans = plans.filter(p => !isPlanExpired(p))

    uni.setStorageSync(STORAGE_KEYS.PLANS, validPlans)

    return true
  } catch (error) {
    console.error('清理过期数据失败:', error)
    return false
  }
}

/**
 * 获取用户ID
 * @returns {string} 用户ID
 */
export function getUserId() {
  let userId = uni.getStorageSync(STORAGE_KEYS.USER_ID)
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    uni.setStorageSync(STORAGE_KEYS.USER_ID, userId)
  }
  return userId
}
