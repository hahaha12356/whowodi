"use strict";
const STORAGE_KEYS = {
  PLANS: "word_plans",
  HISTORY: "word_history",
  CONFIG: "word_config",
  USER_ID: "userId"
};
const TYPE_TEXT = {
  A: "平民",
  B: "卧底",
  C: "白板"
};
const TYPE_TIPS = {
  A: "你是平民，找出谁是卧底",
  B: "你是卧底，隐藏好自己的身份",
  C: "你是白板，通过观察推测词语"
};
const PLAN_EXPIRE_TIME = 24 * 60 * 60 * 1e3;
const MAX_HISTORY_COUNT = 50;
const TOAST_DURATION = 2e3;
exports.MAX_HISTORY_COUNT = MAX_HISTORY_COUNT;
exports.PLAN_EXPIRE_TIME = PLAN_EXPIRE_TIME;
exports.STORAGE_KEYS = STORAGE_KEYS;
exports.TOAST_DURATION = TOAST_DURATION;
exports.TYPE_TEXT = TYPE_TEXT;
exports.TYPE_TIPS = TYPE_TIPS;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/constants.js.map
