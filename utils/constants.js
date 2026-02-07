/**
 * 全局常量定义
 */

// 存储key
export const STORAGE_KEYS = {
  PLANS: 'word_plans',
  HISTORY: 'word_history',
  CONFIG: 'word_config',
  USER_ID: 'userId'
}

// 方案状态
export const PLAN_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired'
}

// 词语类型
export const WORD_TYPES = {
  TYPE_A: 'A',
  TYPE_B: 'B',
  TYPE_C: 'C'
}

// 类型显示文本
export const TYPE_TEXT = {
  A: '平民',
  B: '卧底',
  C: '白板'
}

// 类型提示文本
export const TYPE_TIPS = {
  A: '你是平民，找出谁是卧底',
  B: '你是卧底，隐藏好自己的身份',
  C: '你是白板，通过观察推测词语'
}

// 难度级别
export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
}

// 难度显示文本
export const DIFFICULTY_TEXT = {
  easy: '简单',
  medium: '中等',
  hard: '困难'
}

// 人数范围
export const PEOPLE_COUNT = {
  MIN: 3,
  MAX: 20,
  DEFAULT: 6
}

// 方案过期时间（24小时）
export const PLAN_EXPIRE_TIME = 24 * 60 * 60 * 1000

// 历史记录最大保存数量
export const MAX_HISTORY_COUNT = 50

// 默认词库ID
export const DEFAULT_CATEGORY_ID = 'classic'

// Toast持续时间
export const TOAST_DURATION = 2000

// 动画时长
export const ANIMATION_DURATION = {
  SHORT: 300,
  NORMAL: 500,
  LONG: 1000
}

// 颜色配置
export const COLORS = {
  PRIMARY: '#2979FF',
  SECONDARY: '#FF9800',
  SUCCESS: '#4CAF50',
  WARNING: '#FFC107',
  ERROR: '#F44336',
  INFO: '#2196F3',

  TEXT_PRIMARY: '#333333',
  TEXT_SECONDARY: '#666666',
  TEXT_DISABLED: '#999999',

  BG_COLOR: '#F5F7FA',
  BG_GREY: '#E8EAED',

  TYPE_A_BG: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
  TYPE_B_BG: 'linear-gradient(135deg, #FFE0B2 0%, #FFCC80 100%)',
  TYPE_C_BG: 'linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)'
}
