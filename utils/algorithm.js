/**
 * 词语分配算法工具
 */
import { PLAN_EXPIRE_TIME } from './constants.js'
import { wordLibrary } from '@/static/data/wordLibrary.js'

/**
 * 获取推荐配置
 * @param {number} totalCount - 总人数
 * @returns {object} 推荐配置
 */
export function getRecommendConfig(totalCount) {
  let typeACount, typeBCount, typeCCount

  if (totalCount <= 5) {
    // 3-5人: 1卧底 0白板
    typeBCount = 1
    typeCCount = 0
    typeACount = totalCount - 1
  } else if (totalCount <= 8) {
    // 6-8人: 1卧底 1白板
    typeBCount = 1
    typeCCount = 1
    typeACount = totalCount - 2
  } else if (totalCount <= 12) {
    // 9-12人: 2卧底 1白板
    typeBCount = 2
    typeCCount = 1
    typeACount = totalCount - 3
  } else if (totalCount <= 16) {
    // 13-16人: 3卧底 1白板
    typeBCount = 3
    typeCCount = 1
    typeACount = totalCount - 4
  } else {
    // 17-20人: 4卧底 2白板
    typeBCount = 4
    typeCCount = 2
    typeACount = totalCount - 6
  }

  return {
    totalCount,
    typeACount,
    typeBCount,
    typeCCount
  }
}

/**
 * 校验配置
 * @param {object} config - 配置对象
 * @returns {object} 校验结果 { valid, message }
 */
export function validateConfig(config) {
  const { totalCount, typeACount, typeBCount, typeCCount } = config

  // 检查总和
  if (typeACount + typeBCount + typeCCount !== totalCount) {
    return {
      valid: false,
      message: '各类型人数总和必须等于总人数'
    }
  }

  // 检查最小值
  if (typeACount < 1) {
    return {
      valid: false,
      message: 'A类词语至少需要1人'
    }
  }

  // 检查B类比例
  if (typeBCount > Math.floor(totalCount / 3)) {
    return {
      valid: false,
      message: 'B类词语人数不建议超过总人数的1/3'
    }
  }

  // 检查C类最大值
  if (typeCCount > 2) {
    return {
      valid: false,
      message: 'C类人数最多2人'
    }
  }

  return { valid: true }
}

/**
 * Fisher-Yates 洗牌算法
 * @param {Array} array - 数组
 * @returns {Array} 打乱后的数组
 */
function shuffleArray(array) {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

/**
 * 生成随机方案ID
 * @returns {string} 4位随机字符
 */
function generatePlanId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 去除易混淆字符
  let id = ''
  for (let i = 0; i < 4; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return id
}

/**
 * 从词库获取词组
 * @param {string} categoryId - 分类ID (random表示随机)
 * @returns {object} 词组对象
 */
function getWordPair(categoryId) {
  let category
  if (categoryId === 'random') {
    // 随机选择一个分类
    const categories = wordLibrary.categories.filter(c => c.enabled)
    category = categories[Math.floor(Math.random() * categories.length)]
  } else {
    category = wordLibrary.categories.find(c => c.id === categoryId)
  }

  if (!category || !category.words || category.words.length === 0) {
    throw new Error('词库数据错误')
  }

  // 随机选择一个词组
  const wordPair = category.words[Math.floor(Math.random() * category.words.length)]

  return {
    ...wordPair,
    categoryId: category.id
  }
}

/**
 * 生成分配方案
 * @param {object} config - 配置对象
 * @returns {object} 完整的方案对象
 */
export function generatePlan(config) {
  const { totalCount, typeACount, typeBCount, typeCCount, categoryId, fixedWordPair } = config

  // 获取词组（优先使用固定的词语对）
  let wordPair
  if (fixedWordPair && fixedWordPair.wordA && fixedWordPair.wordB) {
    // 使用固定的词语对
    wordPair = {
      wordA: fixedWordPair.wordA,
      wordB: fixedWordPair.wordB,
      categoryId: categoryId || 'classic'
    }
  } else {
    // 从词库随机获取
    wordPair = getWordPair(categoryId)
  }

  // 创建分配数组
  const assignments = []

  // 添加A类
  for (let i = 0; i < typeACount; i++) {
    assignments.push({
      type: 'A',
      word: wordPair.wordA
    })
  }

  // 添加B类
  for (let i = 0; i < typeBCount; i++) {
    assignments.push({
      type: 'B',
      word: wordPair.wordB
    })
  }

  // 添加C类
  for (let i = 0; i < typeCCount; i++) {
    assignments.push({
      type: 'C',
      word: null
    })
  }

  // 洗牌
  const shuffled = shuffleArray(assignments)

  // 添加编号
  const finalAssignments = shuffled.map((item, index) => ({
    ...item,
    index: index + 1,
    viewed: false,
    userId: null,
    viewTime: null
  }))

  // 生成方案对象
  const plan = {
    planId: generatePlanId(),
    config: {
      totalCount,
      typeACount,
      typeBCount,
      typeCCount,
      categoryId
    },
    wordPair: {
      wordA: wordPair.wordA,
      wordB: wordPair.wordB,
      categoryId: wordPair.categoryId
    },
    assignments: finalAssignments,
    createTime: Date.now(),
    creatorId: config.creatorId || null, // 记录创建者ID
    viewCount: 0,
    status: 'active'
  }

  return plan
}

/**
 * 检查方案是否过期
 * @param {object} plan - 方案对象
 * @returns {boolean} 是否过期
 */
export function isPlanExpired(plan) {
  return Date.now() - plan.createTime > PLAN_EXPIRE_TIME
}
