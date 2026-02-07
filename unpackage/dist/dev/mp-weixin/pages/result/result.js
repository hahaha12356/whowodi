"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_storage = require("../../utils/storage.js");
const utils_algorithm = require("../../utils/algorithm.js");
const utils_ui$1 = require("../../utils/ui.js");
const utils_constants = require("../../utils/constants.js");
const utils_cloud = require("../../utils/cloud.js");
const _sfc_main = {
  data() {
    return {
      plan: null,
      cloudId: null,
      // 云端ID
      isSyncing: false
      // 是否正在上云
    };
  },
  computed: {
    isCloudReady() {
      return !!(this.cloudId || this.plan && this.plan.cloudId);
    }
  },
  async onLoad(options) {
    const { planId } = options;
    if (planId) {
      await this.loadPlan(planId);
      this.uploadToCloud();
    }
  },
  // 下拉刷新
  onPullDownRefresh() {
    this.refreshPlanData();
    setTimeout(() => {
      common_vendor.index.stopPullDownRefresh();
    }, 1e3);
  },
  // 分享配置
  onShareAppMessage() {
    if (!this.plan)
      return {};
    if (this.cloudId) {
      common_vendor.index.__f__("log", "at pages/result/result.vue:144", "使用云端ID分享:", this.cloudId);
      return {
        title: `谁是卧底 # ${this.plan.planId}`,
        path: `/pages/view/view?cid=${this.cloudId}`
      };
    }
    const qVal = this.getQValue();
    common_vendor.index.__f__("log", "at pages/result/result.vue:153", "云端ID未就绪，使用q参数降级分享:", qVal);
    return {
      title: `谁是卧底 # ${this.plan.planId}`,
      path: `/pages/view/view?q=${encodeURIComponent(qVal)}`
    };
  },
  onShareTimeline() {
    if (!this.plan)
      return {};
    if (this.cloudId) {
      return {
        title: `谁是卧底 # ${this.plan.planId}`,
        query: `cid=${this.cloudId}`
      };
    }
    const qVal = this.getQValue();
    return {
      title: `谁是卧底 # ${this.plan.planId}`,
      query: `q=${encodeURIComponent(qVal)}`
    };
  },
  methods: {
    // 上传到云端
    async uploadToCloud() {
      if (!this.plan || this.cloudId || this.plan && this.plan.cloudId) {
        if (this.plan && this.plan.cloudId)
          this.cloudId = this.plan.cloudId;
        return;
      }
      common_vendor.index.__f__("log", "at pages/result/result.vue:188", "开始上传方案到云端...");
      this.isSyncing = true;
      try {
        const id = await utils_cloud.savePlanToCloud(this.plan);
        if (id) {
          this.cloudId = id;
          this.plan.cloudId = id;
          await utils_storage.savePlan(this.plan);
          common_vendor.index.__f__("log", "at pages/result/result.vue:198", "云端保存成功，ID:", id);
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/result/result.vue:201", "上传失败，将使用本地分享方案", e);
      } finally {
        this.isSyncing = false;
      }
    },
    // 生成精简分享参数
    getQValue() {
      const p = this.plan;
      const c = p.config;
      const w = p.wordPair;
      const safeWa = w.wordA.replace(/\|/g, "");
      const safeWb = w.wordB.replace(/\|/g, "");
      return [
        p.planId,
        c.totalCount,
        c.typeACount,
        c.typeBCount,
        c.typeCCount || 0,
        safeWa,
        safeWb
      ].join("|");
    },
    // 复制口令（兜底方案）
    copyToken() {
      const qVal = this.getQValue();
      const token = `🔑谁是卧底口令【${qVal}】复制此段文本打开小程序即可领取身份`;
      common_vendor.index.setClipboardData({
        data: token,
        success: () => {
          utils_ui.showToast("口令已复制，发送给好友即可");
        }
      });
    },
    // 加载方案数据
    async loadPlan(planId) {
      this.plan = await utils_storage.getPlanById(planId);
      if (!this.plan) {
        utils_ui$1.showToast("方案不存在或已过期");
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 1500);
      }
    },
    // 获取类型标签
    getTypeLabel(type) {
      return utils_constants.TYPE_TEXT[type] || "未知";
    },
    // 重新生成
    async regenerate() {
      const confirmed = await utils_ui$1.showModal({
        title: "确认重新发牌？",
        content: "重新发牌将覆盖当前方案"
      });
      if (confirmed) {
        await this.doRegenerate();
      }
    },
    async doRegenerate() {
      utils_ui$1.showLoading("生成中...");
      try {
        await utils_storage.deletePlan(this.plan.planId);
        const newConfig = { ...this.plan.config };
        newConfig.creatorId = common_vendor.index.getStorageSync("userId");
        const newPlan = utils_algorithm.generatePlan(newConfig);
        await utils_storage.savePlan(newPlan);
        this.cloudId = null;
        this.plan = newPlan;
        await this.uploadToCloud();
        utils_ui$1.showToast("重新发牌成功");
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/result/result.vue:292", "生成失败:", error);
        utils_ui$1.showToast("生成失败");
      } finally {
        utils_ui$1.hideLoading();
      }
    },
    // 刷新方案数据
    async refreshPlanData() {
      if (this.plan) {
        await this.loadPlan(this.plan.planId);
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.plan
  }, $data.plan ? common_vendor.e({
    b: common_vendor.t($data.plan.planId),
    c: $data.isSyncing
  }, $data.isSyncing ? {} : $options.isCloudReady ? {} : {}, {
    d: $options.isCloudReady,
    e: $options.isCloudReady ? 1 : "",
    f: common_vendor.t($data.plan.wordPair.wordA),
    g: common_vendor.t($data.plan.config.typeACount),
    h: common_vendor.t($data.plan.wordPair.wordB),
    i: common_vendor.t($data.plan.config.typeBCount),
    j: $data.plan.config.typeCCount
  }, $data.plan.config.typeCCount ? {} : {}, {
    k: $data.plan.config.typeCCount
  }, $data.plan.config.typeCCount ? {
    l: common_vendor.t($data.plan.config.typeCCount)
  } : {}, {
    m: common_vendor.o((...args) => $options.regenerate && $options.regenerate(...args)),
    n: common_vendor.f($data.plan.assignments, (assignment, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(assignment.index),
        b: common_vendor.t($options.getTypeLabel(assignment.type)),
        c: common_vendor.n(`role-${assignment.type}`),
        d: assignment.word
      }, assignment.word ? {
        e: common_vendor.t(assignment.word)
      } : {}, {
        f: assignment.viewed
      }, assignment.viewed ? {} : {}, {
        g: assignment.index
      });
    })
  }) : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-b615976f"]]);
_sfc_main.__runtimeHooks = 6;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/result/result.js.map
