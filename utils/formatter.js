/**
 * 数据格式化工具
 */

/**
 * 格式化时间戳为可读时间
 * @param {number} timestamp - 时间戳
 * @param {string} format - 格式 (date/time/datetime)
 * @returns {string} 格式化后的时间
 */
export function formatTime(timestamp, format = 'datetime') {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')

  switch (format) {
    case 'date':
      return `${year}-${month}-${day}`
    case 'time':
      return `${hour}:${minute}:${second}`
    case 'datetime':
      return `${year}-${month}-${day} ${hour}:${minute}:${second}`
    case 'simple':
      return `${month}-${day} ${hour}:${minute}`
    default:
      return `${year}-${month}-${day} ${hour}:${minute}`
  }
}

/**
 * 格式化相对时间
 * @param {number} timestamp - 时间戳
 * @returns {string} 相对时间描述
 */
export function formatRelativeTime(timestamp) {
  const now = Date.now()
  const diff = now - timestamp

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`
  } else if (diff < 7 * day) {
    return `${Math.floor(diff / day)}天前`
  } else {
    return formatTime(timestamp, 'simple')
  }
}

/**
 * 格式化人数显示
 * @param {number} count - 人数
 * @returns {string}
 */
export function formatPeopleCount(count) {
  return `${count}人`
}

/**
 * 格式化百分比
 * @param {number} value - 数值
 * @param {number} total - 总数
 * @param {number} decimals - 小数位数
 * @returns {string}
 */
export function formatPercentage(value, total, decimals = 0) {
  if (total === 0) return '0%'
  const percentage = (value / total) * 100
  return `${percentage.toFixed(decimals)}%`
}

/**
 * 截断文本
 * @param {string} text - 文本
 * @param {number} maxLength - 最大长度
 * @param {string} suffix - 后缀
 * @returns {string}
 */
export function truncateText(text, maxLength = 20, suffix = '...') {
  if (!text || text.length <= maxLength) {
    return text
  }
  return text.substring(0, maxLength) + suffix
}
