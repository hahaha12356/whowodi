"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
const utils_storage = require("./utils/storage.js");
if (!Math) {
  "./pages/index/index.js";
  "./pages/result/result.js";
  "./pages/view/view.js";
  "./pages/history/history.js";
}
const _sfc_main = {
  onLaunch: function() {
    common_vendor.index.__f__("log", "at App.vue:7", "App Launch");
    try {
      if (typeof common_vendor.wx$1 !== "undefined" && common_vendor.wx$1.cloud) {
        common_vendor.wx$1.cloud.init({
          env: "product01-whowodi-3ea0iy84a7cf58",
          traceUser: true
        });
        common_vendor.index.__f__("log", "at App.vue:17", "云开发初始化成功");
      } else {
        common_vendor.index.__f__("warn", "at App.vue:19", "当前环境不支持 wx.cloud，无法使用云开发能力");
      }
    } catch (e) {
      common_vendor.index.__f__("error", "at App.vue:22", "云开发初始化失败:", e);
    }
    this.cleanExpiredData();
  },
  onShow: function() {
    common_vendor.index.__f__("log", "at App.vue:29", "App Show");
  },
  onHide: function() {
    common_vendor.index.__f__("log", "at App.vue:32", "App Hide");
  },
  methods: {
    // 清理过期数据
    async cleanExpiredData() {
      try {
        await utils_storage.cleanExpiredData();
      } catch (error) {
        common_vendor.index.__f__("error", "at App.vue:40", "清理过期数据失败:", error);
      }
    }
  }
};
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  return {
    app
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
