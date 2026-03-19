/**
 * 无法官模式专门的云数据库操作工具
 */

const COLLECTION = 'no_judge_rooms'

function getDB() {
  if (!wx.cloud) return null
  return wx.cloud.database()
}

/**
 * 监听房间数据变化
 * @param {string} roomId 
 * @param {Function} onChange 回调函数
 * @param {Function} onError 错误回调
 */
export function watchRoom(roomId, onChange, onError) {
  const db = getDB()
  if (!db) return null
  
  return db.collection(COLLECTION).where({ roomId }).watch({
    onChange: function(snapshot) {
      if (snapshot.docs && snapshot.docs.length > 0) {
        onChange(snapshot.docs[0])
      }
    },
    onError: function(err) {
      console.error('watchRoom error', err)
      if (onError) onError(err)
    }
  })
}

/**
 * 获取房间数据 (单次)
 */
export async function getRoom(roomId) {
  const db = getDB()
  if (!db) return null
  
  const res = await db.collection(COLLECTION).where({ roomId }).get()
  return res.data && res.data.length > 0 ? res.data[0] : null
}

/**
 * 抢占身份/加入游戏
 * @param {string} roomId 
 * @param {string} docId 数据主键 _id
 * @param {string} userId 
 * @param {object} userInfo 附加信息(头像昵称等，可选)
 */
export async function joinGame(roomId, docId, userId) {
  const db = getDB()
  if (!db) return { success: false, reason: 'db not found' }
  const _ = db.command

  try {
    // 先获取当前房间状态
    const room = await getRoom(roomId)
    if (!room) return { success: false, reason: '房间不存在' }
    if (room.status !== 'waiting') return { success: false, reason: '游戏已经开始' }
    
    // 检查是否已加入
    const alreadyJoined = room.players.find(p => p.userId === userId)
    if (alreadyJoined) {
      return { success: true, myPlayer: alreadyJoined }
    }
    
    // 检查是否已满
    if (room.players.length >= room.config.playerCount) {
      return { success: false, reason: '房间已满' }
    }
    
    // 分配一个未使用的角色和号位
    const currentSeats = room.players.map(p => p.seatIndex)
    let nextSeat = room.players.length + 1
    // 从1开始找空位
    for (let i = 1; i <= room.config.playerCount; i++) {
        if (!currentSeats.includes(i)) {
            nextSeat = i
            break
        }
    }
    
    const roleAssign = room.roles[nextSeat - 1] // 因为 roles[] 是按顺序洗牌好的对应数组
    
    const newPlayer = {
      userId,
      seatIndex: nextSeat,
      role: roleAssign.type,
      word: roleAssign.word,
      isOut: false
    }
    
    // 尝试更新
    const res = await db.collection(COLLECTION).doc(docId).update({
      data: {
        players: _.push([newPlayer]),
        updateTime: db.serverDate()
      }
    })
    
    // 如果加入后满员了，自动跳转状态为 speaking
    if (room.players.length + 1 === room.config.playerCount) {
      await db.collection(COLLECTION).doc(docId).update({
        data: {
          status: 'speaking',
          updateTime: db.serverDate()
        }
      })
    }
    
    return { success: true, myPlayer: newPlayer }
  } catch (err) {
    console.error('joinGame failed', err)
    return { success: false, reason: '加入失败' }
  }
}

/**
 * 玩家发言完毕
 * @param {string} docId 
 * @param {number} seatIndex 
 * @param {Array} currentSpeakingFinishedList （用于检查并发覆盖和判定是否要切状态）
 * @param {Array} players 
 */
export async function finishSpeaking(docId, seatIndex, currentRoomObj) {
  const db = getDB()
  if (!db) return false
  const _ = db.command
  
  if (currentRoomObj.speakingFinishedList.includes(seatIndex)) return true // 已发言
  
  try {
    const newList = [...currentRoomObj.speakingFinishedList, seatIndex]
    
    const alivePlayersCount = currentRoomObj.players.filter(p => !p.isOut).length
    
    let nextStatus = 'speaking'
    if (newList.length >= alivePlayersCount) {
      nextStatus = 'voting' // 所有人发完言，切到投票
    }
    
    await db.collection(COLLECTION).doc(docId).update({
      data: {
        speakingFinishedList: _.addToSet(seatIndex),
        status: nextStatus,
        updateTime: db.serverDate()
      }
    })
    return true
  } catch(e) {
    console.error(e)
    return false
  }
}

/**
 * 提交投票
 * @param {string} docId
 * @param {number} voterSeat
 * @param {number|'abstain'} votedSeat
 * @param {object} currentRoomObj
 */
export async function submitVote(docId, voterSeat, votedSeat, currentRoomObj) {
  const db = getDB()
  if (!db) return false
  const _ = db.command
  
  try {
    const updateKey = `votes.${voterSeat}`
    await db.collection(COLLECTION).doc(docId).update({
      data: {
        [updateKey]: votedSeat,
        updateTime: db.serverDate()
      }
    })
    return true
  } catch(e) {
    console.error(e)
    return false
  }
}

/**
 * 结算投票/更新轮次状态 (只由检测到所有人都投票后前端发起，为了防止多端并发，可以用云函数或依赖第一个触发者)
 * 由于纯前端开发可能无法防并发修改，我们用 docId 和前置检查简化处理
 */
export async function syncGameState(docId, updateData) {
  const db = getDB()
  if (!db) return false
  const _ = db.command

  try {
    const finalData = { ...updateData }
    finalData.updateTime = db.serverDate()
    
    // 如果 updateData 中包含 votes 且是空对象，强制使用 _.set({}) 以确保在云端完全覆盖旧的 Key
    if (finalData.votes && Object.keys(finalData.votes).length === 0) {
      finalData.votes = _.set({})
    }

    await db.collection(COLLECTION).doc(docId).update({
      data: finalData
    })
    return true
  } catch(e) {
    console.error(e)
    return false
  }
}
