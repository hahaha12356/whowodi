/**
 * 数据校验工具
 */
import { PEOPLE_COUNT } from './constants.js'

/**
 * 校验配置数据
 * @param {object} config - 配置对象
 * @returns {object} { valid: boolean, message: string }
 */
export function validateConfig(config) {
  const { totalCount, typeACount, typeBCount, typeCCount } = config

  // 检查必填字段
  if (!totalCount || typeACount === undefined || typeBCount === undefined || typeCCount === undefined) {
    return {
      valid: false,
      message: '配置数据不完整'
    }
  }

  // 检查数据类型
  if (!Number.isInteger(totalCount) || !Number.isInteger(typeACount) ||
      !Number.isInteger(typeBCount) || !Number.isInteger(typeCCount)) {
    return {
      valid: false,
      message: '人数必须为整数'
    }
  }

  // 检查总人数范围
  if (totalCount < PEOPLE_COUNT.MIN || totalCount > PEOPLE_COUNT.MAX) {
    return {
      valid: false,
      message: `总人数需在${PEOPLE_COUNT.MIN}-${PEOPLE_COUNT.MAX}人之间`
    }
  }

  // 检查总和
  if (typeACount + typeBCount + typeCCount !== totalCount) {
    return {
      valid: false,
      message: '各类型人数总和必须等于总人数'
    }
  }

  // 检查A类最小值
  if (typeACount < 1) {
    return {
      valid: false,
      message: 'A类词语至少需要1人'
    }
  }

  // 检查B类最大值
  const maxTypeB = Math.floor(totalCount / 3)
  if (typeBCount > maxTypeB) {
    return {
      valid: false,
      message: `B类词语人数不建议超过${maxTypeB}人`
    }
  }

  // 检查C类最大值
  if (typeCCount > 2) {
    return {
      valid: false,
      message: 'C类人数最多2人'
    }
  }

  // 检查负数
  if (typeACount < 0 || typeBCount < 0 || typeCCount < 0) {
    return {
      valid: false,
      message: '人数不能为负数'
    }
  }

  return { valid: true, message: '' }
}

/**
 * 校验方案ID格式
 * @param {string} planId - 方案ID
 * @returns {boolean}
 */
export function validatePlanId(planId) {
  if (!planId || typeof planId !== 'string') {
    return false
  }

  // 检查长度和格式（4位大写字母或数字）
  return /^[A-Z0-9]{4}$/.test(planId)
}

/**
 * 校验词组数据
 * @param {object} wordPair - 词组对象
 * @returns {boolean}
 */
export function validateWordPair(wordPair) {
  if (!wordPair || typeof wordPair !== 'object') {
    return false
  }

  const { wordA, wordB } = wordPair

  if (!wordA || !wordB || typeof wordA !== 'string' || typeof wordB !== 'string') {
    return false
  }

  if (wordA.trim() === '' || wordB.trim() === '') {
    return false
  }

  if (wordA === wordB) {
    return false
  }

  return true
}
