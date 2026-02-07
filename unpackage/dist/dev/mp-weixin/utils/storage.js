"use strict";
const common_vendor = require("../common/vendor.js");
const utils_algorithm = require("./algorithm.js");
const utils_constants = require("./constants.js");
async function savePlan(plan) {
  try {
    const plans = await getAllPlans();
    const index = plans.findIndex((p) => p.planId === plan.planId);
    if (index >= 0) {
      plans[index] = plan;
    } else {
      plans.push(plan);
    }
    const validPlans = plans.filter((p) => !utils_algorithm.isPlanExpired(p));
    common_vendor.index.setStorageSync(utils_constants.STORAGE_KEYS.PLANS, validPlans);
    await saveToHistory(plan);
    return true;
  } catch (error) {
    common_vendor.index.__f__("error", "at utils/storage.js:37", "保存方案失败:", error);
    return false;
  }
}
async function getAllPlans() {
  try {
    const plans = common_vendor.index.getStorageSync(utils_constants.STORAGE_KEYS.PLANS);
    return Array.isArray(plans) ? plans : [];
  } catch (error) {
    common_vendor.index.__f__("error", "at utils/storage.js:51", "获取方案失败:", error);
    return [];
  }
}
async function getPlanById(planId) {
  try {
    const plans = await getAllPlans();
    const plan = plans.find((p) => p.planId === planId);
    if (!plan) {
      return null;
    }
    if (utils_algorithm.isPlanExpired(plan)) {
      await deletePlan(planId);
      return null;
    }
    return plan;
  } catch (error) {
    common_vendor.index.__f__("error", "at utils/storage.js:78", "获取方案失败:", error);
    return null;
  }
}
async function deletePlan(planId) {
  try {
    const plans = await getAllPlans();
    const filtered = plans.filter((p) => p.planId !== planId);
    common_vendor.index.setStorageSync(utils_constants.STORAGE_KEYS.PLANS, filtered);
    return true;
  } catch (error) {
    common_vendor.index.__f__("error", "at utils/storage.js:94", "删除方案失败:", error);
    return false;
  }
}
async function saveToHistory(plan) {
  try {
    const history = await getHistory();
    const historyItem = {
      planId: plan.planId,
      wordPair: plan.wordPair,
      config: plan.config,
      createTime: plan.createTime
    };
    const index = history.findIndex((h) => h.planId === plan.planId);
    if (index >= 0) {
      history[index] = historyItem;
    } else {
      history.unshift(historyItem);
    }
    const trimmed = history.slice(0, utils_constants.MAX_HISTORY_COUNT);
    common_vendor.index.setStorageSync(utils_constants.STORAGE_KEYS.HISTORY, trimmed);
  } catch (error) {
    common_vendor.index.__f__("error", "at utils/storage.js:129", "保存历史失败:", error);
  }
}
async function getHistory() {
  try {
    const history = common_vendor.index.getStorageSync(utils_constants.STORAGE_KEYS.HISTORY);
    return Array.isArray(history) ? history : [];
  } catch (error) {
    common_vendor.index.__f__("error", "at utils/storage.js:142", "获取历史失败:", error);
    return [];
  }
}
async function deleteHistory(planId) {
  try {
    const history = await getHistory();
    const filtered = history.filter((h) => h.planId !== planId);
    common_vendor.index.setStorageSync(utils_constants.STORAGE_KEYS.HISTORY, filtered);
    return true;
  } catch (error) {
    common_vendor.index.__f__("error", "at utils/storage.js:158", "删除历史失败:", error);
    return false;
  }
}
async function clearHistory() {
  try {
    common_vendor.index.removeStorageSync(utils_constants.STORAGE_KEYS.HISTORY);
    return true;
  } catch (error) {
    common_vendor.index.__f__("error", "at utils/storage.js:171", "清除历史失败:", error);
    return false;
  }
}
async function cleanExpiredData() {
  try {
    const plans = await getAllPlans();
    const validPlans = plans.filter((p) => !utils_algorithm.isPlanExpired(p));
    common_vendor.index.setStorageSync(utils_constants.STORAGE_KEYS.PLANS, validPlans);
    return true;
  } catch (error) {
    common_vendor.index.__f__("error", "at utils/storage.js:188", "清理过期数据失败:", error);
    return false;
  }
}
function getUserId() {
  let userId = common_vendor.index.getStorageSync(utils_constants.STORAGE_KEYS.USER_ID);
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    common_vendor.index.setStorageSync(utils_constants.STORAGE_KEYS.USER_ID, userId);
  }
  return userId;
}
exports.cleanExpiredData = cleanExpiredData;
exports.clearHistory = clearHistory;
exports.deleteHistory = deleteHistory;
exports.deletePlan = deletePlan;
exports.getHistory = getHistory;
exports.getPlanById = getPlanById;
exports.getUserId = getUserId;
exports.savePlan = savePlan;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/storage.js.map
