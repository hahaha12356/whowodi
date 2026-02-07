"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_storage = require("../../utils/storage.js");
const utils_formatter = require("../../utils/formatter.js");
const utils_ui = require("../../utils/ui.js");
const _sfc_main = {
  data() {
    return {
      historyList: [],
      loading: true
    };
  },
  onLoad() {
    this.loadHistory();
  },
  // 下拉刷新
  onPullDownRefresh() {
    this.loadHistory();
    setTimeout(() => {
      common_vendor.index.stopPullDownRefresh();
    }, 1e3);
  },
  methods: {
    // 加载历史记录
    async loadHistory() {
      this.loading = true;
      try {
        this.historyList = await utils_storage.getHistory();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/history/history.vue:92", "加载历史失败:", error);
        utils_ui.showToast("加载失败");
      } finally {
        this.loading = false;
      }
    },
    // 查看历史详情
    viewHistory(planId) {
      common_vendor.index.navigateTo({
        url: `/pages/result/result?planId=${planId}`
      });
    },
    // 删除历史记录
    async deleteHistory(planId) {
      const confirmed = await utils_ui.showModal({
        title: "确认删除",
        content: "确定要删除这条历史记录吗？"
      });
      if (confirmed) {
        utils_ui.showLoading("删除中...");
        try {
          await utils_storage.deleteHistory(planId);
          await this.loadHistory();
          utils_ui.showToast("删除成功");
        } catch (error) {
          common_vendor.index.__f__("error", "at pages/history/history.vue:120", "删除失败:", error);
          utils_ui.showToast("删除失败");
        } finally {
          utils_ui.hideLoading();
        }
      }
    },
    // 分享历史
    shareHistory(planId) {
      common_vendor.index.navigateTo({
        url: `/pages/result/result?planId=${planId}`
      });
    },
    // 清空历史
    async handleClear() {
      const confirmed = await utils_ui.showModal({
        title: "确认清空",
        content: "确定要清空所有历史记录吗？"
      });
      if (confirmed) {
        utils_ui.showLoading("清空中...");
        try {
          await utils_storage.clearHistory();
          await this.loadHistory();
          utils_ui.showToast("清空成功");
        } catch (error) {
          common_vendor.index.__f__("error", "at pages/history/history.vue:150", "清空失败:", error);
          utils_ui.showToast("清空失败");
        } finally {
          utils_ui.hideLoading();
        }
      }
    },
    // 格式化相对时间
    formatRelativeTime: utils_formatter.formatRelativeTime
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: !$data.historyList.length && !$data.loading
  }, !$data.historyList.length && !$data.loading ? {} : {
    b: common_vendor.f($data.historyList, (item, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(item.planId),
        b: common_vendor.t($options.formatRelativeTime(item.createTime)),
        c: common_vendor.t(item.wordPair.wordA),
        d: common_vendor.t(item.wordPair.wordB),
        e: common_vendor.t(item.config.totalCount),
        f: common_vendor.t(item.config.typeACount),
        g: common_vendor.t(item.config.typeBCount),
        h: item.config.typeCCount
      }, item.config.typeCCount ? {} : {}, {
        i: item.config.typeCCount
      }, item.config.typeCCount ? {
        j: common_vendor.t(item.config.typeCCount)
      } : {}, {
        k: common_vendor.o(($event) => $options.deleteHistory(item.planId), item.planId),
        l: common_vendor.o(($event) => $options.shareHistory(item.planId), item.planId),
        m: item.planId,
        n: common_vendor.o(($event) => $options.viewHistory(item.planId), item.planId)
      });
    })
  }, {
    c: $data.historyList.length
  }, $data.historyList.length ? {
    d: common_vendor.o((...args) => $options.handleClear && $options.handleClear(...args))
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-b2d018fa"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/history/history.js.map
