<template>
  <view class="page">
    <view class="status-bar"></view>

    <!-- 顶部状态栏 -->
    <view class="header-card" v-if="room">
      <view class="room-info">
        <text class="room-id">房间号: {{ room.roomId }}</text>
        <view class="status-badge" :class="room.status">
          <text>{{ statusText }}</text>
        </view>
      </view>
      <text class="game-info">总计 {{ room.config.playerCount }}人 · 卧底 {{ room.config.impostorCount }}人</text>
    </view>

    <view v-if="!room" class="loading-state">
      <text>加载房间中...</text>
    </view>
    
    <view v-else class="content-wrapper">
      
      <!-- myPlayer 信息面板 -->
      <view class="my-card" v-if="myPlayer">
        <view class="my-card-header">
          <text class="my-seat">号位: {{ myPlayer.seatIndex }}号</text>
          <view class="my-role-badge" :class="myPlayer.role">
            <text>{{ myPlayer.role === 'impostor' ? '卧底' : (myPlayer.role === 'blank' ? '白板' : '平民') }}</text>
          </view>
        </view>
        <view class="my-word-box">
          <text class="my-word-label">你的词语</text>
          <text class="my-word">{{ myPlayer.word }}</text>
        </view>
      </view>

      <!-- Waiting State: 等待玩家加入 -->
      <view class="state-panel" v-if="room.status === 'waiting'">
        <text class="panel-title">等待玩家加入 ({{ room.players.length }}/{{ room.config.playerCount }})</text>
        <view class="player-grid">
          <view class="player-slot" v-for="i in room.config.playerCount" :key="i">
            <template v-if="getPlayerAtSeat(i)">
              <view class="slot-avatar joined">
                <text>{{i}}</text>
              </view>
              <text class="slot-name">已领取</text>
            </template>
            <template v-else>
              <view class="slot-avatar empty">?</view>
              <text class="slot-name">待领取</text>
            </template>
          </view>
        </view>
        
        <button class="action-btn join-btn" v-if="!myPlayer" @tap="handleJoin">发牌给自己 (领取身份)</button>
        <button class="action-btn share-btn" open-type="share">分享给好友</button>
      </view>

      <!-- Speaking State: 发言阶段 -->
      <view class="state-panel" v-if="room.status === 'speaking'">
        <text class="panel-title">第 {{ room.currentRound }} 轮发言</text>
        
        <view class="speaking-list">
          <view v-for="p in alivePlayers" :key="p.seatIndex" class="speak-item">
            <view class="speak-seat" :class="{ 'has-spoken': room.speakingFinishedList.includes(p.seatIndex) }">
              <text>{{ p.seatIndex }}号</text>
            </view>
            <text class="speak-status">
              {{ room.speakingFinishedList.includes(p.seatIndex) ? '已发言' : '思考中...' }}
            </text>
          </view>
        </view>
        
        <view class="action-container" v-if="myPlayer && !myPlayer.isOut">
          <button class="action-btn finish-speak-btn" 
            v-if="!room.speakingFinishedList.includes(myPlayer.seatIndex)"
            @tap="handleFinishSpeaking">
            发言结束
          </button>
          <text class="waiting-text" v-else>等待其他人发言...</text>
        </view>
        <text class="out-text" v-if="myPlayer && myPlayer.isOut">您已淘汰，请旁观</text>
      </view>

      <!-- Voting State: 投票阶段 -->
      <view class="state-panel" v-if="room.status === 'voting'">
        <text class="panel-title" v-if="room.voteType === 'normal'">第 {{ room.currentRound }} 轮投票</text>
        <text class="panel-title alert" v-else>平票重投（只投平票玩家）</text>
        
        <view class="vote-progress" v-if="Object.keys(room.votes).length > 0">
          <text>已投票: {{ Object.keys(room.votes).length }} / {{ alivePlayers.length }}</text>
        </view>
        
        <view v-if="myPlayer && !myPlayer.isOut">
          <!-- 核心判断：这里增加对votes对象存在的检查，且如果是重投阶段，老投票必然被清空 -->
          <view v-if="room.votes && room.votes[myPlayer.seatIndex] !== undefined && room.votes[myPlayer.seatIndex] !== null">
            <text class="waiting-text">您已投票，等待结果...</text>
          </view>
          <view v-else class="vote-options">
            <text class="vote-instruction">请选择你要投出的号码：</text>
            <radio-group @change="onVoteChange">
              <label class="vote-label" v-for="p in selectableVoteTargets" :key="p.seatIndex">
                <radio :value="String(p.seatIndex)" color="#0D6E6E" />
                <text>{{ p.seatIndex }}号</text>
              </label>
              <label class="vote-label">
                <radio value="abstain" color="#0D6E6E" />
                <text>弃权</text>
              </label>
            </radio-group>
            <button class="action-btn vote-btn" @tap="handleVote">确认投票</button>
          </view>
        </view>
        <text class="out-text" v-if="myPlayer && myPlayer.isOut">您已淘汰，请旁观</text>
      </view>

      <!-- Game Over State: 游戏结束 -->
      <view class="state-panel" v-if="room.status === 'game_over'">
        <view class="winner-box" :class="room.winner">
          <text class="winner-title">{{ room.winner === 'civilian' ? '平民群体胜利！' : '卧底胜利！' }}</text>
        </view>
        
        <view class="identity-reveal">
          <text class="reveal-title">身份核对</text>
          <view class="reveal-list">
            <view class="reveal-item" v-for="p in room.players" :key="p.seatIndex">
              <text>{{ p.seatIndex }}号：</text>
              <text :class="p.role">{{ p.role === 'impostor' ? '卧底' : (p.role === 'blank' ? '白板' : '平民') }} ({{p.word}})</text>
              <text v-if="p.isOut" class="out-mark">已淘汰</text>
            </view>
          </view>
        </view>
        
        <button class="action-btn restart-btn" @tap="goToHome">再来一局</button>
      </view>
      
    </view>
  </view>
