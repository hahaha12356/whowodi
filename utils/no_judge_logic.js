/**
 * 判断游戏是否结束，以及结算赢家
 * @param {object} roomData 房间完整数据
 * @returns {object|null} 返回 { winner: 'impostor' | 'civilian', reason: string } 或者 null 如果未结束
 */
export function checkWinCondition(roomData) {
  const { players, config } = roomData
  
  let impostorsAlive = 0
  let civiliansAlive = 0
  let blanksAlive = 0
  
  players.forEach(p => {
    if (!p.isOut) {
      if (p.role === 'impostor') impostorsAlive++
      else if (p.role === 'civilian') civiliansAlive++
      else if (p.role === 'blank') blanksAlive++
    }
  })
  
  const totalGoodAlive = civiliansAlive + blanksAlive
  const totalAlive = impostorsAlive + totalGoodAlive
  
  // 规则1：平民胜利条件
  // 剩余卧底人数 == 0 (只要卧底全部出局，平民立即获胜，无论白板是否还在)
  if (impostorsAlive === 0) {
    return { winner: 'civilian', reason: '所有卧底已被淘汰，平民胜利！' }
  }
  
  // 规则2：卧底及白板胜利条件
  // 剩余卧底人数 + 剩余白板人数 >= 剩余平民人数
  // (当非平民阵营的数量大于或等于平民数量时，平民已失去投票优势，判定卧底获胜)
  if ((impostorsAlive + blanksAlive) >= civiliansAlive) {
    return { winner: 'impostor', reason: '卧底与白板人数占优，卧底获胜！' }
  }
  
  return null // 游戏继续
}

/**
 * 统计投票结果
 * @param {object} votes 投票数据 { voterSeat: votedSeat }
 * @param {Array} tiedPlayers 当期平票玩家的席位（如果是二次PK投票的话）
 * @returns {object} { eliminatedSeat, isTie, tiedSeats, maxVotes }
 */
export function countVotes(votes, tiedPlayers = []) {
  const counts = {} // { seatIndex: count }
  
  Object.values(votes).forEach(votedSeat => {
    if (votedSeat !== 'abstain' && votedSeat !== null) {
      counts[votedSeat] = (counts[votedSeat] || 0) + 1
    }
  })
  
  if (Object.keys(counts).length === 0) {
    return { eliminatedSeat: null, isTie: true, tiedSeats: tiedPlayers, maxVotes: 0 }
  }
  
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const maxVotes = sorted[0][1]
  const topCandidates = sorted.filter(item => item[1] === maxVotes)
  
  if (topCandidates.length > 1) {
    // 平票
    return {
      eliminatedSeat: null,
      isTie: true,
      tiedSeats: topCandidates.map(c => Number(c[0])),
      maxVotes
    }
  } else {
    // 有一个人票数最高
    return {
      eliminatedSeat: Number(topCandidates[0][0]),
      isTie: false,
      tiedSeats: [],
      maxVotes
    }
  }
}
