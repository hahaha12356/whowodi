# 并发领取身份重复问题修复总结

## 修复时间
2026-02-08

## 问题描述
当多个用户同时点击"领取身份"时，会出现重复的身份号码。例如3个人同时领取，可能出现：
- 用户A：1号
- 用户B：1号（重复！）
- 用户C：3号
- 2号：无人领取

## 根本原因分析

### 1. 数据库同步延迟
多个用户几乎同时创建领取记录时，在验证阶段可能看不到对方的记录，导致都认为座位是空的。

### 2. 验证时间窗口不足
原来的验证流程：
- 等待150ms
- 查询3次，每次间隔50ms
- 总计约250ms

在高并发场景下，这个时间窗口不足以确保数据库完全同步。

### 3. 缺少预检查机制
原来的流程是"先创建，后验证"，没有在创建前检查座位是否已被占用。

## 修复方案

### 修改文件
1. `utils/cloud.js` - 增强 `tryCreateClaimAtomically` 函数
2. `pages/view/view.vue` - 优化 `getRobustAssignment` 重试逻辑

### 关键改进点

#### 1. 添加预检查机制（utils/cloud.js:226-238）
```javascript
// 在创建记录前先检查座位是否已被占用
const existingClaims = await db.collection(CLAIMS_COLLECTION)
    .where({ planId, seatIndex })
    .get()

if (existingClaims.data && existingClaims.data.length > 0) {
    // 座位已被占用，直接返回冲突
    return { success: false, conflict: true }
}
```

#### 2. 增加等待时间和验证次数
- 初始等待：150ms → **200ms**
- 验证次数：3次 → **4次**
- 验证间隔：50ms → **60ms**
- 总验证时间：约 **380ms**

#### 3. 增强稳定性检查
```javascript
// 需要连续2次查询结果一致才算稳定
if (stableCheck >= 2) {
    console.log('查询结果已稳定')
    break
}
```

#### 4. 赢家清理输家记录
```javascript
if (amIWinner) {
    // 清理其他输家的记录
    const losers = allClaims.data.slice(1)
    for (const loser of losers) {
        await db.collection(CLAIMS_COLLECTION).doc(loser._id).remove()
    }
}
```

#### 5. 优化重试逻辑（pages/view/view.vue:249-336）
- 最大重试次数：10次 → **15次**
- 指数退避策略：
  - 冲突重试：`100ms + retry * 50ms`（最大500ms）
  - 网络错误：`300ms + retry * 100ms`（最大1000ms）

#### 6. 增强日志输出
- 打印每次尝试的详细信息
- 打印所有竞争者的信息
- 使用 ✅ 和 ❌ 标记成功/失败

## 技术原理

### 乐观锁策略
1. **乐观创建**：先创建记录，假设不会冲突
2. **立即验证**：创建后立即查询验证
3. **冲突解决**：如果有冲突，通过时间戳和记录ID决定赢家
4. **输家重试**：输家删除自己的记录并重新选择座位

### 赢家判定规则
```javascript
// 优先级：1. claimTime（服务器时间戳） 2. _id（记录ID字典序）
allClaims.data.sort((a, b) => {
    // 已通过 orderBy('claimTime', 'asc').orderBy('_id', 'asc') 排序
})
const winner = allClaims.data[0]
```

## 测试建议

### 1. 并发测试（3人同时领取）
- 准备3台设备
- 同时点击"领取身份"
- 验证：3个人获得不同的号码（1、2、3）

### 2. 高并发测试（5人同时领取）
- 准备5台设备
- 同时点击"领取身份"
- 验证：5个人获得不同的号码（1-5）

### 3. 重复领取测试
- 用户领取后再次点击
- 验证：显示相同的号码，不创建新记录

### 4. 座位已满测试
- 所有座位被占用后
- 新用户尝试领取
- 验证：提示"所有座位已被占用"

## 数据库配置要求

确保 `claims` 集合的权限设置：
- ✅ 所有用户可读
- ✅ 所有用户可写

建议添加索引：
```json
{
  "planId": 1,
  "seatIndex": 1
}
```

## 预期效果

1. **消除重复**：即使在高并发场景下，也不会出现重复的身份号码
2. **提高成功率**：通过增加重试次数和优化延迟策略，提高领取成功率
3. **更好的用户体验**：通过详细的日志输出，便于调试和问题排查

## 注意事项

1. 在网络较慢的环境下，可能需要更多的重试次数
2. 建议在生产环境中监控冲突率和重试次数
3. 如果冲突率过高，可以考虑进一步增加验证时间或使用云函数实现真正的原子操作

## 回滚方案

如果修复后出现问题，可以通过以下命令回滚：
```bash
git checkout HEAD~1 utils/cloud.js pages/view/view.vue
```

