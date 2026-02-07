"use strict";
const utils_constants = require("./constants.js");
const static_data_wordLibrary = require("../static/data/wordLibrary.js");
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}
function generatePlanId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 4; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}
function getWordPair(categoryId) {
  let category;
  if (categoryId === "random") {
    const categories = static_data_wordLibrary.wordLibrary.categories.filter((c) => c.enabled);
    category = categories[Math.floor(Math.random() * categories.length)];
  } else {
    category = static_data_wordLibrary.wordLibrary.categories.find((c) => c.id === categoryId);
  }
  if (!category || !category.words || category.words.length === 0) {
    throw new Error("词库数据错误");
  }
  const wordPair = category.words[Math.floor(Math.random() * category.words.length)];
  return {
    ...wordPair,
    categoryId: category.id
  };
}
function generatePlan(config) {
  const { totalCount, typeACount, typeBCount, typeCCount, categoryId, fixedWordPair } = config;
  let wordPair;
  if (fixedWordPair && fixedWordPair.wordA && fixedWordPair.wordB) {
    wordPair = {
      wordA: fixedWordPair.wordA,
      wordB: fixedWordPair.wordB,
      categoryId: categoryId || "classic"
    };
  } else {
    wordPair = getWordPair(categoryId);
  }
  const assignments = [];
  for (let i = 0; i < typeACount; i++) {
    assignments.push({
      type: "A",
      word: wordPair.wordA
    });
  }
  for (let i = 0; i < typeBCount; i++) {
    assignments.push({
      type: "B",
      word: wordPair.wordB
    });
  }
  for (let i = 0; i < typeCCount; i++) {
    assignments.push({
      type: "C",
      word: null
    });
  }
  const shuffled = shuffleArray(assignments);
  const finalAssignments = shuffled.map((item, index) => ({
    ...item,
    index: index + 1,
    viewed: false,
    userId: null,
    viewTime: null
  }));
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
    creatorId: config.creatorId || null,
    // 记录创建者ID
    viewCount: 0,
    status: "active"
  };
  return plan;
}
function isPlanExpired(plan) {
  return Date.now() - plan.createTime > utils_constants.PLAN_EXPIRE_TIME;
}
exports.generatePlan = generatePlan;
exports.isPlanExpired = isPlanExpired;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/algorithm.js.map
