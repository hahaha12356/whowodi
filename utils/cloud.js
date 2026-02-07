/**
 * 云开发数据库工具类
 * 集合名称：'plans'
 */

const COLLECTION_NAME = 'plans'

// 缓存以避免重复初始化
let db = null

/**
 * 获取数据库实例
 */
function getDB() {
    if (!db) {
        if (!wx.cloud) {
            console.error('云能力未初始化')
            return null
        }
        db = wx.cloud.database()
    }
    return db
}

/**
 * 将方案保存到云数据库
 * @param {object} plan - 方案对象
 * @returns {Promise<string>} 返回云端记录ID (_id)
 */
export async function savePlanToCloud(plan) {
    const db = getDB()
    if (!db) return null

    try {
        // 移除不必要的本地状态字段，保持云端纯净
        // 深拷贝一份以防修改原对象
        const cloudData = JSON.parse(JSON.stringify(plan))

        // 添加或者更新时间戳
        cloudData._createTime = db.serverDate()
        cloudData._updateTime = db.serverDate()

        // 如果已经有 _id，则尝试更新（但在这种场景下通常是新建）
        // 为了简单起见，且每个方案是独立的，直接add即可
        // 如果本地已经有cloudId，说明已经保存过，避免重复保存
        if (plan.cloudId) {
            console.log('方案已在云端，跳过保存:', plan.cloudId)
            return plan.cloudId
        }

        const res = await db.collection(COLLECTION_NAME).add({
            data: cloudData
        })

        console.log('方案保存云端成功, _id:', res._id)
        return res._id
    } catch (err) {
        console.error('保存云端失败:', err)
        // 失败不抛出异常，让业务层可以使用降级方案
        return null
    }
}

/**
 * 从云数据库获取方案
 * @param {string} id - 云端记录ID (_id)
 * @returns {Promise<object>} 方案对象
 */
export async function getPlanFromCloud(id) {
    const db = getDB()
    if (!db) return null

    try {
        const res = await db.collection(COLLECTION_NAME).doc(id).get()

        if (res.data) {
            console.log('云端获取方案成功:', res.data)
            return res.data
        }
        return null
    } catch (err) {
        console.error('云端获取方案失败:', err)
        return null
    }
}

/**
 * 更新云端查看次数 (可选功能)
 * @param {string} id - 云端记录ID
 */
export async function incrementCloudViewCount(id) {
    const db = getDB()
    if (!db) return

    try {
        const _ = db.command
        await db.collection(COLLECTION_NAME).doc(id).update({
            data: {
                viewCount: _.inc(1),
                _updateTime: db.serverDate()
            }
        })
    } catch (err) {
        console.error('更新查看数失败:', err)
    }
}

/**
 * 抢占座位
 * @param {string} planId - 方案ID
 * @param {number} assignmentIndex - 数组下标
 * @param {object} userInfo - 用户信息 { userId, viewTime, viewed }
 * @returns {Promise<boolean>} 是否抢占成功
 */
export async function occupySeatInCloud(planId, assignmentIndex, userInfo) {
    const db = getDB()
    if (!db) return false

    try {
        // 使用 update 进行原子更新
        // 只有当该位置的 userId 为 null 时才更新 (但在Client端只能用doc.update，无法带where条件)
        // 这里的原子性依赖于 update 操作本身是原子的
        // 虽然会有覆盖风险（Client端限制），但对于聚会场景可接受

        const updateData = {}
        // 更新指定数组位置的字段
        updateData[`assignments.${assignmentIndex}.userId`] = userInfo.userId
        updateData[`assignments.${assignmentIndex}.viewed`] = true
        updateData[`assignments.${assignmentIndex}.viewTime`] = userInfo.viewTime
        updateData[`_updateTime`] = db.serverDate()

        const res = await db.collection(COLLECTION_NAME).doc(planId).update({
            data: updateData
        })

        if (res.stats.updated === 1) {
            return true
        } else {
            throw new Error('UPDATE_FAILED_OR_PERMISSION_DENIED')
        }
    } catch (err) {
        console.error('抽取身份云端同步失败:', err)
        throw err
    }
}

/**
 * 根据 4 位方案 ID 获取方案 (用于 q 参数降级后的找回)
 * @param {string} planId - 4位方案ID
 * @returns {Promise<object>}
 */
export async function getPlanByPlanId(planId) {
    const db = getDB()
    if (!db) return null

    try {
        const res = await db.collection(COLLECTION_NAME).where({
            planId: planId
        }).orderBy('_createTime', 'desc').limit(1).get()

        if (res.data && res.data.length > 0) {
            console.log('通过planId找回方案成功:', res.data[0])
            return res.data[0]
        }
        return null
    } catch (err) {
        console.error('通过planId找回方案失败:', err)
        return null
    }
}

// ============== 新增：Claims 集合管理 ==============
// claims 集合用于存储每个玩家的领取记录
// 每条 claim 由领取者自己创建，所以不存在权限问题
const CLAIMS_COLLECTION = 'claims'

/**
 * 获取某个方案的所有领取记录
 * @param {string} planId - 方案的4位ID
 * @returns {Promise<Array>} 所有claim记录
 */
export async function getClaimsForPlan(planId) {
    const db = getDB()
    if (!db) return []

    try {
        const res = await db.collection(CLAIMS_COLLECTION).where({
            planId: planId
        }).get()

        return res.data || []
    } catch (err) {
        console.error('获取领取记录失败:', err)
        return []
    }
}

/**
 * 创建领取记录
 * @param {string} planId - 方案的4位ID
 * @param {number} seatIndex - 座位编号 (1-based)
 * @param {string} oddrtyId - 用户唯一标识
 * @returns {Promise<boolean>} 是否创建成功
 */
export async function createClaim(planId, seatIndex, oddrtyId) {
    const db = getDB()
    if (!db) return false

    try {
        await db.collection(CLAIMS_COLLECTION).add({
            data: {
                planId: planId,
                seatIndex: seatIndex,
                oddrtyId: oddrtyId,
                claimTime: db.serverDate()
            }
        })
        console.log('领取记录创建成功:', planId, seatIndex)
        return true
    } catch (err) {
        console.error('创建领取记录失败:', err)
        return false
    }
}

