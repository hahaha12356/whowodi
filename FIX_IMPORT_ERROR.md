# ✅ 已修复：模块导入错误

## 问题描述

**错误信息**:
```
module 'utils/@/static/data/wordLibrary.js' is not defined,
require args is '@/static/data/wordLibrary.js'
```

## 根本原因

在 uni-app 中，`require()` 函数**不支持** `@` 别名路径。当使用 `require('@/xxx')` 时，路径会被错误解析。

### 错误的写法 ❌
```javascript
const wordLibrary = require('@/static/data/wordLibrary.js').wordLibrary
```

### 正确的写法 ✅
```javascript
// 方式1：在文件顶部使用 import
import wordLibrary from '@/static/data/wordLibrary.js'

// 方式2：使用相对路径
const wordLibrary = require('../../static/data/wordLibrary.js').wordLibrary
```

## 已修复的文件

### 1. utils/algorithm.js
**修改前**:
```javascript
function getWordPair(categoryId) {
  const wordLibrary = require('@/static/data/wordLibrary.js').wordLibrary
  // ...
}
```

**修改后**:
```javascript
import wordLibrary from '@/static/data/wordLibrary.js'

function getWordPair(categoryId) {
  // 直接使用导入的 wordLibrary
  // ...
}
```

### 2. App.vue
**修改前**:
```javascript
async cleanExpiredData() {
  try {
    const { cleanExpiredData } = require('@/utils/storage.js')
    await cleanExpiredData()
  } catch (error) {
    console.error('清理过期数据失败:', error)
  }
}
```

**修改后**:
```javascript
import { cleanExpiredData } from '@/utils/storage.js'

async cleanExpiredData() {
  try {
    await cleanExpiredData()
  } catch (error) {
    console.error('清理过期数据失败:', error)
  }
}
```

## 🎯 最佳实践

### 在 uni-app 中导入模块

#### ✅ 推荐：使用 import（ES6）
```javascript
import wordLibrary from '@/static/data/wordLibrary.js'
import { getPlanById } from '@/utils/storage.js'
```

#### ⚠️ 备选：使用相对路径
```javascript
const wordLibrary = require('../../static/data/wordLibrary.js')
```

#### ❌ 避免：在 require 中使用 @ 别名
```javascript
const wordLibrary = require('@/static/data/wordLibrary.js') // 错误！
```

## 🚀 测试验证

修复后，请测试以下功能：

### 1. 快速生成
- [ ] 选择人数（7人）
- [ ] 点击"生成方案"按钮
- [ ] **应该**：显示"生成中..."
- [ ] **应该**：成功跳转到结果页
- [ ] **应该**：显示方案编号和词组

### 2. 自定义生成
- [ ] 展开自定义配置
- [ ] 调整A/B/C类人数
- [ ] 选择不同词库
- [ ] 点击"生成方案"
- [ ] **应该**：成功生成方案

### 3. 查看词语
- [ ] 从结果页分享链接
- [ ] 在查看页点击"查看我的词语"
- [ ] **应该**：显示倒计时
- [ ] **应该**：显示词语卡片

## 📋 相关文件

已修复的文件：
- ✅ [utils/algorithm.js](d:\work_space\whowodi\utils\algorithm.js)
- ✅ [App.vue](d:\work_space\whowodi\App.vue)

## 🔧 其他注意事项

### 1. 模块导出格式
确保词库文件使用正确的导出格式：

```javascript
// wordLibrary.js
export const wordLibrary = {
  categories: [...]
}

// 或者
export default {
  wordLibrary: {
    categories: [...]
  }
}
```

### 2. 导入一致性
在整个项目中保持一致的导入风格：
- 统一使用 ES6 `import` 语法
- 避免混用 `import` 和 `require`

### 3. 路径别名
uni-app 支持的路径别名：
- `@/` - 项目根目录（仅在 import 中有效）
- `~/` - 项目根目录（仅在 import 中有效）
- `./` - 当前目录
- `../` - 上级目录

## 💡 开发建议

### 使用 ESLint 检测
可以配置 ESLint 规则来检测不正确的 `require` 使用：

```json
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "patterns": [{
          "group": ["require('@/"],
          "message": "请使用 import 替代 require('@/xxx')"
        }]
      }
    ]
  }
}
```

### 代码审查
在代码审查时，重点检查：
1. 是否混用 `import` 和 `require`
2. `require` 是否使用了 `@` 别名
3. 模块路径是否正确

---

**修复时间**: 2025-01-21
**影响范围**: algorithm.js, App.vue
**问题类型**: 模块导入路径错误
**解决方案**: 使用 ES6 import 替代 require
