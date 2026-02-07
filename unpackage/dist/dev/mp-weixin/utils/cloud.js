"use strict";
const common_vendor = require("../common/vendor.js");
const COLLECTION_NAME = "plans";
let db = null;
function getDB() {
  if (!db) {
    if (!common_vendor.wx$1.cloud) {
      common_vendor.index.__f__("error", "at utils/cloud.js:17", "云能力未初始化");
      return null;
    }
    db = common_vendor.wx$1.cloud.database();
  }
  return db;
}
async function savePlanToCloud(plan) {
  const db2 = getDB();
  if (!db2)
    return null;
  try {
    const cloudData = JSON.parse(JSON.stringify(plan));
    cloudData._createTime = db2.serverDate();
    cloudData._updateTime = db2.serverDate();
    if (plan.cloudId) {
      common_vendor.index.__f__("log", "at utils/cloud.js:47", "方案已在云端，跳过保存:", plan.cloudId);
      return plan.cloudId;
    }
    const res = await db2.collection(COLLECTION_NAME).add({
      data: cloudData
    });
    common_vendor.index.__f__("log", "at utils/cloud.js:55", "方案保存云端成功, _id:", res._id);
    return res._id;
  } catch (err) {
    common_vendor.index.__f__("error", "at utils/cloud.js:58", "保存云端失败:", err);
    return null;
  }
}
async function getPlanFromCloud(id) {
  const db2 = getDB();
  if (!db2)
    return null;
  try {
    const res = await db2.collection(COLLECTION_NAME).doc(id).get();
    if (res.data) {
      common_vendor.index.__f__("log", "at utils/cloud.js:77", "云端获取方案成功:", res.data);
      return res.data;
    }
    return null;
  } catch (err) {
    common_vendor.index.__f__("error", "at utils/cloud.js:82", "云端获取方案失败:", err);
    return null;
  }
}
async function getPlanByPlanId(planId) {
  const db2 = getDB();
  if (!db2)
    return null;
  try {
    const res = await db2.collection(COLLECTION_NAME).where({
      planId
    }).orderBy("_createTime", "desc").limit(1).get();
    if (res.data && res.data.length > 0) {
      common_vendor.index.__f__("log", "at utils/cloud.js:162", "通过planId找回方案成功:", res.data[0]);
      return res.data[0];
    }
    return null;
  } catch (err) {
    common_vendor.index.__f__("error", "at utils/cloud.js:167", "通过planId找回方案失败:", err);
    return null;
  }
}
const CLAIMS_COLLECTION = "claims";
async function getClaimsForPlan(planId) {
  const db2 = getDB();
  if (!db2)
    return [];
  try {
    const res = await db2.collection(CLAIMS_COLLECTION).where({
      planId
    }).get();
    return res.data || [];
  } catch (err) {
    common_vendor.index.__f__("error", "at utils/cloud.js:193", "获取领取记录失败:", err);
    return [];
  }
}
async function createClaim(planId, seatIndex, oddrtyId) {
  const db2 = getDB();
  if (!db2)
    return false;
  try {
    await db2.collection(CLAIMS_COLLECTION).add({
      data: {
        planId,
        seatIndex,
        oddrtyId,
        claimTime: db2.serverDate()
      }
    });
    common_vendor.index.__f__("log", "at utils/cloud.js:218", "领取记录创建成功:", planId, seatIndex);
    return true;
  } catch (err) {
    common_vendor.index.__f__("error", "at utils/cloud.js:221", "创建领取记录失败:", err);
    return false;
  }
}
exports.createClaim = createClaim;
exports.getClaimsForPlan = getClaimsForPlan;
exports.getPlanByPlanId = getPlanByPlanId;
exports.getPlanFromCloud = getPlanFromCloud;
exports.savePlanToCloud = savePlanToCloud;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/cloud.js.map
