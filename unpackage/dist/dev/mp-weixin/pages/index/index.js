"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_algorithm = require("../../utils/algorithm.js");
const utils_storage = require("../../utils/storage.js");
const utils_ui = require("../../utils/ui.js");
const static_data_wordLibrary = require("../../static/data/wordLibrary.js");
const _sfc_main = {
  data() {
    return {
      playerCount: 4,
      impostorCount: 1,
      blankCount: 0,
      showRulesModal: false,
      selectedCategoryId: "classic",
      categories: [],
      currentWordPair: {
        wordA: "桃子",
        wordB: "李子"
      }
    };
  },
  onLoad() {
    this.loadCategories();
    this.loadRandomWordPair();
  },
  onShow() {
    this.checkClipboard();
  },
  methods: {
    // 检查剪贴板口令
    checkClipboard() {
      common_vendor.index.getClipboardData({
        success: (res) => {
          const content = res.data || "";
          const match = content.match(/🔑谁是卧底口令【(.*?)】/);
          if (match && match[1]) {
            const qVal = match[1];
            common_vendor.index.__f__("log", "at pages/index/index.vue:197", "检测到口令:", qVal);
            const lastToken = common_vendor.index.getStorageSync("last_token");
            if (lastToken === qVal)
              return;
            common_vendor.index.showModal({
              title: "发现口令",
              content: "检测到谁是卧底游戏口令，是否立即领取身份？",
              confirmText: "去领取",
              success: (res2) => {
                if (res2.confirm) {
                  common_vendor.index.setStorageSync("last_token", qVal);
                  common_vendor.index.setClipboardData({ data: " " });
                  common_vendor.index.navigateTo({
                    url: `/pages/view/view?q=${encodeURIComponent(qVal)}`
                  });
                }
              }
            });
          }
        },
        fail: () => {
        }
      });
    },
    // 加载词库分类
    loadCategories() {
      this.categories = static_data_wordLibrary.wordLibrary.categories.filter((c) => c.enabled);
      if (this.categories.length > 0) {
        this.selectedCategoryId = this.categories[0].id;
      }
    },
    // 调整人数
    adjustPlayerCount(delta) {
      const newValue = this.playerCount + delta;
      if (newValue >= 3 && newValue <= 20) {
        this.playerCount = newValue;
        const maxImpostor = Math.floor(this.playerCount / 3);
        if (this.impostorCount > maxImpostor) {
          this.impostorCount = maxImpostor;
        }
        const maxBlank = 2;
        const remainingSlots = this.playerCount - this.impostorCount - 1;
        if (this.blankCount > Math.min(maxBlank, remainingSlots)) {
          this.blankCount = Math.max(0, Math.min(maxBlank, remainingSlots));
        }
      }
    },
    // 调整卧底人数
    adjustImpostorCount(delta) {
      const newValue = this.impostorCount + delta;
      const maxImpostor = Math.floor(this.playerCount / 3);
      if (newValue >= 1 && newValue <= maxImpostor) {
        this.impostorCount = newValue;
        const remainingSlots = this.playerCount - this.impostorCount - 1;
        if (this.blankCount > remainingSlots) {
          this.blankCount = Math.max(0, remainingSlots);
        }
      }
    },
    // 调整白板人数
    adjustBlankCount(delta) {
      const newValue = this.blankCount + delta;
      const maxBlank = 2;
      const remainingSlots = this.playerCount - this.impostorCount - 1;
      if (newValue >= 0 && newValue <= Math.min(maxBlank, remainingSlots)) {
        this.blankCount = newValue;
      }
    },
    // 选择分类
    selectCategory(categoryId) {
      this.selectedCategoryId = categoryId;
      this.loadRandomWordPair();
    },
    // 加载随机词语对
    loadRandomWordPair() {
      const category = static_data_wordLibrary.wordLibrary.categories.find((c) => c.id === this.selectedCategoryId);
      if (category && category.words && category.words.length > 0) {
        const randomIndex = Math.floor(Math.random() * category.words.length);
        this.currentWordPair = category.words[randomIndex];
      } else {
        const allCategories = static_data_wordLibrary.wordLibrary.categories.filter((c) => c.enabled);
        const randomCat = allCategories[Math.floor(Math.random() * allCategories.length)];
        if (randomCat && randomCat.words && randomCat.words.length > 0) {
          const randomIndex = Math.floor(Math.random() * randomCat.words.length);
          this.currentWordPair = randomCat.words[randomIndex];
        }
      }
    },
    // 切换词语
    shuffleWordPair() {
      this.loadRandomWordPair();
    },
    // 开始发牌
    async startDealing() {
      utils_ui.showLoading("生成中...");
      try {
        const config = {
          totalCount: this.playerCount,
          typeACount: this.playerCount - this.impostorCount - this.blankCount,
          typeBCount: this.impostorCount,
          typeCCount: this.blankCount,
          categoryId: this.selectedCategoryId
        };
        config.fixedWordPair = this.currentWordPair;
        config.creatorId = common_vendor.index.getStorageSync("userId");
        const plan = utils_algorithm.generatePlan(config);
        await utils_storage.savePlan(plan);
        common_vendor.index.navigateTo({
          url: `/pages/result/result?planId=${plan.planId}`
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:338", "生成方案失败:", error);
        utils_ui.showToast("生成失败，请重试");
      } finally {
        utils_ui.hideLoading();
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o(($event) => $data.showRulesModal = true),
    b: $data.showRulesModal
  }, $data.showRulesModal ? {
    c: common_vendor.o(($event) => $data.showRulesModal = false),
    d: common_vendor.o(() => {
    }),
    e: common_vendor.o(($event) => $data.showRulesModal = false)
  } : {}, {
    f: common_vendor.o(($event) => $options.adjustPlayerCount(-1)),
    g: common_vendor.t($data.playerCount),
    h: common_vendor.o(($event) => $options.adjustPlayerCount(1)),
    i: common_vendor.o(($event) => $options.adjustImpostorCount(-1)),
    j: common_vendor.t($data.impostorCount),
    k: common_vendor.o(($event) => $options.adjustImpostorCount(1)),
    l: common_vendor.o(($event) => $options.adjustBlankCount(-1)),
    m: common_vendor.t($data.blankCount),
    n: common_vendor.o(($event) => $options.adjustBlankCount(1)),
    o: common_vendor.f($data.categories, (cat, k0, i0) => {
      return {
        a: common_vendor.t(cat.name),
        b: cat.id,
        c: common_vendor.n({
          active: $data.selectedCategoryId === cat.id
        }),
        d: common_vendor.o(($event) => $options.selectCategory(cat.id), cat.id)
      };
    }),
    p: common_vendor.o((...args) => $options.shuffleWordPair && $options.shuffleWordPair(...args)),
    q: common_vendor.t($data.currentWordPair.wordA),
    r: common_vendor.t($data.currentWordPair.wordB),
    s: common_vendor.o((...args) => $options.startDealing && $options.startDealing(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-1cf27b2a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
