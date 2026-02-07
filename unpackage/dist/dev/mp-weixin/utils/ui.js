"use strict";
const common_vendor = require("../common/vendor.js");
const utils_constants = require("./constants.js");
function showToast(title, icon = "none", duration = utils_constants.TOAST_DURATION) {
  common_vendor.index.showToast({
    title,
    icon,
    duration,
    mask: true
  });
}
function showLoading(title = "加载中...") {
  common_vendor.index.showLoading({
    title,
    mask: true
  });
}
function hideLoading() {
  common_vendor.index.hideLoading();
}
function showModal(options = {}) {
  return new Promise((resolve, reject) => {
    common_vendor.index.showModal({
      title: options.title || "提示",
      content: options.content || "",
      showCancel: options.showCancel !== false,
      confirmText: options.confirmText || "确定",
      cancelText: options.cancelText || "取消",
      success: (res) => {
        if (res.confirm) {
          resolve(true);
        } else if (res.cancel) {
          resolve(false);
        }
      },
      fail: reject
    });
  });
}
exports.hideLoading = hideLoading;
exports.showLoading = showLoading;
exports.showModal = showModal;
exports.showToast = showToast;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/ui.js.map