</template>

<script>
import { watchRoom, joinGame, submitVote, syncGameState } from '@/utils/no_judge_cloud.js'
import { checkWinCondition, countVotes } from '@/utils/no_judge_logic.js'
import { showLoading, hideLoading, showToast } from '@/utils/ui.js'

export default {
  data() {
    return {
      docId: '',
      roomId: '',
      userId: '',
      room: null,
      myPlayer: null,
      selectedVote: null,
      watcher: null,
      isProcessingLogic: false, 
      lastProcessedVoteType: '' // 记录上次处理过的投票类型，防止同一轮逻辑重复执行
    }
  },

  computed: {
    statusText() {
      if (!this.room) return ''
      const map = {
        'waiting': '等待加入',
        'speaking': '发言中',
        'voting': '投票中',
        'game_over': '游戏结束'
      }
      return map[this.room.status] || '未知'
    },
    alivePlayers() {
      if (!this.room) return []
      return this.room.players.filter(p => !p.isOut)
    },
    selectableVoteTargets() {
      if (!this.room) return []
      if (this.room.voteType === 'tiebreaker' && this.room.tiedPlayers && this.room.tiedPlayers.length > 0) {
        // 关键点：防御式类型校验，确保 tiedPlayers 与 p.seatIndex 类型一致
        return this.room.players.filter(p => 
          this.room.tiedPlayers.some(tp => String(tp) === String(p.seatIndex))
        )
      }
      // normal
      return this.alivePlayers.filter(p => !this.myPlayer || String(p.seatIndex) !== String(this.myPlayer.seatIndex))
    },
    // 裁判员检查：同一时间只允许一个客户端（号位最小的存活玩家）执行逻辑结算
    isReferee() {
      if (!this.room || !this.room.players) return false
      const alives = [...this.room.players].filter(p => !p.isOut).sort((a, b) => a.seatIndex - b.seatIndex)
      return alives.length > 0 && alives[0].userId === this.userId
    }
  },

  onLoad(options) {
    this.roomId = options.roomId || ''
    this.docId = options._id || ''
    this.userId = uni.getStorageSync('userId')
    if (!this.userId) {
      // 生成匿名 userId 用于测试
      this.userId = 'user_' + Math.random().toString(36).substr(2, 9)
      uni.setStorageSync('userId', this.userId)
    }
    
    if (this.roomId) {
      this.initWatcher()
    }
  },

  onUnload() {
    if (this.watcher) {
      this.watcher.close()
    }
  },

  onShareAppMessage() {
    return {
      title: '谁是卧底-邀请你加入无法官对局',
      path: `/pages/no_judge/room/room?roomId=${this.roomId}&_id=${this.docId}`
    }
  },

  methods: {
    initWatcher() {
      showLoading('连接房间...')
      this.watcher = watchRoom(this.roomId, (roomData) => {
        hideLoading()
        this.room = roomData
        if (roomData.players) {
          const me = roomData.players.find(p => p.userId === this.userId)
          if (me) {
            this.myPlayer = me
          }
        }
        
        // 关键修复：只有当 [状态]、[轮次] 或 [投票类型] 发生实质性变更时，才重置本地选择
        // 这样可以防止：当 A 玩家点击确认投票产生 DB 更新时，B 玩家手机收到监听导致本地已勾选的号码被清空
        const oldPhaseKey = this.room ? `${this.room.status}_${this.room.currentRound}_${this.room.voteType}` : ''
        const newPhaseKey = `${roomData.status}_${roomData.currentRound}_${roomData.voteType}`
        
        this.room = roomData

        if (oldPhaseKey && oldPhaseKey !== newPhaseKey) {
           console.log('检测到阶段变更，重置本地选择:', oldPhaseKey, '->', newPhaseKey)
           this.selectedVote = null
        }

        this.checkGameLogic()
      }, (err) => {
        hideLoading()
        showToast('网络断开，请重进')
      })
    },

    getPlayerAtSeat(seatIndex) {
      if (!this.room || !this.room.players) return null
      return this.room.players.find(p => p.seatIndex === seatIndex)
    },

    async handleJoin() {
      showLoading('获取卡牌...')
      const res = await joinGame(this.roomId, this.docId, this.userId)
      hideLoading()
      if (res.success) {
        this.myPlayer = res.myPlayer
        showToast(`你是 ${this.myPlayer.seatIndex}号`)
      } else {
        showToast(res.reason || '加入失败')
      }
    },

    async handleFinishSpeaking() {
      showLoading('')
      const db = wx.cloud.database()
      const _ = db.command
      
      const newSpeakingList = [...this.room.speakingFinishedList, this.myPlayer.seatIndex]
      const aliveCount = this.alivePlayers.length
      
      let nextStatus = 'speaking'
      const updateData = {
        speakingFinishedList: _.addToSet(this.myPlayer.seatIndex),
        status: nextStatus
      }
      
      if (newSpeakingList.length >= aliveCount) {
        updateData.status = 'voting'
        updateData.voteType = 'normal'
        updateData.votes = {} // 进新轮次时彻底清空
        updateData.tiedPlayers = []
      }
      
      await syncGameState(this.docId, updateData)
      hideLoading()
    },

    onVoteChange(e) {
      this.selectedVote = e.detail.value
    },

    async handleVote() {
      if (!this.selectedVote) {
        showToast('请先选择一个号码')
        return
      }
      showLoading('提交中...')
      
      let votedSeat = this.selectedVote === 'abstain' ? 'abstain' : Number(this.selectedVote)
      await submitVote(this.docId, this.myPlayer.seatIndex, votedSeat, this.room)
      
      this.selectedVote = null
      hideLoading()
    },

    /**
     * 作为客户端观察者，任何一个客户端都可以检查并推进状态
     * 依赖云数据库乐观锁或者先到先得的脏写（因为是小型房间，可接受）
     */
    async checkGameLogic() {
      if (!this.room || this.room.status !== 'voting' || this.isProcessingLogic) return
      
      // 只有裁判员（1号或最小号位存活玩家）负责结算逻辑，防止多人并发导致状态跳屏（如双重平局判定）
      if (!this.isReferee) return

      // 1. 如果在 voting 阶段，检查是否所有活着的人都投了票
      const aliveCount = this.alivePlayers.length
      const voteCount = Object.keys(this.room.votes || {}).length
      
      if (voteCount >= aliveCount && aliveCount > 0) {
        // 增加对当前状态的幂等判断：防止同一轮数据由于不同步被多次处理
        const logicFingerprint = `${this.room.currentRound}_${this.room.voteType}`
        if (this.lastProcessedVoteType === logicFingerprint) return 
        
        this.isProcessingLogic = true
        this.lastProcessedVoteType = logicFingerprint
        
        // 所有人已投票，结算
        const result = countVotes(this.room.votes, this.room.tiedPlayers)
        console.log('投票结算结果:', result, '当前投票类型:', this.room.voteType)
        
        if (result.isTie) {
          // 平局重投
          if (this.room.voteType === 'tiebreaker') {
            console.log('二次重投仍平局，跳过本轮')
            showToast('两次平局，无人出局')
            await syncGameState(this.docId, {
              status: 'speaking',
              currentRound: this.room.currentRound + 1,
              speakingFinishedList: [],
              votes: {},
              tiedPlayers: [],
              voteType: 'normal'
            })
          } else {
            console.log('第一次平票，发起重投')
            showToast(`平票！${result.tiedSeats.join(',')}号重投`)
            const db = wx.cloud.database()
            const _ = db.command
            await syncGameState(this.docId, {
              votes: {}, // 核心：清空数据
              tiedPlayers: result.tiedSeats,
              voteType: 'tiebreaker'
            })
          }
        } else if (result.eliminatedSeat !== null) {
            // 有人被淘汰
            const targetSeat = result.eliminatedSeat
            showToast(`${targetSeat}号被淘汰`)
            
            // 找出这个玩家，把它标记为 out
            const playersClone = JSON.parse(JSON.stringify(this.room.players))
            const pIndex = playersClone.findIndex(p => p.seatIndex === targetSeat)
            if (pIndex !== -1) {
              playersClone[pIndex].isOut = true
            }
            
            // 检查胜利条件
            const mockRoomData = { ...this.room, players: playersClone }
            const winRes = checkWinCondition(mockRoomData)
            
            if (winRes) {
              // 游戏结束
              await syncGameState(this.docId, {
                players: playersClone,
                status: 'game_over',
                winner: winRes.winner
              })
            } else {
              // 游戏继续
              await syncGameState(this.docId, {
                players: playersClone,
                status: 'speaking',
                currentRound: this.room.currentRound + 1,
                speakingFinishedList: [],
                votes: {},
                tiedPlayers: [],
                voteType: 'normal'
              })
            }
          }
        
        // 这里的 timeout 是为了给数据库同步一点时间，防止 watcher 立即再次触发时 isProcessingLogic 已经重置但 DB 还没更
        setTimeout(() => {
          this.isProcessingLogic = false
        }, 800)
      }
    },

    goToHome() {
      uni.reLaunch({
        url: '/pages/index/index'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.page {
  min-height: 100vh;
  background: #FAFAFA;
}

.status-bar { height: 62px; }

.header-card {
  background: #0D6E6E;
  padding: 32rpx 48rpx;
  color: #FFF;
  border-bottom-left-radius: 32rpx;
  border-bottom-right-radius: 32rpx;
  margin-bottom: 32rpx;
  
  .room-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12rpx;
    
    .room-id {
      font-size: 32rpx;
      font-weight: bold;
    }
    
    .status-badge {
      font-size: 24rpx;
      padding: 4rpx 16rpx;
      border-radius: 100rpx;
      background: rgba(255,255,255,0.2);
      
      &.speaking { background: #FF9800; }
      &.voting { background: #E91E63; }
      &.game_over { background: #4CAF50; }
    }
  }
  
  .game-info {
    font-size: 26rpx;
    opacity: 0.8;
  }
}

.content-wrapper {
  padding: 0 48rpx 48rpx;
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.my-card {
  background: #FFF;
  border-radius: 24rpx;
  padding: 32rpx;
  border: 2rpx solid #E5E5E5;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);

  .my-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2rpx solid #F0F0F0;
    padding-bottom: 24rpx;
    margin-bottom: 24rpx;

    .my-seat {
      font-size: 30rpx;
      font-weight: bold;
      color: #333;
    }
    
    .my-role-badge {
      font-size: 26rpx;
      padding: 6rpx 20rpx;
      border-radius: 8rpx;
      
      &.civilian { background: rgba(13, 110, 110, 0.1); color: #0D6E6E; }
      &.impostor { background: rgba(224, 123, 84, 0.1); color: #E07B54; }
      &.blank { background: rgba(0,0,0, 0.05); color: #666; }
    }
  }

  .my-word-box {
    text-align: center;
    .my-word-label { font-size: 24rpx; color: #999; display: block; margin-bottom: 12rpx; }
    .my-word { font-size: 40rpx; font-weight: bold; color: #1A1A1A; }
  }
}

.state-panel {
  background: #FFF;
  border-radius: 24rpx;
  padding: 32rpx;
  border: 2rpx solid #E5E5E5;
  
  .panel-title {
    font-size: 32rpx;
    font-weight: 600;
    display: block;
    margin-bottom: 32rpx;
    text-align: center;
    
    &.alert { color: #E91E63; }
  }
}

// Waiting UI
.player-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 24rpx;
  justify-content: center;
  margin-bottom: 40rpx;

  .player-slot {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100rpx;
    
    .slot-avatar {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32rpx;
      font-weight: bold;
      margin-bottom: 12rpx;
      
      &.empty { background: #F0F0F0; color: #CCC; border: 2rpx dashed #CCC; }
      &.joined { background: #E8F4F4; color: #0D6E6E; border: 2rpx solid #0D6E6E; }
    }
    .slot-name { font-size: 20rpx; color: #666; }
  }
}

// Speaking UI
.speaking-list {
  display: flex;
  flex-wrap: wrap;
  gap: 24rpx;
  margin-bottom: 40rpx;
  
  .speak-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 120rpx;
    
    .speak-seat {
      width: 80rpx;
      height: 80rpx;
      border-radius: 12rpx;
      background: #F0F0F0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 28rpx;
      margin-bottom: 8rpx;
      
      &.has-spoken {
        background: #4CAF50;
        color: #FFF;
      }
    }
    .speak-status { font-size: 22rpx; color: #666; }
  }
}

// Voting UI
.vote-progress { text-align: center; margin-bottom: 24rpx; font-size: 26rpx; color: #666; }
.vote-instruction { font-size: 28rpx; color: #333; margin-bottom: 24rpx; display: block; }
.vote-label { display: block; padding: 20rpx 0; border-bottom: 1rpx solid #F0F0F0; font-size: 30rpx; radio { transform: scale(0.8); margin-right: 12rpx; } }

// Game Over UI
.winner-box {
  padding: 40rpx 0;
  text-align: center;
  border-radius: 16rpx;
  margin-bottom: 32rpx;
  
  &.civilian { background: #E8F4F4; color: #0D6E6E; }
  &.impostor { background: rgba(224, 123, 84, 0.1); color: #E07B54; }
  
  .winner-title { font-size: 40rpx; font-weight: bold; }
}

.reveal-list {
  .reveal-item {
    display: flex;
    padding: 16rpx 0;
    border-bottom: 1px solid #F0F0F0;
    font-size: 28rpx;
    
    .civilian { color: #0D6E6E; }
    .impostor { color: #E07B54; font-weight: bold; }
    .blank { color: #666; }
    
    .out-mark {
      margin-left: auto;
      font-size: 24rpx;
      color: #999;
      background: #F0F0F0;
      padding: 4rpx 12rpx;
      border-radius: 8rpx;
    }
  }
}

// Common Buttons
.action-btn {
  height: 96rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 24rpx;
  
  &::after { border: none; }
  
  &.join-btn, &.finish-speak-btn, &.vote-btn { background: #0D6E6E; color: #FFF; }
  &.share-btn { background: #F0F0F0; color: #333; }
  &.restart-btn { background: #1A1A1A; color: #FFF; margin-top: 32rpx; }
  
  &[disabled] { opacity: 0.5; }
}

.waiting-text, .out-text {
  text-align: center;
  display: block;
  font-size: 28rpx;
  color: #999;
  padding: 32rpx 0;
}
.out-text { color: #E91E63; }

</style>
