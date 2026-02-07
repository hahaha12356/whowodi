# 词语分配助手 - 开发说明文档

## 项目概述

这是一个基于uni-app框架开发的微信小程序，用于聚会活动中的词语随机分配。项目采用纯前端方案，无需后端服务器，所有数据存储在用户本地。

### 技术栈
- **框架**: uni-app (Vue 3)
- **平台**: 微信小程序
- **存储**: uni.storage API
- **样式**: SCSS

### 核心功能
1. ✅ 快速配置生成（选择人数，自动推荐配置）
2. ✅ 自定义配置（手动调整A/B/C类人数、选择词库）
3. ✅ 随机分配算法（Fisher-Yates洗牌算法）
4. ✅ 方案生成与分享
5. ✅ 参与者查看词语（带倒计时保护）
6. ✅ 历史方案记录管理
7. ✅ 自动过期清理（24小时）

## 项目结构

```
whowodi/
├── pages/                          # 页面目录
│   ├── index/                      # 首页-方案配置
│   │   └── index.vue
│   ├── result/                     # 方案结果页
│   │   └── result.vue
│   ├── view/                       # 参与者查看页
│   │   └── view.vue
│   └── history/                    # 历史记录页
│       └── history.vue
│
├── components/                     # 组件目录
│   ├── common/                     # 通用组件
│   │   ├── custom-button/          # 自定义按钮
│   │   ├── number-stepper/         # 数字步进器
│   │   └── tips-card/              # 提示卡片
│   └── business/                   # 业务组件
│       └── word-card/              # 词语卡片
│
├── utils/                          # 工具函数
│   ├── constants.js                # 常量定义
│   ├── algorithm.js                # 随机分配算法
│   ├── storage.js                  # 本地存储
│   ├── validator.js                # 数据校验
│   ├── formatter.js                # 格式化工具
│   └── ui.js                       # UI交互工具
│
├── styles/                         # 全局样式
│   ├── variables.scss              # 变量定义
│   ├── mixins.scss                 # 混入
│   └── common.scss                 # 公共样式
│
├── static/                         # 静态资源
│   └── data/                       # 静态数据
│       └── wordLibrary.js          # 词库文件
│
├── App.vue                         # 应用入口
├── main.js                         # 主入口文件
├── manifest.json                   # 应用配置
├── pages.json                      # 页面配置
└── uni.scss                        # uni-app全局样式变量
```

## 关键实现说明

### 1. 随机分配算法

使用**Fisher-Yates洗牌算法**确保公平性：

```javascript
function shuffleArray(array) {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}
```

**特点**:
- 每个位置被分配的概率相等
- 真随机，无偏向性
- 时间复杂度O(n)

### 2. 方案ID生成

4位随机字符（去除易混淆字符）：

```javascript
function generatePlanId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let id = ''
  for (let i = 0; i < 4; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return id
}
```

**优势**:
- 避免I、O等易混淆字母
- 避免数字0、1
- 易于口头传达

### 3. 本地存储方案

使用uni.storage API实现数据持久化：

**存储结构**:
```javascript
{
  'word_plans': [...],          // 所有活跃方案
  'word_history': [...],        // 历史记录
  'userId': 'user_xxx',         // 用户唯一标识
  'view_planId_userId': {...}   // 查看记录
}
```

**自动过期机制**:
- 方案创建时间 > 24小时自动删除
- 每次启动应用时清理过期数据

### 4. 查看保护机制

参与者查看词语时的保护流程：

1. **倒计时保护**: 3秒倒计时，提醒检查周围环境
2. **唯一用户ID**: 每个用户生成唯一ID，防止重复领取
3. **查看状态记录**: 记录已查看的用户，支持再次查看
4. **查看进度统计**: 实时更新已查看人数

### 5. 词库设计

**5个预置词库**:
- 📚 经典词库 (100组) - 生活用品、食物、动物等
- 🎭 文化词库 (80组) - 历史人物、成语、传统节日
- 🎮 现代词库 (80组) - 社交平台、电子产品、职业
- 📖 成语词库 (60组) - 四字成语
- 🏠 生活词库 (60组) - 家居用品、厨房用品

**词组数据结构**:
```javascript
{
  id: 'wp_001',
  wordA: '眼镜',
  wordB: '墨镜',
  difficulty: 'easy',      // easy/medium/hard
  similarity: 70,          // 相似度 0-100
  tags: ['生活用品']
}
```

## 微信小程序合规要点

### 1. 类目选择
- **一级类目**: 工具
- **二级类目**: 计算器
- **理由**: 纯计算工具，不涉及游戏玩法

### 2. 文案合规
- ❌ 避免: "游戏"、"玩耍"、"对战"、"游戏模式"
- ✅ 使用: "工具"、"分配"、"方案"、"配置"

