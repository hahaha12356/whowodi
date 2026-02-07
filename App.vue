<script>
import { cleanExpiredData } from '@/utils/storage.js'

export default {

  onLaunch: function() {
    console.log('App Launch')

    // 初始化云开发环境
    // 使用 try-catch 包裹以防止在某些异常环境下（如模拟器崩溃）导致应用启动失败
    try {
      if (typeof wx !== 'undefined' && wx.cloud) {
        wx.cloud.init({
          env: 'product01-whowodi-3ea0iy84a7cf58',
          traceUser: true,
        })
        console.log('云开发初始化成功')
      } else {
        console.warn('当前环境不支持 wx.cloud，无法使用云开发能力')
      }
    } catch (e) {
      console.error('云开发初始化失败:', e)
    }

    // 清理过期数据
    this.cleanExpiredData()
  },
  onShow: function() {
    console.log('App Show')
  },
  onHide: function() {
    console.log('App Hide')
  },
  methods: {
    // 清理过期数据
    async cleanExpiredData() {
      try {
        await cleanExpiredData()
      } catch (error) {
        console.error('清理过期数据失败:', error)
      }
    }
  }
}
</script>

<style lang="scss">
@import '@/styles/common.scss';

/* 全局样式重置 */
page {
  background-color: #F5F7FA;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
}

/* 去除按钮默认样式 */
button {
  margin: 0;
  padding: 0;
  line-height: normal;
  background: none;
  border: none;
  outline: none;
}

button::after {
  border: none;
}

/* 滚动条样式优化 */
::-webkit-scrollbar {
  width: 0;
  height: 0;
}
</style>
