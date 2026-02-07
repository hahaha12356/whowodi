
# 「词语分配助手」微信小程序详细设计说明书

**版本**: V1.0  
**日期**: 2025-01-20  
**技术栈**: uni-app + 纯前端方案  
**目标平台**: 微信小程序

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术架构设计](#2-技术架构设计)
3. [项目结构设计](#3-项目结构设计)
4. [数据结构设计](#4-数据结构设计)
5. [页面设计详细说明](#5-页面设计详细说明)
6. [核心功能实现](#6-核心功能实现)
7. [词库设计与实现](#7-词库设计与实现)
8. [本地存储方案](#8-本地存储方案)
9. [组件设计](#9-组件设计)
10. [工具函数库](#10-工具函数库)
11. [样式规范](#11-样式规范)
12. [性能优化](#12-性能优化)
13. [开发规范](#13-开发规范)
14. [测试方案](#14-测试方案)
15. [部署发布](#15-部署发布)

---

## 1. 项目概述

### 1.1 项目定位
词语分配计算工具，用于聚会活动的词语随机分配，纯前端实现，无需后端服务。

### 1.2 核心功能
- 方案配置（人数、类型、词库）
- 随机分配算法
- 方案生成与分享
- 参与者查看词语
- 历史方案记录

### 1.3 技术选型理由
- **uni-app**: 跨平台能力，后续可扩展到H5、其他小程序
- **纯前端**: 降低成本，无需服务器维护
- **本地存储**: 使用uni.storage API存储方案数据

---

## 2. 技术架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────┐
│          前端应用层 (uni-app)          │
├─────────────────────────────────────┤
│  页面层    │ 配置页 │ 方案页 │ 查看页  │
├─────────────────────────────────────┤
│  组件层    │ 通用组件 │ 业务组件       │
├─────────────────────────────────────┤
│  逻辑层    │ Store │ Utils │ API     │
├─────────────────────────────────────┤
│  数据层    │ 静态词库 │ 本地存储       │
└─────────────────────────────────────┘
```

### 2.2 数据流设计

```
用户操作 → 页面事件 → 逻辑处理 → 数据更新 → 视图渲染
                      ↓
                   本地存储
```

---

## 3. 项目结构设计

### 3.1 完整目录结构

```
word-assignment-tool/
├── pages/                          # 页面目录
│   ├── index/                      # 首页-方案配置
│   │   ├── index.vue
│   │   └── index.scss
│   ├── result/                     # 方案结果页
│   │   ├── result.vue
│   │   └── result.scss
│   ├── view/                       # 参与者查看页
│   │   ├── view.vue
│   │   └── view.scss
│   └── history/                    # 历史记录页
│       ├── history.vue
│       └── history.scss
│
├── components/                     # 组件目录
│   ├── common/                     # 通用组件
│   │   ├── custom-button/          # 自定义按钮
│   │   │   ├── custom-button.vue
│   │   │   └── custom-button.scss
│   │   ├── number-stepper/         # 数字步进器
│   │   │   ├── number-stepper.vue
│   │   │   └── number-stepper.scss
│   │   └── tips-card/              # 提示卡片
│   │       ├── tips-card.vue
│   │       └── tips-card.scss
│   │
│   └── business/                   # 业务组件
│       ├── word-card/              # 词语卡片
│       │   ├── word-card.vue
│       │   └── word-card.scss
│       ├── share-card/             # 分享卡片
│       │   ├── share-card.vue
│       │   └── share-card.scss
│       └── config-panel/           # 配置面板
│           ├── config-panel.vue
│           └── config-panel.scss
│
├── static/                         # 静态资源
│   ├── data/                       # 静态数据
│   │   └── wordLibrary.js          # 词库文件
│   ├── images/                     # 图片资源
│   │   ├── icons/                  # 图标
│   │   └── bg/                     # 背景图
│   └── fonts/                      # 字体文件
│
├── store/                          # 状态管理
│   ├── index.js                    # store入口
│   └── modules/                    # 模块
│       ├── plan.js                 # 方案状态
│       └── config.js               # 配置状态
│
├── utils/                          # 工具函数
│   ├── storage.js                  # 存储工具
│   ├── algorithm.js                # 算法工具
│   ├── validator.js                # 校验工具
│   ├── formatter.js                # 格式化工具
│   └── constants.js                # 常量定义
│
├── styles/                         # 全局样式
│   ├── variables.scss              # 变量定义
│   ├── mixins.scss                 # 混入
│   └── common.scss                 # 公共样式
│
├── App.vue                         # 应用入口
├── main.js                         # 主入口文件
├── manifest.json                   # 应用配置
├── pages.json                      # 页面配置
└── uni.scss                        # uni-app全局样式变量
```

### 3.2 关键文件说明

| 文件 | 作用 | 重要性 |
|------|------|--------|
| pages.json | 页面路由配置、导航栏配置 | ★★★★★ |
| manifest.json | 小程序AppID、权限配置 | ★★★★★ |
| static/data/wordLibrary.js | 核心词库数据 | ★★★★★ |
| utils/algorithm.js | 随机分配算法 | ★★★★★ |
| utils/storage.js | 本地存储封装 | ★★★★ |

---

## 4. 数据结构设计

### 4.1 方案配置数据结构

```javascript
// ConfigModel
const configModel = {
  totalCount: 6,           // 总人数 (3-20)
  typeACount: 5,           // A类词语数量
  typeBCount: 1,           // B类词语数量
  typeCCount: 0,           // C类(无词)数量
  categoryId: 'classic',   // 词库分类ID
  timestamp: 1642723560000 // 创建时间戳
}
```

**字段校验规则**:
```javascript
{
  totalCount: {
    type: Number,
    min: 3,
    max: 20,
    required: true
  },
  typeACount: {
    type: Number,
    min: 1,
    validate: (val, data) => val + data.typeBCount + data.typeCCount === data.totalCount
  },
  typeBCount: {
    type: Number,
    min: 0,
    max: (data) => Math.floor(data.totalCount / 3) // 不超过总数的1/3
  },
  typeCCount: {
    type: Number,
    min: 0,
    max: 2 // 最多2个
  }
}
```

### 4.2 词组数据结构

```javascript
// WordPair
const wordPair = {
  id: 'wp_001',              // 词组唯一ID
  wordA: '董永',             // A类词语
  wordB: '许仙',             // B类词语
  categoryId: 'classic',     // 所属分类
  difficulty: 'medium',      // 难度: easy/medium/hard
  similarity: 75,            // 相似度 (0-100)
  tags: ['神话', '人物']      // 标签
}
```

### 4.3 方案数据结构

```javascript
// PlanModel
const planModel = {
  planId: 'NK8P',            // 方案编号 (4位随机字符)
  config: configModel,       // 配置信息
  wordPair: wordPair,        // 使用的词组
  assignments: [             // 分配结果
    {
      index: 1,              // 编号
      type: 'A',             // 类型: A/B/C
      word: '董永',          // 词语 (C类为null)
      viewed: false          // 是否已查看
    },
    // ...
  ],
  createTime: 1642723560000, // 创建时间
  viewCount: 0,              // 查看人数
  status: 'active'           // 状态: active/expired
}
```

### 4.4 历史记录数据结构

```javascript
// HistoryModel
const historyModel = {
  planId: 'NK8P',
  wordPair: {
    wordA: '董永',
    wordB: '许仙'
  },
  config: {
    totalCount: 6,
    typeACount: 5,
    typeBCount: 1
  },
  createTime: 1642723560000
}
```

### 4.5 词库分类数据结构

```javascript
// Category
const category = {
  id: 'classic',             // 分类ID
  name: '经典词库',          // 分类名称
  description: '经典常见词组', // 描述
  icon: '📚',                // 图标
  count: 300,                // 词组数量
  enabled: true              // 是否启用
}
```

---

## 5. 页面设计详细说明

### 5.1 首页 - 方案配置页 (pages/index/index.vue)

#### 5.1.1 页面结构

```vue
<template>
  <view class="container">
    <!-- 顶部标题 -->
    <view class="header">
      <text class="title">词语分配助手</text>
      <text class="subtitle">聚会活动词语分配工具</text>
    </view>

    <!-- 快速开始 -->
    <view class="quick-start">
      <text class="section-title">快速开始</text>
      <view class="quick-config">
        <!-- 人数选择 -->
        <view class="people-selector">
          <text class="label">参与总人数</text>
          <view class="number-list">
            <view 
              v-for="num in peopleOptions" 
              :key="num"
              :class="['number-item', { active: quickConfig.totalCount === num }]"
              @tap="selectPeopleCount(num)"
            >
              {{ num }}人
            </view>
          </view>
        </view>

        <!-- 推荐配置显示 -->
        <view class="recommend-config">
          <view class="recommend-label">
            <text class="icon">💡</text>
            <text>系统推荐方案</text>
          </view>
          <view class="config-detail">
            <text>• A类词语：{{ recommendConfig.typeACount }}个</text>
            <text>• B类词语：{{ recommendConfig.typeBCount }}个</text>
            <text v-if="recommendConfig.typeCCount">• C类(无词)：{{ recommendConfig.typeCCount }}个</text>
          </view>
        </view>

        <!-- 生成按钮 -->
        <custom-button 
          type="primary" 
          size="large"
          @click="quickGenerate"
        >
          生成方案
        </custom-button>
      </view>
    </view>

    <!-- 自定义配置 -->
    <view class="custom-config">
      <view class="section-header" @tap="toggleCustom">
        <text class="section-title">自定义配置</text>
        <text class="arrow">{{ showCustom ? '▼' : '▶' }}</text>
      </view>

      <view v-if="showCustom" class="config-content">
        <!-- 基础设置 -->
        <view class="config-group">
          <text class="group-title">基础设置</text>
          
          <!-- 总人数 -->
          <view class="config-item">
            <text class="item-label">参与人数</text>
            <number-stepper 
              :value="customConfig.totalCount"
              :min="3"
              :max="20"
              @change="onTotalCountChange"
            />
          </view>

          <!-- A类数量 -->
          <view class="config-item">
            <text class="item-label">A类词语数量</text>
            <number-stepper 
              :value="customConfig.typeACount"
              :min="1"
              :max="customConfig.totalCount - 1"
              @change="onTypeAChange"
            />
          </view>

          <!-- B类数量 -->
          <view class="config-item">
            <text class="item-label">B类词语数量</text>
            <number-stepper 
              :value="customConfig.typeBCount"
              :min="0"
              :max="maxTypeBCount"
              @change="onTypeBChange"
            />
            <tips-card 
              v-if="customConfig.typeBCount > maxRecommendTypeBCount"
              type="warning"
            >
              B类数量过多可能影响体验
            </tips-card>
          </view>

          <!-- C类数量 -->
          <view class="config-item">
            <text class="item-label">C类(无词)数量</text>
            <number-stepper 
              :value="customConfig.typeCCount"
              :min="0"
              :max="2"
              @change="onTypeCChange"
            />
          </view>
        </view>

        <!-- 词库选择 -->
        <view class="config-group">
          <text class="group-title">词库选择</text>
          <view class="category-list">
            <view 
              v-for="cat in categories" 
              :key="cat.id"
              :class="['category-item', { active: customConfig.categoryId === cat.id }]"
              @tap="selectCategory(cat.id)"
            >
              <text class="cat-icon">{{ cat.icon }}</text>
              <text class="cat-name">{{ cat.name }}</text>
              <text class="cat-count">({{ cat.count }}组)</text>
            </view>
          </view>
        </view>

        <!-- 生成按钮 -->
        <custom-button 
          type="primary" 
          size="large"
          @click="customGenerate"
        >
          生成方案
        </custom-button>
      </view>
    </view>

    <!-- 底部功能区 -->
    <view class="footer">
      <view class="footer-btn" @tap="goHistory">
        <text class="icon">📋</text>
        <text>历史记录</text>
      </view>
      <view class="footer-btn" @tap="goHelp">
        <text class="icon">❓</text>
        <text>使用说明</text>
      </view>
    </view>
  </view>
</template>
```

#### 5.1.2 页面逻辑

```javascript
<script>
import { mapState, mapActions } from 'vuex'
import { getRecommendConfig, validateConfig } from '@/utils/algorithm'
import { showToast, showModal } from '@/utils/ui'

export default {
  data() {
    return {
      // 快速模式配置
      quickConfig: {
        totalCount: 7
      },
      
      // 自定义模式配置
      customConfig: {
        totalCount: 6,
        typeACount: 5,
        typeBCount: 1,
        typeCCount: 0,
        categoryId: 'classic'
      },
      
      // 人数选项
      peopleOptions: [3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20],
      
      // 是否显示自定义配置
      showCustom: false,
      
      // 词库分类
      categories: []
    }
  },
  
  computed: {
    // 推荐配置
    recommendConfig() {
      return getRecommendConfig(this.quickConfig.totalCount)
    },
    
    // B类最大数量
    maxTypeBCount() {
      return Math.floor(this.customConfig.totalCount / 3)
    },
    
    // B类推荐最大数量
    maxRecommendTypeBCount() {
      return Math.ceil(this.customConfig.totalCount * 0.25)
    },
    
    // 剩余可分配人数
    remainingCount() {
      return this.customConfig.totalCount - 
             this.customConfig.typeACount - 
             this.customConfig.typeBCount - 
             this.customConfig.typeCCount
    }
  },
  
  onLoad() {
    this.loadCategories()
  },
  
  methods: {
    // 加载词库分类
    loadCategories() {
      const wordLibrary = require('@/static/data/wordLibrary.js')
      this.categories = wordLibrary.categories
    },
    
    // 选择人数
    selectPeopleCount(num) {
      this.quickConfig.totalCount = num
    },
    
    // 快速生成
    async quickGenerate() {
      try {
        const config = {
          ...this.recommendConfig,
          categoryId: 'random' // 随机词库
        }
        
        await this.generatePlan(config)
      } catch (error) {
        showToast('生成失败，请重试')
      }
    },
    
    // 自定义生成
    async customGenerate() {
      // 校验配置
      const validation = validateConfig(this.customConfig)
      if (!validation.valid) {
        showModal({
          title: '配置错误',
          content: validation.message
        })
        return
      }
      
      try {
        await this.generatePlan(this.customConfig)
      } catch (error) {
        showToast('生成失败，请重试')
      }
    },
    
    // 生成方案
    async generatePlan(config) {
      // 显示加载
      uni.showLoading({ title: '生成中...' })
      
      try {
        // 调用算法生成方案
        const { generatePlan } = require('@/utils/algorithm')
        const plan = generatePlan(config)
        
        // 保存到本地存储
        const { savePlan } = require('@/utils/storage')
        await savePlan(plan)
        
        // 跳转到结果页
        uni.navigateTo({
          url: `/pages/result/result?planId=${plan.planId}`
        })
      } finally {
        uni.hideLoading()
      }
    },
    
    // 总人数改变
    onTotalCountChange(value) {
      this.customConfig.totalCount = value
      this.autoAdjustConfig()
    },
    
    // A类数量改变
    onTypeAChange(value) {
      this.customConfig.typeACount = value
      this.autoAdjustConfig()
    },
    
    // B类数量改变
    onTypeBChange(value) {
      this.customConfig.typeBCount = value
      this.autoAdjustConfig()
    },
    
    // C类数量改变
    onTypeCChange(value) {
      this.customConfig.typeCCount = value
      this.autoAdjustConfig()
    },
    
    // 自动调整配置
    autoAdjustConfig() {
      const total = this.customConfig.totalCount
      const typeB = this.customConfig.typeBCount
      const typeC = this.customConfig.typeCCount
      
      // 自动调整A类数量
      this.customConfig.typeACount = total - typeB - typeC
      
      // 确保A类至少为1
      if (this.customConfig.typeACount < 1) {
        this.customConfig.typeACount = 1
        this.customConfig.typeBCount = total - 1 - typeC
      }
    },
    
    // 选择词库
    selectCategory(categoryId) {
      this.customConfig.categoryId = categoryId
    },
    
    // 切换自定义配置
    toggleCustom() {
      this.showCustom = !this.showCustom
    },
    
    // 去历史记录
    goHistory() {
      uni.navigateTo({
        url: '/pages/history/history'
      })
    },
    
    // 去帮助页面
    goHelp() {
      // TODO: 实现帮助页面
    }
  }
}
</script>
```

#### 5.1.3 页面样式

```scss
<style lang="scss" scoped>
@import '@/styles/variables.scss';

.container {
  min-height: 100vh;
  background: $bg-color;
  padding: 32rpx;
}

.header {
  text-align: center;
  margin-bottom: 60rpx;
  
  .title {
    display: block;
    font-size: 48rpx;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 16rpx;
  }
  
  .subtitle {
    display: block;
    font-size: 28rpx;
    color: $text-secondary;
  }
}

.quick-start {
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx 32rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 32rpx;
}

.people-selector {
  margin-bottom: 32rpx;
  
  .label {
    display: block;
    font-size: 28rpx;
    color: $text-secondary;
    margin-bottom: 16rpx;
  }
  
  .number-list {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
  }
  
  .number-item {
    flex: 0 0 calc((100% - 64rpx) / 5);
    height: 72rpx;
    line-height: 72rpx;
    text-align: center;
    background: $bg-grey;
    border-radius: 12rpx;
    font-size: 28rpx;
    color: $text-primary;
    transition: all 0.3s;
    
    &.active {
      background: $primary-color;
      color: #fff;
      transform: scale(1.05);
    }
  }
}

.recommend-config {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 32rpx;
  
  .recommend-label {
    display: flex;
    align-items: center;
    margin-bottom: 16rpx;
    
    .icon {
      margin-right: 8rpx;
    }
    
    text {
      font-size: 28rpx;
      color: $text-primary;
      font-weight: 500;
    }
  }
  
  .config-detail {
    text {
      display: block;
      font-size: 26rpx;
      color: $text-secondary;
      line-height: 1.8;
    }
  }
}

// ... 更多样式
</style>
```

### 5.2 方案结果页 (pages/result/result.vue)

#### 5.2.1 页面结构

```vue
<template>
  <view class="container">
    <!-- 顶部动画区 -->
    <view class="animation-area">
      <view v-if="showAnimation" class="shuffle-animation">
        <image 
          v-for="(card, index) in animationCards"
          :key="index"
          :class="['card-item', `card-${index}`]"
          src="/static/images/card.png"
          :style="{ animationDelay: `${index * 0.1}s` }"
        />
      </view>
    </view>

    <!-- 方案信息卡片 -->
    <view v-if="!showAnimation" class="plan-card">
      <view class="card-header">
        <text class="header-title">方案已生成</text>
        <text class="plan-id">#{plan.planId}</text>
      </view>

      <view class="card-body">
        <view class="info-row">
          <text class="label">👥 总人数</text>
          <text class="value">{{ plan.config.totalCount }}人</text>
        </view>
        
        <view class="info-row">
          <text class="label">📊 词组</text>
          <text class="value">{{ plan.wordPair.wordA }} / {{ plan.wordPair.wordB }}</text>
        </view>
        
        <view class="info-divider"></view>
        
        <view class="distribution-info">
          <text class="dist-title">分配明细</text>
          <view class="dist-item">
            <text class="dist-label">• A类词语({{ plan.wordPair.wordA }}):</text>
            <text class="dist-value">{{ plan.config.typeACount }}人</text>
          </view>
          <view class="dist-item">
            <text class="dist-label">• B类词语({{ plan.wordPair.wordB }}):</text>
            <text class="dist-value">{{ plan.config.typeBCount }}人</text>
          </view>
          <view v-if="plan.config.typeCCount" class="dist-item">
            <text class="dist-label">• C类(无词):</text>
            <text class="dist-value">{{ plan.config.typeCCount }}人</text>
          </view>
        </view>
        
        <view class="info-divider"></view>
        
        <view class="view-status">
          <text class="status-label">查看进度</text>
          <view class="progress-bar">
            <view 
              class="progress-fill" 
              :style="{ width: `${viewProgress}%` }"
            ></view>
          </view>
          <text class="status-text">{{ plan.viewCount }}/{{ plan.config.totalCount }}人已查看</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="card-footer">
        <custom-button 
          type="primary" 
          size="large"
          @click="shareToWechat"
        >
          <text class="btn-icon">💬</text>
          分享给参与者
        </custom-button>
        
        <view class="footer-actions">
          <view class="action-btn" @tap="copyLink">
            <text class="icon">📋</text>
            <text>复制链接</text>
          </view>
          <view class="action-btn" @tap="regenerate">
            <text class="icon">🔄</text>
            <text>重新生成</text>
          </view>
          <view class="action-btn" @tap="viewDetail">
            <text class="icon">👁</text>
            <text>查看详情</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
```

#### 5.2.2 页面逻辑

```javascript
<script>
export default {
  data() {
    return {
      plan: null,              // 方案数据
      showAnimation: true,     // 是否显示动画
      animationCards: [1,2,3,4,5], // 动画卡片数量
    }
  },
  
  computed: {
    // 查看进度百分比
    viewProgress() {
      if (!this.plan) return 0
      return Math.floor((this.plan.viewCount / this.plan.config.totalCount) * 100)
    }
  },
  
  onLoad(options) {
    const { planId } = options
    this.loadPlan(planId)
    this.playAnimation()
  },
  
  // 下拉刷新
  onPullDownRefresh() {
    this.refreshPlanData()
    setTimeout(() => {
      uni.stopPullDownRefresh()
    }, 1000)
  },
  
  methods: {
    // 加载方案数据
    async loadPlan(planId) {
      const { getPlanById } = require('@/utils/storage')
      this.plan = await getPlanById(planId)
      
      if (!this.plan) {
        uni.showToast({
          title: '方案不存在',
          icon: 'none'
        })
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      }
    },
    
    // 播放动画
    playAnimation() {
      setTimeout(() => {
        this.showAnimation = false
      }, 1500)
    },
    
    // 分享到微信
    shareToWechat() {
      // 生成分享信息
      const shareData = this.generateShareData()
      
      // 微信小程序分享
      uni.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      })
    },
    
    // 生成分享数据
    generateShareData() {
      return {
        title: `词语分配方案 #${this.plan.planId}`,
        path: `/pages/view/view?planId=${this.plan.planId}`,
        imageUrl: '/static/images/share-cover.png'
      }
    },
    
    // 复制链接
    copyLink() {
      const link = `pages/view/view?planId=${this.plan.planId}`
      uni.setClipboardData({
        data: link,
        success: () => {
          uni.showToast({
            title: '已复制链接',
            icon: 'success'
          })
        }
      })
    },
    
    // 重新生成
    regenerate() {
      uni.showModal({
        title: '确认重新生成？',
        content: '重新生成将覆盖当前方案',
        success: (res) => {
          if (res.confirm) {
            this.doRegenerate()
          }
        }
      })
    },
    
    async doRegenerate() {
      uni.showLoading({ title: '生成中...' })
      
      try {
        const { generatePlan } = require('@/utils/algorithm')
        const { savePlan, deletePlan } = require('@/utils/storage')
        
        // 删除旧方案
        await deletePlan(this.plan.planId)
        
        // 生成新方案
        const newPlan = generatePlan(this.plan.config)
        await savePlan(newPlan)
        
        // 更新当前显示
        this.plan = newPlan
        this.showAnimation = true
        this.playAnimation()
        
        uni.showToast({
          title: '重新生成成功',
          icon: 'success'
        })
      } catch (error) {
        uni.showToast({
          title: '生成失败',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
    },
    
    // 查看详情（调试用）
    viewDetail() {
      uni.navigateTo({
        url: `/pages/detail/detail?planId=${this.plan.planId}`
      })
    },
    
    // 刷新方案数据
    async refreshPlanData() {
      await this.loadPlan(this.plan.planId)
    }
  },
  
  // 分享配置
  onShareAppMessage() {
    return this.generateShareData()
  },
  
  onShareTimeline() {
    return {
      title: `词语分配方案 #${this.plan.planId}`,
      query: `planId=${this.plan.planId}`
    }
  }
}
</script>
```

### 5.3 参与者查看页 (pages/view/view.vue)

#### 5.3.1 页面结构

```vue
<template>
  <view class="container">
    <!-- 方案信息 -->
    <view v-if="!showCard" class="plan-info">
      <text class="info-title">词语分配方案</text>
      <text class="plan-id">#{planId}</text>
      
      <view class="info-detail">
        <view class="detail-row">
          <text class="label">总人数:</text>
          <text class="value">{{ plan.config.totalCount }}人</text>
        </view>
        <view class="detail-row">
          <text class="label">已查看:</text>
          <text class="value">{{ plan.viewCount }}/{{ plan.config.totalCount }}人</text>
        </view>
      </view>
      
      <!-- 提示卡片 -->
      <tips-card type="info">
        <text>点击下方按钮查看您的词语</text>
        <text>查看前请确保周围无人偷看</text>
      </tips-card>
      
      <!-- 查看按钮 -->
      <custom-button 
        v-if="!hasViewed"
        type="primary" 
        size="large"
        @click="startView"
      >
        查看我的词语
      </custom-button>
      
      <!-- 已查看提示 -->
      <view v-else class="viewed-tip">
        <text class="tip-icon">✅</text>
        <text class="tip-text">您已查看过词语</text>
        <text class="tip-desc" @tap="viewAgain">忘记了？点击再次查看</text>
      </view>
    </view>

    <!-- 倒计时遮罩 -->
    <view v-if="showCountdown" class="countdown-mask">
      <view class="countdown-content">
        <text class="countdown-tip">请确保周围无人查看</text>
        <text class="countdown-number">{{ countdown }}</text>
      </view>
    </view>

    <!-- 词语卡片 -->
    <view v-if="showCard" class="word-card-wrapper">
      <word-card 
        :assignment="myAssignment"
        @close="closeCard"
      />
    </view>
  </view>
</template>
```

#### 5.3.2 页面逻辑

```javascript
<script>
export default {
  data() {
    return {
      planId: '',              // 方案ID
      plan: null,              // 方案数据
      myAssignment: null,      // 我的分配
      hasViewed: false,        // 是否已查看
      showCountdown: false,    // 显示倒计时
      countdown: 3,            // 倒计时数字
      showCard: false,         // 显示卡片
      userId: ''               // 用户ID
    }
  },
  
  onLoad(options) {
    this.planId = options.planId
    this.userId = this.getUserId()
    this.init()
  },
  
  methods: {
    // 初始化
    async init() {
      await this.loadPlan()
      await this.checkViewStatus()
    },
    
    // 获取用户ID
    getUserId() {
      // 使用微信OpenID或生成唯一ID
      let userId = uni.getStorageSync('userId')
      if (!userId) {
        userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        uni.setStorageSync('userId', userId)
      }
      return userId
    },
    
    // 加载方案
    async loadPlan() {
      const { getPlanById } = require('@/utils/storage')
      this.plan = await getPlanById(this.planId)
      
      if (!this.plan) {
        uni.showToast({
          title: '方案不存在或已过期',
          icon: 'none'
        })
        setTimeout(() => {
          uni.switchTab({ url: '/pages/index/index' })
        }, 1500)
      }
    },
    
    // 检查查看状态
    async checkViewStatus() {
      const viewKey = `view_${this.planId}_${this.userId}`
      const viewData = uni.getStorageSync(viewKey)
      
      if (viewData) {
        this.hasViewed = true
        this.myAssignment = viewData.assignment
      }
    },
    
    // 开始查看
    startView() {
      this.showCountdown = true
      this.startCountdown()
    },
    
    // 开始倒计时
    startCountdown() {
      const timer = setInterval(() => {
        this.countdown--
        
        if (this.countdown === 0) {
          clearInterval(timer)
          this.showCountdown = false
          this.assignAndShow()
        }
      }, 1000)
    },
    
    // 分配并显示
    async assignAndShow() {
      // 获取一个未分配的位置
      const assignment = await this.getAssignment()
      
      if (!assignment) {
        uni.showToast({
          title: '所有位置已被领取',
          icon: 'none'
        })
        return
      }
      
      this.myAssignment = assignment
      this.showCard = true
      
      // 保存查看记录
      await this.saveViewRecord(assignment)
      
      // 更新方案查看数
      await this.updateViewCount()
    },
    
    // 获取分配
    async getAssignment() {
      const { getPlanById, savePlan } = require('@/utils/storage')
      const plan = await getPlanById(this.planId)
      
      // 找到第一个未查看的分配
      const assignment = plan.assignments.find(a => !a.viewed)
      
      if (assignment) {
        // 标记为已查看
        assignment.viewed = true
        assignment.userId = this.userId
        assignment.viewTime = Date.now()
        
        // 保存更新
        await savePlan(plan)
        
        return assignment
      }
      
      return null
    },
    
    // 保存查看记录
    async saveViewRecord(assignment) {
      const viewKey = `view_${this.planId}_${this.userId}`
      uni.setStorageSync(viewKey, {
        assignment,
        viewTime: Date.now()
      })
      
      this.hasViewed = true
    },
    
    // 更新查看数
    async updateViewCount() {
      const { getPlanById, savePlan } = require('@/utils/storage')
      const plan = await getPlanById(this.planId)
      plan.viewCount = (plan.viewCount || 0) + 1
      await savePlan(plan)
    },
    
    // 再次查看
    viewAgain() {
      if (this.myAssignment) {
        this.showCard = true
      }
    },
    
    // 关闭卡片
    closeCard() {
      this.showCard = false
    }
  }
}
</script>
```

继续下一部分...

---

## 6. 核心功能实现

### 6.1 随机分配算法 (utils/algorithm.js)

```javascript
/**
 * 词语分配算法工具
 */

/**
 * 获取推荐配置
 * @param {number} totalCount - 总人数
 * @returns {object} 推荐配置
 */
export function getRecommendConfig(totalCount) {
  let typeACount, typeBCount, typeCCount
  
  if (totalCount <= 5) {
    // 3-5人: 1卧底 0白板
    typeBCount = 1
    typeCCount = 0
    typeACount = totalCount - 1
  } else if (totalCount <= 8) {
    // 6-8人: 1卧底 1白板
    typeBCount = 1
    typeCCount = 1
    typeACount = totalCount - 2
  } else if (totalCount <= 12) {
    // 9-12人: 2卧底 1白板
    typeBCount = 2
    typeCCount = 1
    typeACount = totalCount - 3
  } else if (totalCount <= 16) {
    // 13-16人: 3卧底 1白板
    typeBCount = 3
    typeCCount = 1
    typeACount = totalCount - 4
  } else {
    // 17-20人: 4卧底 2白板
    typeBCount = 4
    typeCCount = 2
    typeACount = totalCount - 6
  }
  
  return {
    totalCount,
    typeACount,
    typeBCount,
    typeCCount
  }
}

/**
 * 校验配置
 * @param {object} config - 配置对象
 * @returns {object} 校验结果 { valid, message }
 */
export function validateConfig(config) {
  const { totalCount, typeACount, typeBCount, typeCCount } = config
  
  // 检查总和
  if (typeACount + typeBCount + typeCCount !== totalCount) {
    return {
      valid: false,
      message: '各类型人数总和必须等于总人数'
    }
  }
  
  // 检查最小值
  if (typeACount < 1) {
    return {
      valid: false,
      message: 'A类词语至少需要1人'
    }
  }
  
  // 检查B类比例
  if (typeBCount > Math.floor(totalCount / 3)) {
    return {
      valid: false,
      message: 'B类词语人数不建议超过总人数的1/3'
    }
  }
  
  // 检查C类最大值
  if (typeCCount > 2) {
    return {
      valid: false,
      message: 'C类人数最多2人'
    }
  }
  
  return { valid: true }
}

/**
 * Fisher-Yates 洗牌算法
 * @param {Array} array - 数组
 * @returns {Array} 打乱后的数组
 */
function shuffleArray(array) {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

/**
 * 生成随机方案ID
 * @returns {string} 4位随机字符
 */
function generatePlanId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 去除易混淆字符
  let id = ''
  for (let i = 0; i < 4; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return id
}

/**
 * 从词库获取词组
 * @param {string} categoryId - 分类ID (random表示随机)
 * @returns {object} 词组对象
 */
function getWordPair(categoryId) {
  const wordLibrary = require('@/static/data/wordLibrary.js').default
  
  let category
  if (categoryId === 'random') {
    // 随机选择一个分类
    const categories = wordLibrary.categories.filter(c => c.enabled)
    category = categories[Math.floor(Math.random() * categories.length)]
  } else {
    category = wordLibrary.categories.find(c => c.id === categoryId)
  }
  
  if (!category || !category.words || category.words.length === 0) {
    throw new Error('词库数据错误')
  }
  
  // 随机选择一个词组
  const wordPair = category.words[Math.floor(Math.random() * category.words.length)]
  
  return {
    ...wordPair,
    categoryId: category.id
  }
}

/**
 * 生成分配方案
 * @param {object} config - 配置对象
 * @returns {object} 完整的方案对象
 */
export function generatePlan(config) {
  const { totalCount, typeACount, typeBCount, typeCCount, categoryId } = config
  
  // 获取词组
  const wordPair = getWordPair(categoryId)
  
  // 创建分配数组
  const assignments = []
  
  // 添加A类
  for (let i = 0; i < typeACount; i++) {
    assignments.push({
      type: 'A',
      word: wordPair.wordA
    })
  }
  
  // 添加B类
  for (let i = 0; i < typeBCount; i++) {
    assignments.push({
      type: 'B',
      word: wordPair.wordB
    })
  }
  
  // 添加C类
  for (let i = 0; i < typeCCount; i++) {
    assignments.push({
      type: 'C',
      word: null
    })
  }
  
  // 洗牌
  const shuffled = shuffleArray(assignments)
  
  // 添加编号
  const finalAssignments = shuffled.map((item, index) => ({
    ...item,
    index: index + 1,
    viewed: false,
    userId: null,
    viewTime: null
  }))
  
  // 生成方案对象
  const plan = {
    planId: generatePlanId(),
    config: {
      totalCount,
      typeACount,
      typeBCount,
      typeCCount,
      categoryId
    },
    wordPair: {
      wordA: wordPair.wordA,
      wordB: wordPair.wordB,
      categoryId: wordPair.categoryId
    },
    assignments: finalAssignments,
    createTime: Date.now(),
    viewCount: 0,
    status: 'active'
  }
  
  return plan
}

/**
 * 检查方案是否过期
 * @param {object} plan - 方案对象
 * @returns {boolean} 是否过期
 */
export function isPlanExpired(plan) {
  const EXPIRE_TIME = 24 * 60 * 60 * 1000 // 24小时
  return Date.now() - plan.createTime > EXPIRE_TIME
}
```

### 6.2 本地存储工具 (utils/storage.js)

```javascript
/**
 * 本地存储工具
 */

const STORAGE_KEYS = {
  PLANS: 'word_plans',           // 所有方案
  HISTORY: 'word_history',       // 历史记录
  CONFIG: 'word_config'          // 用户配置
}

/**
 * 保存方案
 * @param {object} plan - 方案对象
 */
export async function savePlan(plan) {
  try {
    const plans = await getAllPlans()
    
    // 检查是否已存在
    const index = plans.findIndex(p => p.planId === plan.planId)
    
    if (index >= 0) {
      // 更新已有方案
      plans[index] = plan
    } else {
      // 添加新方案
      plans.push(plan)
    }
    
    // 清理过期方案
    const validPlans = plans.filter(p => {
      const { isPlanExpired } = require('./algorithm')
      return !isPlanExpired(p)
    })
    
    // 保存
    uni.setStorageSync(STORAGE_KEYS.PLANS, validPlans)
    
    // 同时保存到历史记录
    await saveToHistory(plan)
    
    return true
  } catch (error) {
    console.error('保存方案失败:', error)
    return false
  }
}

/**
 * 获取所有方案
 * @returns {Array} 方案列表
 */
export async function getAllPlans() {
  try {
    const plans = uni.getStorageSync(STORAGE_KEYS.PLANS)
    return Array.isArray(plans) ? plans : []
  } catch (error) {
    console.error('获取方案失败:', error)
    return []
  }
}

/**
 * 根据ID获取方案
 * @param {string} planId - 方案ID
 * @returns {object|null} 方案对象
 */
export async function getPlanById(planId) {
  try {
    const plans = await getAllPlans()
    const plan = plans.find(p => p.planId === planId)
    
    if (!plan) {
      return null
    }
    
    // 检查是否过期
    const { isPlanExpired } = require('./algorithm')
    if (isPlanExpired(plan)) {
      await deletePlan(planId)
      return null
    }
    
    return plan
  } catch (error) {
    console.error('获取方案失败:', error)
    return null
  }
}

/**
 * 删除方案
 * @param {string} planId - 方案ID
 */
export async function deletePlan(planId) {
  try {
    const plans = await getAllPlans()
    const filtered = plans.filter(p => p.planId !== planId)
    uni.setStorageSync(STORAGE_KEYS.PLANS, filtered)
    return true
  } catch (error) {
    console.error('删除方案失败:', error)
    return false
  }
}

/**
 * 保存到历史记录
 * @param {object} plan - 方案对象
 */
export async function saveToHistory(plan) {
  try {
    const history = await getHistory()
    
    // 创建历史记录项
    const historyItem = {
      planId: plan.planId,
      wordPair: plan.wordPair,
      config: plan.config,
      createTime: plan.createTime
    }
    
    // 检查是否已存在
    const index = history.findIndex(h => h.planId === plan.planId)
    
    if (index >= 0) {
      history[index] = historyItem
    } else {
      history.unshift(historyItem) // 添加到开头
    }
    
    // 最多保留50条
    const trimmed = history.slice(0, 50)
    
    uni.setStorageSync(STORAGE_KEYS.HISTORY, trimmed)
  } catch (error) {
    console.error('保存历史失败:', error)
  }
}

/**
 * 获取历史记录
 * @returns {Array} 历史记录列表
 */
export async function getHistory() {
  try {
    const history = uni.getStorageSync(STORAGE_KEYS.HISTORY)
    return Array.isArray(history) ? history : []
  } catch (error) {
    console.error('获取历史失败:', error)
    return []
  }
}

/**
 * 清除历史记录
 */
export async function clearHistory() {
  try {
    uni.removeStorageSync(STORAGE_KEYS.HISTORY)
    return true
  } catch (error) {
    console.error('清除历史失败:', error)
    return false
  }
}

/**
 * 清理过期数据
 */
export async function cleanExpiredData() {
  try {
    const plans = await getAllPlans()
    const { isPlanExpired } = require('./algorithm')
    
    const validPlans = plans.filter(p => !isPlanExpired(p))
    
    uni.setStorageSync(STORAGE_KEYS.PLANS, validPlans)
    
    return true
  } catch (error) {
    console.error('清理过期数据失败:', error)
    return false
  }
}
```

---

## 7. 词库设计与实现

### 7.1 词库数据结构 (static/data/wordLibrary.js)

```javascript
/**
 * 词库数据
 * 导出格式: { categories: [...] }
 */

export default {
  categories: [
    {
      id: 'classic',
      name: '经典词库',
      description: '经典常见词组',
      icon: '📚',
      count: 300,
      enabled: true,
      words: [
        // 生活用品类
        { id: 'wp_001', wordA: '眼镜', wordB: '墨镜', difficulty: 'easy', similarity: 70, tags: ['生活用品'] },
        { id: 'wp_002', wordA: '包子', wordB: '饺子', difficulty: 'easy', similarity: 75, tags: ['食物'] },
        { id: 'wp_003', wordA: '牛奶', wordB: '豆浆', difficulty: 'easy', similarity: 72, tags: ['饮品'] },
        { id: 'wp_004', wordA: '汽车', wordB: '火车', difficulty: 'easy', similarity: 68, tags: ['交通'] },
        { id: 'wp_005', wordA: '手机', wordB: '座机', difficulty: 'easy', similarity: 70, tags: ['电器'] },
        { id: 'wp_006', wordA: '雨伞', wordB: '雨衣', difficulty: 'easy', similarity: 75, tags: ['雨具'] },
        { id: 'wp_007', wordA: '牙刷', wordB: '牙膏', difficulty: 'easy', similarity: 80, tags: ['洗漱'] },
        { id: 'wp_008', wordA: '筷子', wordB: '勺子', difficulty: 'easy', similarity: 65, tags: ['餐具'] },
        { id: 'wp_009', wordA: '被子', wordB: '枕头', difficulty: 'easy', similarity: 68, tags: ['床上用品'] },
        { id: 'wp_010', wordA: '洗发水', wordB: '护发素', difficulty: 'easy', similarity: 78, tags: ['洗护'] },
        
        // 食物饮料类
        { id: 'wp_011', wordA: '米饭', wordB: '面条', difficulty: 'easy', similarity: 70, tags: ['主食'] },
        { id: 'wp_012', wordA: '可乐', wordB: '雪碧', difficulty: 'easy', similarity: 75, tags: ['饮料'] },
        { id: 'wp_013', wordA: '苹果', wordB: '梨', difficulty: 'easy', similarity: 65, tags: ['水果'] },
        { id: 'wp_014', wordA: '馒头', wordB: '花卷', difficulty: 'easy', similarity: 73, tags: ['面食'] },
        { id: 'wp_015', wordA: '白糖', wordB: '红糖', difficulty: 'easy', similarity: 80, tags: ['调料'] },
        { id: 'wp_016', wordA: '酱油', wordB: '醋', difficulty: 'easy', similarity: 65, tags: ['调味品'] },
        { id: 'wp_017', wordA: '饼干', wordB: '蛋糕', difficulty: 'easy', similarity: 72, tags: ['零食'] },
        { id: 'wp_018', wordA: '果汁', wordB: '奶茶', difficulty: 'easy', similarity: 68, tags: ['饮品'] },
        { id: 'wp_019', wordA: '西瓜', wordB: '哈密瓜', difficulty: 'easy', similarity: 78, tags: ['瓜类'] },
        { id: 'wp_020', wordA: '鸡蛋', wordB: '鸭蛋', difficulty: 'easy', similarity: 82, tags: ['蛋类'] },
        
        // 动物类
        { id: 'wp_021', wordA: '猫', wordB: '狗', difficulty: 'easy', similarity: 70, tags: ['宠物'] },
        { id: 'wp_022', wordA: '老虎', wordB: '狮子', difficulty: 'easy', similarity: 75, tags: ['猛兽'] },
        { id: 'wp_023', wordA: '鸭子', wordB: '鹅', difficulty: 'easy', similarity: 78, tags: ['家禽'] },
        { id: 'wp_024', wordA: '蝴蝶', wordB: '蜜蜂', difficulty: 'easy', similarity: 65, tags: ['昆虫'] },
        { id: 'wp_025', wordA: '金鱼', wordB: '鲤鱼', difficulty: 'easy', similarity: 72, tags: ['鱼类'] },
        
        // 职业类
        { id: 'wp_026', wordA: '老师', wordB: '学生', difficulty: 'easy', similarity: 68, tags: ['教育'] },
        { id: 'wp_027', wordA: '医生', wordB: '护士', difficulty: 'easy', similarity: 75, tags: ['医疗'] },
        { id: 'wp_028', wordA: '警察', wordB: '保安', difficulty: 'easy', similarity: 70, tags: ['安保'] },
        { id: 'wp_029', wordA: '厨师', wordB: '服务员', difficulty: 'easy', similarity: 65, tags: ['餐饮'] },
        { id: 'wp_030', wordA: '司机', wordB: '乘客', difficulty: 'easy', similarity: 60, tags: ['交通'] },
        
        // 体育运动类
        { id: 'wp_031', wordA: '篮球', wordB: '足球', difficulty: 'easy', similarity: 72, tags: ['球类'] },
        { id: 'wp_032', wordA: '游泳', wordB: '跑步', difficulty: 'easy', similarity: 65, tags: ['运动'] },
        { id: 'wp_033', wordA: '羽毛球', wordB: '乒乓球', difficulty: 'easy', similarity: 75, tags: ['球拍类'] },
        { id: 'wp_034', wordA: '跳高', wordB: '跳远', difficulty: 'easy', similarity: 80, tags: ['田赛'] },
        { id: 'wp_035', wordA: '拳击', wordB: '摔跤', difficulty: 'medium', similarity: 70, tags: ['格斗'] },
        
        // 自然现象类
        { id: 'wp_036', wordA: '太阳', wordB: '月亮', difficulty: 'easy', similarity: 68, tags: ['天体'] },
        { id: 'wp_037', wordA: '下雨', wordB: '下雪', difficulty: 'easy', similarity: 75, tags: ['天气'] },
        { id: 'wp_038', wordA: '春天', wordB: '秋天', difficulty: 'easy', similarity: 70, tags: ['季节'] },
        { id: 'wp_039', wordA: '河流', wordB: '湖泊', difficulty: 'easy', similarity: 72, tags: ['水体'] },
        { id: 'wp_040', wordA: '地震', wordB: '海啸', difficulty: 'medium', similarity: 65, tags: ['灾害'] },
        
        // 学习用品类
        { id: 'wp_041', wordA: '铅笔', wordB: '钢笔', difficulty: 'easy', similarity: 75, tags: ['文具'] },
        { id: 'wp_042', wordA: '橡皮', wordB: '修正带', difficulty: 'easy', similarity: 78, tags: ['修改工具'] },
        { id: 'wp_043', wordA: '书包', wordB: '文具盒', difficulty: 'easy', similarity: 65, tags: ['学习用品'] },
        { id: 'wp_044', wordA: '笔记本', wordB: '作业本', difficulty: 'easy', similarity: 80, tags: ['本子'] },
        { id: 'wp_045', wordA: '字典', wordB: '词典', difficulty: 'easy', similarity: 85, tags: ['工具书'] },
        
        // 家电类
        { id: 'wp_046', wordA: '冰箱', wordB: '冰柜', difficulty: 'easy', similarity: 82, tags: ['制冷'] },
        { id: 'wp_047', wordA: '洗衣机', wordB: '烘干机', difficulty: 'easy', similarity: 70, tags: ['洗护'] },
        { id: 'wp_048', wordA: '电视', wordB: '电脑', difficulty: 'easy', similarity: 65, tags: ['显示设备'] },
        { id: 'wp_049', wordA: '空调', wordB: '风扇', difficulty: 'easy', similarity: 68, tags: ['降温'] },
        { id: 'wp_050', wordA: '微波炉', wordB: '烤箱', difficulty: 'easy', similarity: 75, tags: ['厨电'] },
        
        // 更多词组...
        // 为了节省篇幅，这里仅展示50个示例
        // 实际应用中应该包含300个词组
      ]
    },
    
    {
      id: 'culture',
      name: '文化词库',
      description: '历史文化相关词组',
      icon: '🎭',
      count: 200,
      enabled: true,
      words: [
        // 历史人物
        { id: 'wp_101', wordA: '董永', wordB: '许仙', difficulty: 'medium', similarity: 75, tags: ['神话人物'] },
        { id: 'wp_102', wordA: '岳飞', wordB: '关羽', difficulty: 'medium', similarity: 70, tags: ['历史名将'] },
        { id: 'wp_103', wordA: '李白', wordB: '杜甫', difficulty: 'easy', similarity: 78, tags: ['诗人'] },
        { id: 'wp_104', wordA: '孔子', wordB: '孟子', difficulty: 'easy', similarity: 75, tags: ['思想家'] },
        { id: 'wp_105', wordA: '曹操', wordB: '刘备', difficulty: 'medium', similarity: 68, tags: ['三国'] },
        
        // 成语类
        { id: 'wp_106', wordA: '画蛇添足', wordB: '画龙点睛', difficulty: 'medium', similarity: 80, tags: ['成语'] },
        { id: 'wp_107', wordA: '守株待兔', wordB: '刻舟求剑', difficulty: 'medium', similarity: 75, tags: ['寓言成语'] },
        { id: 'wp_108', wordA: '亡羊补牢', wordB: '未雨绸缪', difficulty: 'medium', similarity: 70, tags: ['成语'] },
        { id: 'wp_109', wordA: '雪中送炭', wordB: '锦上添花', difficulty: 'easy', similarity: 72, tags: ['成语'] },
        { id: 'wp_110', wordA: '井底之蛙', wordB: '坐井观天', difficulty: 'easy', similarity: 85, tags: ['成语'] },
        
        // 传统节日
        { id: 'wp_111', wordA: '春节', wordB: '中秋节', difficulty: 'easy', similarity: 70, tags: ['节日'] },
        { id: 'wp_112', wordA: '端午节', wordB: '重阳节', difficulty: 'medium', similarity: 68, tags: ['节日'] },
        { id: 'wp_113', wordA: '元宵节', wordB: '清明节', difficulty: 'medium', similarity: 65, tags: ['节日'] },
        
        // 传统文化
        { id: 'wp_114', wordA: '京剧', wordB: '昆曲', difficulty: 'hard', similarity: 75, tags: ['戏曲'] },
        { id: 'wp_115', wordA: '书法', wordB: '国画', difficulty: 'medium', similarity: 70, tags: ['艺术'] },
        { id: 'wp_116', wordA: '茶道', wordB: '花道', difficulty: 'hard', similarity: 72, tags: ['传统艺术'] },
        { id: 'wp_117', wordA: '太极拳', wordB: '八卦掌', difficulty: 'hard', similarity: 75, tags: ['武术'] },
        { id: 'wp_118', wordA: '古筝', wordB: '琵琶', difficulty: 'medium', similarity: 78, tags: ['乐器'] },
        
        // 更多文化词组...
      ]
    },
    
    {
      id: 'modern',
      name: '现代词库',
      description: '现代生活相关词组',
      icon: '🎮',
      count: 200,
      enabled: true,
      words: [
        // 社交平台
        { id: 'wp_201', wordA: '微信', wordB: 'QQ', difficulty: 'easy', similarity: 75, tags: ['社交软件'] },
        { id: 'wp_202', wordA: '微博', wordB: '抖音', difficulty: 'easy', similarity: 68, tags: ['社交平台'] },
        { id: 'wp_203', wordA: '知乎', wordB: '百度', difficulty: 'easy', similarity: 65, tags: ['知识平台'] },
        
        // 职业
        { id: 'wp_204', wordA: '程序员', wordB: '设计师', difficulty: 'easy', similarity: 65, tags: ['互联网职业'] },
        { id: 'wp_205', wordA: '产品经理', wordB: '项目经理', difficulty: 'medium', similarity: 80, tags: ['管理岗'] },
        { id: 'wp_206', wordA: '主播', wordB: 'UP主', difficulty: 'easy', similarity: 75, tags: ['新媒体'] },
        
        // 运动品牌
        { id: 'wp_207', wordA: '耐克', wordB: '阿迪达斯', difficulty: 'easy', similarity: 75, tags: ['运动品牌'] },
        { id: 'wp_208', wordA: '李宁', wordB: '安踏', difficulty: 'easy', similarity: 78, tags: ['国产品牌'] },
        
        // 电子产品
        { id: 'wp_209', wordA: 'iPhone', wordB: '华为', difficulty: 'easy', similarity: 70, tags: ['手机品牌'] },
        { id: 'wp_210', wordA: 'iPad', wordB: '平板电脑', difficulty: 'easy', similarity: 82, tags: ['平板'] },
        { id: 'wp_211', wordA: '蓝牙耳机', wordB: '有线耳机', difficulty: 'easy', similarity: 75, tags: ['耳机'] },
        
        // 交通工具
        { id: 'wp_212', wordA: '共享单车', wordB: '电动车', difficulty: 'easy', similarity: 70, tags: ['出行'] },
        { id: 'wp_213', wordA: '地铁', wordB: '公交', difficulty: 'easy', similarity: 72, tags: ['公共交通'] },
        { id: 'wp_214', wordA: '高铁', wordB: '动车', difficulty: 'easy', similarity: 85, tags: ['铁路'] },
        
        // 更多现代词组...
      ]
    },
    
    {
      id: 'idiom',
      name: '成语词库',
      description: '四字成语词组',
      icon: '📖',
      count: 150,
      enabled: true,
      words: [
        { id: 'wp_301', wordA: '七上八下', wordB: '忐忑不安', difficulty: 'medium', similarity: 80, tags: ['心理'] },
        { id: 'wp_302', wordA: '喜出望外', wordB: '大喜过望', difficulty: 'medium', similarity: 85, tags: ['情绪'] },
        { id: 'wp_303', wordA: '欣喜若狂', wordB: '兴高采烈', difficulty: 'easy', similarity: 78, tags: ['开心'] },
        { id: 'wp_304', wordA: '垂头丧气', wordB: '灰心丧气', difficulty: 'easy', similarity: 82, tags: ['沮丧'] },
        { id: 'wp_305', wordA: '半途而废', wordB: '功亏一篑', difficulty: 'medium', similarity: 75, tags: ['放弃'] },
        { id: 'wp_306', wordA: '一丝不苟', wordB: '精益求精', difficulty: 'medium', similarity: 70, tags: ['认真'] },
        { id: 'wp_307', wordA: '粗心大意', wordB: '马马虎虎', difficulty: 'easy', similarity: 80, tags: ['态度'] },
        { id: 'wp_308', wordA: '前赴后继', wordB: '前仆后继', difficulty: 'hard', similarity: 90, tags: ['勇敢'] },
        { id: 'wp_309', wordA: '专心致志', wordB: '全神贯注', difficulty: 'easy', similarity: 82, tags: ['专注'] },
        { id: 'wp_310', wordA: '恍然大悟', wordB: '茅塞顿开', difficulty: 'medium', similarity: 80, tags: ['明白'] },
        // 更多成语...
      ]
    },
    
    {
      id: 'life',
      name: '生活词库',
      description: '日常生活词组',
      icon: '🏠',
      count: 150,
      enabled: true,
      words: [
        // 家居用品
        { id: 'wp_401', wordA: '沙发', wordB: '椅子', difficulty: 'easy', similarity: 70, tags: ['家具'] },
        { id: 'wp_402', wordA: '床', wordB: '沙发床', difficulty: 'easy', similarity: 75, tags: ['寝具'] },
        { id: 'wp_403', wordA: '台灯', wordB: '吊灯', difficulty: 'easy', similarity: 72, tags: ['照明'] },
        { id: 'wp_404', wordA: '窗帘', wordB: '百叶窗', difficulty: 'easy', similarity: 78, tags: ['遮光'] },
        
        // 厨房用品
        { id: 'wp_405', wordA: '炒锅', wordB: '汤锅', difficulty: 'easy', similarity: 75, tags: ['锅具'] },
        { id: 'wp_406', wordA: '菜刀', wordB: '水果刀', difficulty: 'easy', similarity: 80, tags: ['刀具'] },
        { id: 'wp_407', wordA: '碗', wordB: '盘子', difficulty: 'easy', similarity: 70, tags: ['餐具'] },
        { id: 'wp_408', wordA: '保鲜盒', wordB: '保鲜袋', difficulty: 'easy', similarity: 78, tags: ['保鲜'] },
        
        // 清洁用品
        { id: 'wp_409', wordA: '扫把', wordB: '拖把', difficulty: 'easy', similarity: 75, tags: ['清洁'] },
        { id: 'wp_410', wordA: '洗洁精', wordB: '洗手液', difficulty: 'easy', similarity: 72, tags: ['清洁剂'] },
        { id: 'wp_411', wordA: '垃圾桶', wordB: '垃圾袋', difficulty: 'easy', similarity: 80, tags: ['垃圾处理'] },
        
        // 更多生活词组...
      ]
    }
  ]
}
```

### 7.2 词库管理工具函数

```javascript
// utils/wordLibrary.js

/**
 * 词库管理工具
 */

/**
 * 获取所有分类
 * @returns {Array} 分类列表
 */
export function getAllCategories() {
  const wordLibrary = require('@/static/data/wordLibrary.js').default
  return wordLibrary.categories.filter(c => c.enabled)
}

/**
 * 根据ID获取分类
 * @param {string} categoryId - 分类ID
 * @returns {object|null} 分类对象
 */
export function getCategoryById(categoryId) {
  const categories = getAllCategories()
  return categories.find(c => c.id === categoryId) || null
}

/**
 * 获取分类下的所有词组
 * @param {string} categoryId - 分类ID
 * @returns {Array} 词组列表
 */
export function getWordsByCategory(categoryId) {
  const category = getCategoryById(categoryId)
  return category ? category.words : []
}

/**
 * 根据难度筛选词组
 * @param {string} categoryId - 分类ID
 * @param {string} difficulty - 难度 (easy/medium/hard)
 * @returns {Array} 词组列表
 */
export function getWordsByDifficulty(categoryId, difficulty) {
  const words = getWordsByCategory(categoryId)
  return words.filter(w => w.difficulty === difficulty)
}

/**
 * 随机获取一个词组
 * @param {string} categoryId - 分类ID (可选)
 * @returns {object} 词组对象
 */
export function getRandomWord(categoryId = null) {
  let words = []
  
  if (categoryId && categoryId !== 'random') {
    words = getWordsByCategory(categoryId)
  } else {
    // 从所有分类中获取
    const categories = getAllCategories()
    categories.forEach(category => {
      words = words.concat(category.words)
    })
  }
  
  if (words.length === 0) {
    throw new Error('没有可用的词组')
  }
  
  const randomIndex = Math.floor(Math.random() * words.length)
  return words[randomIndex]
}
```

---

## 8. 组件设计

### 8.1 自定义按钮组件 (components/common/custom-button/custom-button.vue)

```vue
<template>
  <button 
    :class="['custom-button', `btn-${type}`, `btn-${size}`, { disabled: disabled }]"
    :disabled="disabled"
    :loading="loading"
    @tap="handleClick"
  >
    <slot></slot>
  </button>
</template>

<script>
export default {
  name: 'CustomButton',
  props: {
    type: {
      type: String,
      default: 'primary' // primary, secondary, text
    },
    size: {
      type: String,
      default: 'medium' // small, medium, large
    },
    disabled: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    handleClick(e) {
      if (!this.disabled && !this.loading) {
        // 触觉反馈
        uni.vibrateShort({
          type: 'light'
        })
        this.$emit('click', e)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.custom-button {
  border: none;
  border-radius: 12rpx;
  font-size: 28rpx;
  text-align: center;
  transition: all 0.3s;
  
  &::after {
    border: none;
  }
  
  &:active:not(.disabled) {
    transform: scale(0.95);
  }
}

.btn-primary {
  background: linear-gradient(135deg, #2979FF 0%, #1565C0 100%);
  color: #fff;
  
  &.disabled {
    background: #ccc;
    opacity: 0.6;
  }
}

.btn-secondary {
  background: #F5F7FA;
  color: #333;
  
  &.disabled {
    opacity: 0.6;
  }
}

.btn-text {
  background: transparent;
  color: #2979FF;
  
  &.disabled {
    color: #ccc;
  }
}

.btn-small {
  height: 60rpx;
  line-height: 60rpx;
  padding: 0 24rpx;
  font-size: 24rpx;
}

.btn-medium {
  height: 80rpx;
  line-height: 80rpx;
  padding: 0 32rpx;
}

.btn-large {
  height: 96rpx;
  line-height: 96rpx;
  padding: 0 48rpx;
  font-size: 32rpx;
  font-weight: 600;
}
</style>
```

### 8.2 数字步进器组件 (components/common/number-stepper/number-stepper.vue)

```vue
<template>
  <view class="number-stepper">
    <view 
      :class="['stepper-btn', { disabled: value <= min }]"
      @tap="decrease"
    >
      −
    </view>
    <view class="stepper-value">{{ value }}</view>
    <view 
      :class="['stepper-btn', { disabled: value >= max }]"
      @tap="increase"
    >
      +
    </view>
  </view>
</template>

<script>
export default {
  name: 'NumberStepper',
  props: {
    value: {
      type: Number,
      required: true
    },
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 100
    },
    step: {
      type: Number,
      default: 1
    }
  },
  methods: {
    decrease() {
      if (this.value > this.min) {
        const newValue = this.value - this.step
        this.$emit('change', newValue >= this.min ? newValue : this.min)
      }
    },
    increase() {
      if (this.value < this.max) {
        const newValue = this.value + this.step
        this.$emit('change', newValue <= this.max ? newValue : this.max)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.number-stepper {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.stepper-btn {
  width: 60rpx;
  height: 60rpx;
  line-height: 60rpx;
  text-align: center;
  background: #F5F7FA;
  border-radius: 50%;
  font-size: 32rpx;
  color: #333;
  transition: all 0.3s;
  
  &:active:not(.disabled) {
    background: #E8EAED;
    transform: scale(0.9);
  }
  
  &.disabled {
    opacity: 0.4;
    color: #999;
  }
}

.stepper-value {
  min-width: 60rpx;
  text-align: center;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}
</style>
```

### 8.3 词语卡片组件 (components/business/word-card/word-card.vue)

```vue
<template>
  <view :class="['word-card', `card-type-${assignment.type}`]">
    <view class="card-header">
      <text class="card-title">词语卡片</text>
    </view>
    
    <view class="card-body">
      <view class="identity-section">
        <text class="identity-label">您被分配为</text>
        <text class="identity-type">{{ typeText }}</text>
      </view>
      
      <view class="word-section">
        <text v-if="assignment.word" class="word-label">您的词语是:</text>
        <text v-if="assignment.word" class="word-value">「 {{ assignment.word }} 」</text>
        <text v-else class="no-word">您没有词语</text>
      </view>
      
      <view class="tips-section">
        <text class="tip-text">{{ tipText }}</text>
      </view>
    </view>
    
    <view class="card-footer">
      <text class="assignment-number">编号: {{ assignment.index }}号</text>
      <custom-button type="secondary" size="medium" @click="handleClose">
        我已记住,关闭
      </custom-button>
    </view>
  </view>
</template>

<script>
export default {
  name: 'WordCard',
  props: {
    assignment: {
      type: Object,
      required: true
    }
  },
  computed: {
    typeText() {
      const typeMap = {
        'A': 'A 类',
        'B': 'B 类',
        'C': 'C 类'
      }
      return typeMap[this.assignment.type] || ''
    },
    tipText() {
      const tipMap = {
        'A': '请记住您的词语，不要告诉他人',
        'B': '隐藏身份，伪装成A类参与者',
        'C': '根据他人描述推测两个词是什么'
      }
      return tipMap[this.assignment.type] || ''
    }
  },
  methods: {
    handleClose() {
      this.$emit('close')
    }
  }
}
</script>

<style lang="scss" scoped>
.word-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 48rpx 32rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
  margin: 32rpx;
}

.card-type-A {
  background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
}

.card-type-B {
  background: linear-gradient(135deg, #FFE0B2 0%, #FFCC80 100%);
}

.card-type-C {
  background: linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%);
}

.card-header {
  text-align: center;
  margin-bottom: 40rpx;
  
  .card-title {
    font-size: 36rpx;
    font-weight: 600;
    color: #333;
  }
}

.card-body {
  .identity-section {
    text-align: center;
    margin-bottom: 48rpx;
    
    .identity-label {
      display: block;
      font-size: 28rpx;
      color: #666;
      margin-bottom: 16rpx;
    }
    
    .identity-type {
      display: block;
      font-size: 48rpx;
      font-weight: bold;
      color: #333;
    }
  }
  
  .word-section {
    text-align: center;
    margin-bottom: 40rpx;
    
    .word-label {
      display: block;
      font-size: 28rpx;
      color: #666;
      margin-bottom: 16rpx;
    }
    
    .word-value {
      display: block;
      font-size: 56rpx;
      font-weight: bold;
      color: #1565C0;
      letter-spacing: 4rpx;
    }
    
    .no-word {
      display: block;
      font-size: 40rpx;
      font-weight: bold;
      color: #999;
    }
  }
  
  .tips-section {
    background: rgba(255, 255, 255, 0.6);
    border-radius: 12rpx;
    padding: 24rpx;
    text-align: center;
    
    .tip-text {
      font-size: 26rpx;
      color: #666;
      line-height: 1.6;
    }
  }
}

.card-footer {
  margin-top: 40rpx;
  text-align: center;
  
  .assignment-number {
    display: block;
    font-size: 28rpx;
    color: #666;
    margin-bottom: 24rpx;
  }
}
</style>
```

---
## 9. 工具函数库

### 9.1 校验工具 (utils/validator.js)

```javascript
/**
 * 数据校验工具
 */

/**
 * 校验配置数据
 * @param {object} config - 配置对象
 * @returns {object} { valid: boolean, message: string }
 */
export function validateConfig(config) {
  const { totalCount, typeACount, typeBCount, typeCCount } = config
  
  // 检查必填字段
  if (!totalCount || !typeACount === undefined || !typeBCount === undefined || !typeCCount === undefined) {
    return {
      valid: false,
      message: '配置数据不完整'
    }
  }
  
  // 检查数据类型
  if (!Number.isInteger(totalCount) || !Number.isInteger(typeACount) || 
      !Number.isInteger(typeBCount) || !Number.isInteger(typeCCount)) {
    return {
      valid: false,
      message: '人数必须为整数'
    }
  }
  
  // 检查总人数范围
  if (totalCount < 3 || totalCount > 20) {
    return {
      valid: false,
      message: '总人数需在3-20人之间'
    }
  }
  
  // 检查总和
  if (typeACount + typeBCount + typeCCount !== totalCount) {
    return {
      valid: false,
      message: '各类型人数总和必须等于总人数'
    }
  }
  
  // 检查A类最小值
  if (typeACount < 1) {
    return {
      valid: false,
      message: 'A类词语至少需要1人'
    }
  }
  
  // 检查B类最大值
  const maxTypeB = Math.floor(totalCount / 3)
  if (typeBCount > maxTypeB) {
    return {
      valid: false,
      message: `B类词语人数不建议超过${maxTypeB}人`
    }
  }
  
  // 检查C类最大值
  if (typeCCount > 2) {
    return {
      valid: false,
      message: 'C类人数最多2人'
    }
  }
  
  // 检查负数
  if (typeACount < 0 || typeBCount < 0 || typeCCount < 0) {
    return {
      valid: false,
      message: '人数不能为负数'
    }
  }
  
  return { valid: true, message: '' }
}

/**
 * 校验方案ID格式
 * @param {string} planId - 方案ID
 * @returns {boolean}
 */
export function validatePlanId(planId) {
  if (!planId || typeof planId !== 'string') {
    return false
  }
  
  // 检查长度和格式（4位大写字母或数字）
  return /^[A-Z0-9]{4}$/.test(planId)
}

/**
 * 校验词组数据
 * @param {object} wordPair - 词组对象
 * @returns {boolean}
 */
export function validateWordPair(wordPair) {
  if (!wordPair || typeof wordPair !== 'object') {
    return false
  }
  
  const { wordA, wordB } = wordPair
  
  if (!wordA || !wordB || typeof wordA !== 'string' || typeof wordB !== 'string') {
    return false
  }
  
  if (wordA.trim() === '' || wordB.trim() === '') {
    return false
  }
  
  if (wordA === wordB) {
    return false
  }
  
  return true
}
```

### 9.2 格式化工具 (utils/formatter.js)

```javascript
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
```

### 9.3 常量定义 (utils/constants.js)

```javascript
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
  A: 'A 类',
  B: 'B 类',
  C: 'C 类'
}

// 类型提示文本
export const TYPE_TIPS = {
  A: '请记住您的词语，不要告诉他人',
  B: '隐藏身份，伪装成A类参与者',
  C: '根据他人描述推测两个词是什么'
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
```

### 9.4 UI工具 (utils/ui.js)

```javascript
/**
 * UI交互工具
 */

/**
 * 显示Toast提示
 * @param {string} title - 提示文本
 * @param {string} icon - 图标类型 (success/error/none)
 * @param {number} duration - 持续时间
 */
export function showToast(title, icon = 'none', duration = 2000) {
  uni.showToast({
    title,
    icon,
    duration,
    mask: true
  })
}

/**
 * 显示成功提示
 * @param {string} title - 提示文本
 */
export function showSuccess(title) {
  showToast(title, 'success')
}

/**
 * 显示错误提示
 * @param {string} title - 提示文本
 */
export function showError(title) {
  showToast(title, 'error')
}

/**
 * 显示加载中
 * @param {string} title - 提示文本
 */
export function showLoading(title = '加载中...') {
  uni.showLoading({
    title,
    mask: true
  })
}

/**
 * 隐藏加载
 */
export function hideLoading() {
  uni.hideLoading()
}

/**
 * 显示模态对话框
 * @param {object} options - 配置选项
 * @returns {Promise}
 */
export function showModal(options = {}) {
  return new Promise((resolve, reject) => {
    uni.showModal({
      title: options.title || '提示',
      content: options.content || '',
      showCancel: options.showCancel !== false,
      confirmText: options.confirmText || '确定',
      cancelText: options.cancelText || '取消',
      success: (res) => {
        if (res.confirm) {
          resolve(true)
        } else if (res.cancel) {
          resolve(false)
        }
      },
      fail: reject
    })
  })
}

/**
 * 显示操作菜单
 * @param {Array} items - 菜单项列表
 * @returns {Promise<number>} 选中的索引
 */
export function showActionSheet(items) {
  return new Promise((resolve, reject) => {
    uni.showActionSheet({
      itemList: items,
      success: (res) => {
        resolve(res.tapIndex)
      },
      fail: reject
    })
  })
}

/**
 * 触觉反馈
 * @param {string} type - 反馈类型 (light/medium/heavy)
 */
export function vibrate(type = 'light') {
  uni.vibrateShort({
    type
  })
}

/**
 * 复制到剪贴板
 * @param {string} data - 要复制的内容
 * @returns {Promise}
 */
export function copyToClipboard(data) {
  return new Promise((resolve, reject) => {
    uni.setClipboardData({
      data,
      success: () => {
        showSuccess('已复制')
        resolve()
      },
      fail: reject
    })
  })
}
```

---

## 10. 样式规范

### 10.1 全局样式变量 (styles/variables.scss)

```scss
/**
 * 全局样式变量
 */

// 颜色定义
$primary-color: #2979FF;
$secondary-color: #FF9800;
$success-color: #4CAF50;
$warning-color: #FFC107;
$error-color: #F44336;
$info-color: #2196F3;

// 文字颜色
$text-primary: #333333;
$text-secondary: #666666;
$text-disabled: #999999;
$text-white: #FFFFFF;

// 背景颜色
$bg-color: #F5F7FA;
$bg-white: #FFFFFF;
$bg-grey: #E8EAED;
$bg-light-grey: #F5F5F5;

// 边框颜色
$border-color: #E0E0E0;
$border-light: #F0F0F0;

// 类型背景色
$type-a-bg: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
$type-b-bg: linear-gradient(135deg, #FFE0B2 0%, #FFCC80 100%);
$type-c-bg: linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%);

// 字体大小
$font-size-xs: 24rpx;
$font-size-sm: 26rpx;
$font-size-base: 28rpx;
$font-size-lg: 32rpx;
$font-size-xl: 36rpx;
$font-size-xxl: 48rpx;

// 字重
$font-weight-normal: 400;
$font-weight-medium: 500;
$font-weight-bold: 600;

// 间距
$spacing-xs: 8rpx;
$spacing-sm: 16rpx;
$spacing-base: 24rpx;
$spacing-lg: 32rpx;
$spacing-xl: 48rpx;

// 圆角
$border-radius-xs: 8rpx;
$border-radius-sm: 12rpx;
$border-radius-base: 16rpx;
$border-radius-lg: 24rpx;
$border-radius-circle: 50%;

// 阴影
$box-shadow-sm: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
$box-shadow-base: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
$box-shadow-lg: 0 8rpx 32rpx rgba(0, 0, 0, 0.12);

// 过渡时间
$transition-fast: 0.2s;
$transition-base: 0.3s;
$transition-slow: 0.5s;

// Z-index层级
$z-index-mask: 1000;
$z-index-modal: 1100;
$z-index-toast: 1200;
$z-index-loading: 1300;
```

### 10.2 全局混入 (styles/mixins.scss)

```scss
/**
 * 全局混入
 */

// 文本省略
@mixin text-ellipsis($lines: 1) {
  @if $lines == 1 {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  } @else {
    display: -webkit-box;
    overflow: hidden;
    text-overflow: ellipsis;
    -webkit-line-clamp: $lines;
    -webkit-box-orient: vertical;
  }
}

// 清除浮动
@mixin clearfix {
  &::after {
    content: '';
    display: table;
    clear: both;
  }
}

// 居中
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

// 垂直居中
@mixin flex-v-center {
  display: flex;
  align-items: center;
}

// 水平居中
@mixin flex-h-center {
  display: flex;
  justify-content: center;
}

// 绝对定位居中
@mixin absolute-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

// 1px边框
@mixin hairline-border($direction: 'all', $color: $border-color) {
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    box-sizing: border-box;
    pointer-events: none;
    
    @if $direction == 'top' {
      top: 0;
      left: 0;
      right: 0;
      border-top: 1px solid $color;
      transform: scaleY(0.5);
    } @else if $direction == 'bottom' {
      bottom: 0;
      left: 0;
      right: 0;
      border-bottom: 1px solid $color;
      transform: scaleY(0.5);
    } @else if $direction == 'left' {
      top: 0;
      left: 0;
      bottom: 0;
      border-left: 1px solid $color;
      transform: scaleX(0.5);
    } @else if $direction == 'right' {
      top: 0;
      right: 0;
      bottom: 0;
      border-right: 1px solid $color;
      transform: scaleX(0.5);
    } @else {
      top: 0;
      left: 0;
      width: 200%;
      height: 200%;
      border: 1px solid $color;
      transform: scale(0.5);
      transform-origin: 0 0;
    }
  }
}

// 渐变背景
@mixin gradient-bg($start-color, $end-color, $angle: 135deg) {
  background: linear-gradient($angle, $start-color 0%, $end-color 100%);
}

// 卡片样式
@mixin card-style {
  background: $bg-white;
  border-radius: $border-radius-lg;
  box-shadow: $box-shadow-base;
  padding: $spacing-lg;
}

// 按钮点击效果
@mixin button-active {
  &:active {
    transform: scale(0.95);
    opacity: 0.8;
  }
}
```

### 10.3 公共样式 (styles/common.scss)

```scss
/**
 * 公共样式
 */

@import './variables.scss';
@import './mixins.scss';

// 页面容器
.page-container {
  min-height: 100vh;
  background: $bg-color;
  padding: $spacing-lg;
}

// 卡片
.card {
  @include card-style;
  margin-bottom: $spacing-base;
}

// 分割线
.divider {
  height: 1px;
  background: $border-light;
  margin: $spacing-base 0;
}

// 空状态
.empty-state {
  @include flex-center;
  flex-direction: column;
  padding: 120rpx 0;
  
  .empty-icon {
    font-size: 120rpx;
    margin-bottom: $spacing-base;
  }
  
  .empty-text {
    font-size: $font-size-base;
    color: $text-secondary;
  }
}

// 加载状态
.loading-state {
  @include flex-center;
  padding: 80rpx 0;
}

// 标题
.section-title {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $text-primary;
  margin-bottom: $spacing-lg;
}

// 提示文本
.tip-text {
  font-size: $font-size-sm;
  color: $text-secondary;
  line-height: 1.6;
}

// 标签
.tag {
  display: inline-block;
  padding: 8rpx 16rpx;
  border-radius: $border-radius-xs;
  font-size: $font-size-xs;
  background: $bg-grey;
  color: $text-secondary;
}

// 徽章
.badge {
  display: inline-block;
  min-width: 32rpx;
  height: 32rpx;
  line-height: 32rpx;
  padding: 0 8rpx;
  border-radius: 16rpx;
  background: $error-color;
  color: $text-white;
  font-size: 20rpx;
  text-align: center;
}
```

---

## 11. 性能优化

### 11.1 图片优化

```javascript
// utils/image.js

/**
 * 图片压缩
 * @param {string} src - 图片路径
 * @param {number} quality - 压缩质量 0-1
 * @returns {Promise<string>} 压缩后的临时路径
 */
export function compressImage(src, quality = 0.8) {
  return new Promise((resolve, reject) => {
    uni.compressImage({
      src,
      quality,
      success: (res) => {
        resolve(res.tempFilePath)
      },
      fail: reject
    })
  })
}

/**
 * 获取图片信息
 * @param {string} src - 图片路径
 * @returns {Promise<object>}
 */
export function getImageInfo(src) {
  return new Promise((resolve, reject) => {
    uni.getImageInfo({
      src,
      success: resolve,
      fail: reject
    })
  })
}
```

### 11.2 数据优化

```javascript
// utils/performance.js

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} delay - 延迟时间(ms)
 * @returns {Function}
 */
export function debounce(func, delay = 300) {
  let timer = null
  return function(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      func.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} delay - 延迟时间(ms)
 * @returns {Function}
 */
export function throttle(func, delay = 300) {
  let lastTime = 0
  return function(...args) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      func.apply(this, args)
      lastTime = now
    }
  }
}

/**
 * 深拷贝
 * @param {any} obj - 要拷贝的对象
 * @returns {any}
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime())
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item))
  }
  
  if (obj instanceof Object) {
    const clonedObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
}
```

### 11.3 列表优化配置

```vue
<!-- 使用虚拟列表优化长列表 -->
<template>
  <scroll-view 
    scroll-y
    :scroll-top="scrollTop"
    @scroll="onScroll"
    class="list-container"
  >
    <view 
      v-for="item in visibleList" 
      :key="item.id"
      class="list-item"
    >
      <!-- 列表项内容 -->
    </view>
  </scroll-view>
</template>

<script>
export default {
  data() {
    return {
      list: [],           // 完整列表
      visibleList: [],    // 可见列表
      scrollTop: 0,
      itemHeight: 100,    // 每项高度
      visibleCount: 10    // 可见数量
    }
  },
  methods: {
    onScroll(e) {
      const scrollTop = e.detail.scrollTop
      this.updateVisibleList(scrollTop)
    },
    
    updateVisibleList(scrollTop) {
      const startIndex = Math.floor(scrollTop / this.itemHeight)
      const endIndex = startIndex + this.visibleCount
      this.visibleList = this.list.slice(startIndex, endIndex)
    }
  }
}
</script>
```

---

## 12. 开发规范

### 12.1 命名规范

#### 12.1.1 文件命名
```
// 页面文件：小写+连字符
pages/word-list/word-list.vue

// 组件文件：小写+连字符
components/custom-button/custom-button.vue

// 工具文件：小写+驼峰
utils/storageHelper.js

// 样式文件：小写+连字符
styles/common-styles.scss
```

#### 12.1.2 变量命名
```javascript
// 常量：全大写+下划线
const MAX_COUNT = 20
const STORAGE_KEY_PREFIX = 'word_'

// 普通变量：小驼峰
let userName = 'test'
let isActive = false

// 私有变量：下划线开头
let _privateData = {}

// 布尔值：is/has/can开头
let isLoading = false
let hasData = true
let canSubmit = false
```

#### 12.1.3 函数命名
```javascript
// 动词开头，小驼峰
function getUserInfo() {}
function handleClick() {}
function validateForm() {}

// 事件处理：on开头
function onSubmit() {}
function onClick() {}

// 获取数据：get开头
function getData() {}
function getList() {}

// 设置数据：set开头
function setData() {}
function setConfig() {}

// 布尔判断：is/has/can开头
function isValid() {}
function hasPermission() {}
```

### 12.2 代码注释规范

```javascript
/**
 * 函数说明
 * @param {string} name - 参数说明
 * @param {number} age - 参数说明
 * @returns {object} 返回值说明
 * @example
 * const result = functionName('test', 18)
 */
function functionName(name, age) {
  // 单行注释说明逻辑
  const data = {}
  
  /* 
   * 多行注释
   * 说明复杂逻辑
   */
  return data
}
```

### 12.3 Git提交规范

```bash
# 提交格式
<type>(<scope>): <subject>

# type类型
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
perf: 性能优化
test: 测试
chore: 构建/工具变动

# 示例
feat(config): 添加快速开始功能
fix(storage): 修复方案保存失败问题
docs(readme): 更新使用说明
style(button): 调整按钮样式
refactor(algorithm): 重构分配算法
```

---

## 13. 测试方案

### 13.1 功能测试清单

```javascript
// test/functional-test.js

/**
 * 功能测试清单
 */

export const testCases = [
  {
    module: '方案配置',
    cases: [
      {
        id: 'TC001',
        name: '快速开始-6人配置',
        steps: [
          '1. 进入首页',
          '2. 选择6人',
          '3. 点击生成方案'
        ],
        expected: '成功生成方案，跳转到结果页'
      },
      {
        id: 'TC002',
        name: '自定义配置-边界值测试',
        steps: [
          '1. 展开自定义配置',
          '2. 设置总人数为3',
          '3. 设置A类2人，B类1人',
          '4. 点击生成'
        ],
        expected: '成功生成最小人数配置方案'
      },
      {
        id: 'TC003',
        name:'配置校验-非法配置',
        steps: [
          '1. 设置总人数6人',
          '2. 设置A类2人，B类3人，C类2人',
          '3. 点击生成'
        ],
        expected: '显示错误提示：各类型人数总和必须等于总人数'
      }
    ]
  },
  
  {
    module: '方案生成',
    cases: [
      {
        id: 'TC101',
        name: '方案ID唯一性',
        steps: [
          '1. 连续生成10个方案',
          '2. 检查方案ID'
        ],
        expected: '所有方案ID不重复'
      },
      {
        id: 'TC102',
        name: '词组随机性',
        steps: [
          '1. 使用相同配置生成5个方案',
          '2. 对比词组'
        ],
        expected: '词组应有变化，体现随机性'
      },
      {
        id: 'TC103',
        name: '分配正确性',
        steps: [
          '1. 生成方案',
          '2. 检查分配结果'
        ],
        expected: 'A/B/C类人数符合配置，编号连续不重复'
      }
    ]
  },
  
  {
    module: '参与者查看',
    cases: [
      {
        id: 'TC201',
        name: '首次查看流程',
        steps: [
          '1. 分享方案',
          '2. 新用户点击查看',
          '3. 确认倒计时',
          '4. 查看词语'
        ],
        expected: '显示正确的词语和编号'
      },
      {
        id: 'TC202',
        name: '重复查看限制',
        steps: [
          '1. 已查看用户再次进入',
          '2. 检查状态'
        ],
        expected: '显示已查看提示，可再次查看'
      },
      {
        id: 'TC203',
        name: '查看数统计',
        steps: [
          '1. 多个用户查看',
          '2. 刷新结果页'
        ],
        expected: '查看人数正确增加'
      }
    ]
  },
  
  {
    module: '本地存储',
    cases: [
      {
        id: 'TC301',
        name: '方案保存',
        steps: [
          '1. 生成方案',
          '2. 关闭小程序',
          '3. 重新打开',
          '4. 查看历史记录'
        ],
        expected: '方案被正确保存'
      },
      {
        id: 'TC302',
        name: '过期清理',
        steps: [
          '1. 修改方案创建时间为25小时前',
          '2. 尝试访问该方案'
        ],
        expected: '提示方案已过期'
      }
    ]
  }
]
```

### 13.2 兼容性测试

```javascript
// 测试设备列表
export const testDevices = [
  {
    platform: 'iOS',
    devices: [
      'iPhone 14 Pro Max',
      'iPhone 13',
      'iPhone SE 2020',
      'iPad Air'
    ]
  },
  {
    platform: 'Android',
    devices: [
      '华为 Mate 50',
      '小米 13',
      'OPPO Find X6',
      'vivo X90'
    ]
  }
]

// 微信版本
export const wechatVersions = [
  '8.0.40',
  '8.0.35',
  '8.0.30'
]
```

### 13.3 性能测试指标

```javascript
export const performanceMetrics = {
  // 首屏加载时间
  firstScreenLoad: {
    target: '< 1000ms',
    acceptable: '< 1500ms'
  },
  
  // 页面切换时间
  pageTransition: {
    target: '< 300ms',
    acceptable: '< 500ms'
  },
  
  // 方案生成时间
  planGeneration: {
    target: '< 500ms',
    acceptable: '< 1000ms'
  },
  
  // 包体积
  packageSize: {
    target: '< 2MB',
    acceptable: '< 3MB'
  },
  
  // 内存占用
  memoryUsage: {
    target: '< 50MB',
    acceptable: '< 100MB'
  }
}
```

---

## 14. 部署发布

### 14.1 打包配置

#### 14.1.1 manifest.json 配置

```json
{
  "name": "词语分配助手",
  "appid": "__UNI__XXXXXX",
  "description": "聚会活动词语分配工具",
  "versionName": "1.0.0",
  "versionCode": "100",
  
  "mp-weixin": {
    "appid": "wx你的AppID",
    "setting": {
      "urlCheck": false,
      "es6": true,
      "minified": true,
      "postcss": true
    },
    "usingComponents": true,
    "permission": {
      "scope.userLocation": {
        "desc": "用于优化用户体验"
      }
    },
    "requiredPrivateInfos": [],
    "optimization": {
      "subPackages": true
    }
  },
  
  "h5": {
    "title": "词语分配助手",
    "router": {
      "mode": "hash"
    }
  }
}
```

#### 14.1.2 pages.json 配置

```json
{
  "pages": [
    {
      "path": "pages/index/index",
      "style": {
        "navigationBarTitleText": "词语分配助手",
        "navigationBarBackgroundColor": "#2979FF",
        "navigationBarTextStyle": "white",
        "backgroundColor": "#F5F7FA",
        "enablePullDownRefresh": false
      }
    },
    {
      "path": "pages/result/result",
      "style": {
        "navigationBarTitleText": "方案结果",
        "navigationBarBackgroundColor": "#2979FF",
        "navigationBarTextStyle": "white",
        "enablePullDownRefresh": true
      }
    },
    {
      "path": "pages/view/view",
      "style": {
        "navigationBarTitleText": "查看词语",
        "navigationBarBackgroundColor": "#2979FF",
        "navigationBarTextStyle": "white"
      }
    },
    {
      "path": "pages/history/history",
      "style": {
        "navigationBarTitleText": "历史记录",
        "navigationBarBackgroundColor": "#2979FF",
        "navigationBarTextStyle": "white"
      }
    }
  ],
  
  "globalStyle": {
    "navigationBarTextStyle": "white",
    "navigationBarTitleText": "词语分配助手",
    "navigationBarBackgroundColor": "#2979FF",
    "backgroundColor": "#F5F7FA"
  },
  
  "tabBar": null
}
```

### 14.2 发布前检查清单

```markdown
## 功能检查
- [ ] 所有页面功能正常
- [ ] 所有按钮点击有效
- [ ] 数据存储正常
- [ ] 分享功能正常
- [ ] 没有console.log残留

## 合规检查
- [ ] 无"游戏"相关字眼
- [ ] 无诱导分享内容
- [ ] 隐私政策完整
- [ ] 用户协议完整
- [ ] 类目选择正确(工具-计算器)

## 性能检查
- [ ] 首屏加载 < 1.5秒
- [ ] 包体积 < 2MB
- [ ] 无内存泄漏
- [ ] 图片已压缩
- [ ] 代码已压缩

## 兼容性检查
- [ ] iOS系统测试通过
- [ ] Android系统测试通过
- [ ] 不同屏幕尺寸适配
- [ ] 微信版本兼容性

## 资料准备
- [ ] 小程序图标 (1024x1024)
- [ ] 小程序截图 (至少3张)
- [ ] 小程序简介
- [ ] 服务类目资质
- [ ] 审核说明视频
```

### 14.3 审核材料准备

#### 14.3.1 小程序信息

```
名称: 词语分配助手
简介: 一款聚会活动词语分配工具，支持多人随机词语生成和分配方案管理

服务类目: 
- 一级类目: 工具
- 二级类目: 计算器

标签: 
#工具 #计算 #聚会 #效率
```

#### 14.3.2 隐私协议模板

```markdown
# 隐私政策

最后更新日期：2025年1月

## 1. 信息收集
我们仅收集以下必要信息：
- 用户唯一标识(OpenID): 用于方案分配和防止重复查看
- 临时数据: 方案数据24小时后自动删除

## 2. 信息使用
- 仅用于提供词语分配服务
- 不会用于任何营销目的
- 不会分享给第三方

## 3. 数据安全
- 所有数据本地存储
- 24小时自动清理
- 不上传至服务器

## 4. 用户权利
用户可以随时：
- 清除本地数据
- 停止使用服务

## 5. 联系我们
如有疑问，请通过小程序反馈功能联系我们。
```

#### 14.3.3 审核说明

```markdown
## 小程序审核说明

### 功能说明
本小程序是一款词语分配计算工具，主要功能包括：

1. **词语方案生成**: 根据用户输入的参与人数，自动计算并生成词语分配方案

2. **随机分配算法**: 使用Fisher-Yates算法实现公平的随机分配

3. **词库管理**: 提供多个分类词库供用户选择

4. **方案查看**: 参与者可通过分享链接查看分配给自己的词语

### 使用场景
朋友聚会、团队活动、破冰游戏等需要随机词语分配的场景

### 数据安全
所有方案数据存储在用户本地，24小时自动清除，不保存用户个人信息

### 测试说明
- 测试账号：无需账号，所有功能免登录可用
- 测试流程：首页选择人数 → 生成方案 → 分享查看

### 补充说明
本工具为纯计算类工具，不涉及游戏玩法，符合工具类目要求
```

### 14.4 发布流程

```bash
# 1. 开发完成后本地测试
npm run dev:mp-weixin

# 2. 打包生产版本
npm run build:mp-weixin

# 3. 使用微信开发者工具打开 dist/build/mp-weixin 目录

# 4. 点击"上传"按钮，填写版本号和备注

# 5. 登录微信公众平台
#    - 进入"版本管理"
#    - 选择刚上传的版本
#    - 点击"提交审核"
#    - 填写审核信息
#    - 提交等待审核

# 6. 审核通过后发布上线
```

---

## 15. 附录

### 15.1 常见问题FAQ

```markdown
## Q1: 方案链接失效怎么办？
A: 方案有效期为24小时，超过时间会自动失效。请重新生成新方案。

## Q2: 如何确保分配的公平性？
A: 使用Fisher-Yates洗牌算法，保证每个位置被分配的概率相等。

## Q3: 可以自定义词库吗？
A: 当前版本使用预置词库，后续版本会考虑添加自定义功能。

## Q4: 数据会被保存吗？
A: 所有数据仅保存在本地，24小时后自动清除，不会上传服务器。

## Q5: 支持多少人参与？
A: 支持3-20人，建议6-12人体验最佳。
```

### 15.2 更新日志模板

```markdown
## 版本历史

### V1.0.0 (2025-01-XX)
**首次发布**
- ✨ 支持快速生成和自定义配置
- ✨ 提供5个预置词库
- ✨ 支持方案分享和查看
- ✨ 历史记录管理

### V1.1.0 (计划中)
**功能优化**
- 🎨 UI视觉优化
- ⚡ 性能优化
- 🐛 Bug修复
- 📚 词库扩充至1000组
```

### 15.3 技术栈版本信息

```json
{
  "dependencies": {
    "vue": "^2.6.14",
    "vuex": "^3.6.2"
  },
  "devDependencies": {
    "@dcloudio/uni-cli-shared": "^2.0.0",
    "@dcloudio/uni-template-compiler": "^2.0.0",
    "@dcloudio/webpack-uni-mp-loader": "^2.0.0",
    "sass": "^1.49.0",
    "sass-loader": "^10.1.1"
  }
}
```

---

## 总结

本详细设计说明书涵盖了以下核心内容：

1. **完整的项目结构** - 清晰的目录组织和文件划分
2. **详细的数据结构** - 所有数据模型的定义和校验规则
3. **页面设计说明** - 每个页面的结构、逻辑和样式实现
4. **核心功能实现** - 随机分配算法、存储方案、词库管理
5. **组件库设计** - 可复用的通用组件和业务组件
6. **工具函数库** - 校验、格式化、UI交互等工具函数
7. **样式规范** - 全局变量、混入和公共样式
8. **性能优化** - 图片、数据、列表等优化方案
9. **开发规范** - 命名、注释、提交等规范
10. **测试方案** - 功能、兼容性、性能测试清单
11. **部署发布** - 配置、检查清单、审核材料

**关键特性**:
- ✅ 纯前端实现，无需后端服务器
- ✅ 完全符合个人开发者合规要求
- ✅ 使用预置词库，性能优异
- ✅ 详细的实现说明，可直接指导开发

**开发建议**:
1. 先实现MVP版本（首页配置+方案生成+查看页）
2. 完成基础功能测试后再添加历史记录等辅助功能
3. 严格按照合规要求检查所有文案
4. 充分测试各种边界情况