### 3. 功能说明
定位为**词语分配计算工具**，而非游戏：
- 核心功能是计算和分配
- 无胜负判定机制
- 无积分奖励系统

### 4. 隐私政策
- 仅收集用户OpenID用于分配
- 所有数据本地存储
- 24小时自动清除
- 无用户信息上传

## 开发注意事项

### 1. Vue 3 兼容性
项目使用Vue 3语法，注意：
- 使用Composition API或Options API
- 避免Vue 2特有语法
- 组件props定义需要明确type

### 2. uni-app API使用
```javascript
// 正确
uni.setStorageSync(key, value)

// 错误
localStorage.setItem(key, value)
```

### 3. 样式单位
- 使用rpx响应式单位
- 设计稿宽度通常为750rpx
- 避免使用px固定单位

### 4. 生命周期
```javascript
onLoad(options) { }   // 页面加载
onShow() { }          // 页面显示
onPullDownRefresh() { // 下拉刷新
  uni.stopPullDownRefresh()
}
```

### 5. 分享配置
```javascript
onShareAppMessage() {
  return {
    title: '词语分配方案',
    path: '/pages/view/view?planId=xxx'
  }
}
```

### 6. 错误处理
- 所有异步操作使用try-catch
- 用户友好的错误提示
- 避免直接console.error暴露

## 性能优化

### 1. 图片优化
- 使用适当尺寸的图片
- 压缩图片资源
- 使用webp格式

### 2. 数据缓存
- 词库数据预加载
- 避免重复读取storage
- 合理使用computed

### 3. 代码分割
- 页面级分割
- 组件按需加载
- 避免单个文件过大

### 4. 渲染优化
- 合理使用v-show vs v-if
- 避免深层嵌套
- 使用key优化列表

## 测试清单

### 功能测试
- [ ] 快速生成流程
- [ ] 自定义配置流程
- [ ] 边界值测试（3人、20人）
- [ ] 配置校验（非法配置提示）
- [ ] 方案生成正确性
- [ ] 查看流程完整测试
- [ ] 重复查看限制
- [ ] 历史记录管理
- [ ] 分享功能
- [ ] 过期自动清理

### 兼容性测试
- [ ] iOS系统测试
- [ ] Android系统测试
- [ ] 不同屏幕尺寸
- [ ] 微信版本兼容性

### 性能测试
- [ ] 首屏加载时间 < 1.5s
- [ ] 方案生成时间 < 500ms
- [ ] 包体积 < 2MB
- [ ] 内存占用 < 50MB

## 部署发布

### 1. 开发环境配置
```bash
# 安装依赖
npm install

# 开发模式（微信小程序）
npm run dev:mp-weixin
```

### 2. 生产构建
```bash
# 构建生产版本
npm run build:mp-weixin
```

### 3. 微信开发者工具
1. 打开微信开发者工具
2. 导入项目：选择 `dist/build/mp-weixin` 目录
3. 配置AppID（测试可使用测试号）
4. 本地调试

### 4. 上传发布
1. 点击"上传"按钮
2. 填写版本号和备注
3. 登录微信公众平台
4. 提交审核
5. 填写审核信息：
   - 功能说明：词语分配计算工具
   - 类目：工具 > 计算器
   - 服务资质：无需

### 5. 审核要点
- 确保无"游戏"相关文案
- 隐私政策完整
- 用户协议完善
- 功能与类目匹配

## 常见问题

### Q1: 方案链接失效怎么办？
A: 方案有效期为24小时，超过时间会自动失效。请重新生成新方案。

### Q2: 如何确保分配的公平性？
A: 使用Fisher-Yates洗牌算法，保证每个位置被分配的概率相等。

### Q3: 可以自定义词库吗？
A: 当前版本使用预置词库，后续版本会考虑添加自定义功能。

### Q4: 数据会被保存吗？
A: 所有数据仅保存在本地，24小时后自动清除，不会上传服务器。

### Q5: 支持多少人参与？
A: 支持3-20人，建议6-12人体验最佳。

## 后续优化方向

1. **功能扩展**
   - 自定义词库功能
   - 方案收藏功能
   - 分配规则多样化

2. **体验优化**
   - 动画效果优化
   - 音效反馈
   - 主题切换

3. **性能优化**
   - 虚拟列表优化（历史记录）
   - 图片懒加载
   - 代码分包

4. **数据分析**
   - 使用数据统计（匿名）
   - 热门词库排行
   - 用户反馈收集

## 技术支持

如有问题，请通过以下方式反馈：
- 小程序内反馈功能
- GitHub Issues
- 开发者邮箱

---

**开发完成日期**: 2025-01-21
**版本**: V1.0.0
**框架**: uni-app (Vue 3)
**目标平台**: 微信小程序
