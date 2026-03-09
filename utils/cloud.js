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
 * 原子性尝试创建领取记录（纯客户端方案 - 增强版）
 * 策略：先检查后创建，创建后多次校验，通过时间戳+记录ID决定赢家，输家删除记录并重试
 * @param {string} planId - 方案的4位ID
 * @param {number} seatIndex - 座位编号 (1-based)
 * @param {string} oddrtyId - 用户唯一标识
 * @returns {Promise<{success: boolean, conflict: boolean, myClaimId: string}>}
 */
export async function tryCreateClaimAtomically(planId, seatIndex, oddrtyId) {
    const db = getDB()
    if (!db) return { success: false, conflict: false }

    try {
        // 步骤1: 先查询该座位是否已有我的记录（避免重复创建）
        const myExisting = await db.collection(CLAIMS_COLLECTION)
            .where({
                planId: planId,
                seatIndex: seatIndex,
                oddrtyId: oddrtyId
            })
            .get()

        if (myExisting.data && myExisting.data.length > 0) {
            // 我已经在这个座位了，直接成功
            console.log('已在该座位领取:', planId, seatIndex)
            return { success: true, conflict: false, myClaimId: myExisting.data[0]._id }
        }

        // 步骤2: 检查该座位是否已被其他人占用（关键：在创建前先检查）
        const existingClaims = await db.collection(CLAIMS_COLLECTION)
            .where({
                planId: planId,
                seatIndex: seatIndex
            })
            .get()

        if (existingClaims.data && existingClaims.data.length > 0) {
            // 座位已被占用，直接返回冲突
            console.log('座位已被占用:', planId, seatIndex, '占用者:', existingClaims.data[0].oddrtyId)
            return { success: false, conflict: true }
        }

        // 步骤3: 创建新的领取记录（使用服务器时间戳 + 客户端随机数）
        // 添加随机数是为了在极端并发情况下增加唯一性
        const randomSuffix = Math.random().toString(36).substring(2, 10)
        const createResult = await db.collection(CLAIMS_COLLECTION).add({
            data: {
                planId: planId,
                seatIndex: seatIndex,
                oddrtyId: oddrtyId,
                claimTime: db.serverDate(),  // 关键：使用服务器时间
                randomId: randomSuffix       // 辅助唯一性标识
            }
        })

        if (!createResult._id) {
            console.error('创建记录失败:', createResult)
            return { success: false, conflict: false }
        }

        const myClaimId = createResult._id
        console.log('创建领取记录:', planId, seatIndex, 'claimId:', myClaimId)

        // 步骤4: 等待足够时间确保数据库同步完成
        // 增加到200ms，给数据库足够的时间同步和索引
        await new Promise(resolve => setTimeout(resolve, 200))

        // 步骤5: 多次查询验证，确保结果稳定（增加验证次数）
        let allClaims = null
        let lastCount = 0
        let stableCheck = 0
        const maxRetries = 4  // 增加验证次数

        for (let i = 0; i < maxRetries; i++) {
            allClaims = await db.collection(CLAIMS_COLLECTION)
                .where({
                    planId: planId,
                    seatIndex: seatIndex
                })
                .orderBy('claimTime', 'asc')
                .orderBy('_id', 'asc')  // ⭐ 增加二级排序：按记录ID
                .get()

            const currentCount = allClaims.data.length
            console.log(`验证第${i + 1}次: 座位${seatIndex}有${currentCount}条记录`)

            // 连续查询结果一致才算稳定
            if (i > 0 && currentCount === lastCount) {
                stableCheck++
            } else {
                stableCheck = 0  // 重置稳定计数
            }

            lastCount = currentCount

            // 需要连续2次查询结果一致才算稳定
            if (stableCheck >= 2) {
                console.log('查询结果已稳定')
                break
            }

            // 每次查询之间等待60ms（增加等待时间）
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, 60))
            }
        }

        // 步骤6: 判断是否冲突
        if (!allClaims || allClaims.data.length === 0) {
            // 异常情况：我刚才创建的记录不见了
            console.warn('创建的记录丢失，重试')
            return { success: false, conflict: false }
        }

        if (allClaims.data.length === 1) {
            // 只有我一个人的记录，成功
            console.log('领取记录创建成功:', planId, seatIndex)
            return { success: true, conflict: false, myClaimId }
        }

        // 步骤7: 有多个人抢了同一个座位，使用更强的方式决定赢家
        // 优先级：1. claimTime（时间戳） 2. _id（记录ID的字典序）
        // 已按 claimTime 和 _id 排序，第一个是赢家
        console.log('检测到并发冲突，座位', seatIndex, '有', allClaims.data.length, '条记录')

        // 打印所有竞争者信息（用于调试）
        allClaims.data.forEach((claim, idx) => {
            console.log(`竞争者${idx + 1}:`, {
                oddrtyId: claim.oddrtyId,
                _id: claim._id,
                claimTime: claim.claimTime
            })
        })

        const winner = allClaims.data[0]
        const amIWinner = (winner._id === myClaimId)

        if (amIWinner) {
            // 我是赢家，保留记录
            console.log('✅ 我是赢家，成功领取:', planId, seatIndex, '总冲突人数:', allClaims.data.length)

            // 清理其他输家的记录（可选，帮助清理数据库）
            const losers = allClaims.data.slice(1)
            if (losers.length > 0) {
                console.log('清理', losers.length, '条输家记录')
                for (const loser of losers) {
                    try {
                        await db.collection(CLAIMS_COLLECTION).doc(loser._id).remove()
                    } catch (err) {
                        console.error('清理输家记录失败:', err)
                    }
                }
            }

            return { success: true, conflict: false, myClaimId }
        } else {
            // 我是输家，删除我的记录并返回冲突
            console.warn('❌ 我是输家，删除记录并重试:', planId, seatIndex, '赢家ID:', winner._id)

            try {
                await db.collection(CLAIMS_COLLECTION).doc(myClaimId).remove()
                console.log('成功删除输家记录:', myClaimId)
            } catch (deleteErr) {
                console.error('删除记录失败:', deleteErr)
                // 即使删除失败也返回冲突，让上层重试
            }

            return { success: false, conflict: true }
        }
    } catch (err) {
        console.error('创建领取记录失败:', err)
        return { success: false, conflict: false }
    }
}

