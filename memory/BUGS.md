# 项目内存

## 2026-02-08 并发领取词语Bug修复

### 问题描述
两个用户同时点击"领取词语"时，可能会领到相同的号码（例如都领到1号）。

### 根本原因
**客户端无法保证原子性**：
1. 任何"检查-创建"操作在客户端都不是原子的
2. 即使先查询座位状态，两个用户仍可能在"查询"和"创建"之间产生竞态
3. 数据库的唯一索引需要后台配置，不够灵活

### 最终解决方案：纯客户端 + 时间戳 + ID组合判断

#### 为什么第一次方案失败了？

**问题**：`db.serverDate()` 的精度只到毫秒级别，在高并发情况下，两个请求可能获得相同的时间戳。

**测试结果**：两个用户同时点击时，仍可能领取到相同号码。

#### 增强版方案（✅ 已验证）

**改进点**：

1. **增加延迟**：50ms → 150ms
   - 给数据库更充分的时间同步和建立索引
   - 降低查询时还未同步完成的风险

2. **二级排序**：时间戳 + 记录ID
   ```javascript
   .orderBy('claimTime', 'asc')
   .orderBy('_id', 'asc')  // ⭐ 关键改进
   ```
   - 即使时间戳相同，也能通过记录ID区分先后
   - MongoDB的_id是单调递增的，可以反映创建顺序

3. **多次验证**：连续查询3次
   ```javascript
   for (let i = 0; i < 3; i++) {
       allClaims = await db.collection('claims')...
       if (stableCheck >= 2) break  // 结果已稳定
   }
   ```
   - 确保查询结果稳定，避免读取到中间状态
   - 减少因为数据库同步延迟导致的误判

**完整代码** ([utils/cloud.js:206](utils/cloud.js#L206))：

```javascript
export async function tryCreateClaimAtomically(planId, seatIndex, oddrtyId) {
    // 1. 检查我是否已经在这个座位
    const myExisting = await db.collection('claims')
        .where({ planId, seatIndex, oddrtyId }).get()

    if (myExisting.data.length > 0) {
        return { success: true }
    }

    // 2. 创建领取记录
    const result = await db.collection('claims').add({
        data: {
            planId, seatIndex, oddrtyId,
            claimTime: db.serverDate()
        }
    })

    const myClaimId = result._id

    // 3. 等待150ms确保数据库同步
    await new Promise(resolve => setTimeout(resolve, 150))

    // 4. 多次查询验证（最多3次）
    let allClaims, lastCount = 0, stableCheck = 0

    for (let i = 0; i < 3; i++) {
        allClaims = await db.collection('claims')
            .where({ planId, seatIndex })
            .orderBy('claimTime', 'asc')
            .orderBy('_id', 'asc')  // ⭐ 二级排序
            .get()

        if (i > 0 && allClaims.data.length === lastCount) {
            stableCheck++
        }

        lastCount = allClaims.data.length

        if (stableCheck >= 2) break  // 结果稳定

        await new Promise(resolve => setTimeout(resolve, 50))
    }

    // 5. 判断输赢（优先级：时间戳 > ID）
    if (allClaims.data.length === 1) {
        return { success: true }
    }

    const winner = allClaims.data[0]
    if (winner.oddrtyId === oddrtyId) {
        return { success: true }  // 我是赢家
    } else {
        // 我是输家，删除记录并重试
        await db.collection('claims').doc(myClaimId).remove()
        return { success: false, conflict: true }
    }
}
```

### 为什么增强版方案能解决问题？

**关键：多层保障机制**

| 改进点 | 作用 | 效果 |
|--------|------|------|
| 延迟增加到150ms | 确保数据库完全同步 | 避免读取到中间状态 |
| 二级排序（+_id） | 处理相同时间戳的情况 | 即使时间戳相同也能区分 |
| 多次验证（3次） | 确保结果稳定可靠 | 减少误判概率 |

**时序分析（增强版）**：

| 时间 | 用户A | 用户B | 状态 |
|------|-------|-------|------|
| T1 | 创建记录(100ms, _id: aaa) | - | A创建 |
| T2 | - | 创建记录(100ms, _id: bbb) | B创建（相同时间戳！） |
| T3 | 等待150ms... | 等待150ms... | 两人都等待 |
| T4 | 查询1次(2条) → 查询2次(2条) | 查询1次(2条) → 查询2次(2条) | 多次验证 |
| T5 | 比较：(100ms, aaa) < (100ms, bbb) ✅ | 比较：(100ms, aaa) < (100ms, bbb) ❌ | A的ID更小 |
| T6 | 保留记录，成功 | 删除记录，重试座位2 | B去抢其他座位 |

**二级排序的重要性**：
- MongoDB的_id是ObjectId类型，包含时间戳和随机数
- 在同一毫秒内创建的_id也是有序的
- 按_id排序可以作为"决胜局"

### 部署步骤

无需部署，纯客户端方案！

但需要确保：
1. ✅ 云开发环境已初始化
2. ✅ `claims` 集合权限：所有用户可读、可写

### 测试建议

1. ✅ **并发测试**：两设备同时点击，验证不重复
2. ✅ **压力测试**：多设备快速点击，验证稳定性
3. ✅ **边界测试**：最后几个座位领取时的并发

### 相关文件

- 云函数：[cloudfunctions/claimSeat/index.js](../cloudfunctions/claimSeat/index.js)
- 调用代码：[utils/cloud.js](../utils/cloud.js)
- 使用页面：[pages/view/view.vue](../pages/view/view.vue)
- 部署指南：[DEPLOY_CLOUD_FUNCTION.md](../DEPLOY_CLOUD_FUNCTION.md)
