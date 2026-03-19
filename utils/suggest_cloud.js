/**
 * 意见箱专门的云数据库操作工具
 */

const COLLECTION = 'suggestions'

function getDB() {
  if (!wx.cloud) return null
  return wx.cloud.database()
}

/**
 * 获取所有留言（按点赞数从高到低，时间从新到旧）
 */
export async function getSuggestions() {
  const db = getDB()
  if (!db) return []
  
  try {
    const res = await db.collection(COLLECTION)
      .orderBy('likeCount', 'desc')
      .orderBy('createTime', 'desc')
      .limit(100)
      .get()
    return res.data || []
  } catch (e) {
    console.error('getSuggestions failed', e)
    return []
  }
}

/**
 * 提交一条新留言
 */
export async function addSuggestion(content, userId) {
  const db = getDB()
  if (!db) return { success: false }
  
  try {
    // 简单的防刷：检查该用户最后一条留言的时间 (可选，可在前端先做 Cooldown)
    const res = await db.collection(COLLECTION).add({
      data: {
        content,
        userId,
        likeCount: 0,
        likedUsers: [], // 存储点赞过的人的 userId
        createTime: db.serverDate()
      }
    })
    return { success: true, id: res._id }
  } catch (e) {
    console.error('addSuggestion failed', e)
    return { success: false }
  }
}

/**
 * 给留言点赞 (防刷逻辑：每个人只能点一次)
 */
export async function likeSuggestion(docId, userId) {
  const db = getDB()
  if (!db) return false
  const _ = db.command
  
  try {
    // 使用原子操作：只有当 userId 不在 likedUsers 数组中时才更新
    const res = await db.collection(COLLECTION).where({
      _id: docId,
      likedUsers: _.neq(userId)
    }).update({
      data: {
        likeCount: _.inc(1),
        likedUsers: _.addToSet(userId)
      }
    })
    
    // 如果 stats.updated 为 0，说明用户已经在 likedUsers 里了，或者记录不存在
    return res.stats.updated > 0
  } catch (e) {
    console.error('likeSuggestion failed', e)
    return false
  }
}
