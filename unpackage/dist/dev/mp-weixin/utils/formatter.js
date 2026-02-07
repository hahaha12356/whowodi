"use strict";
function formatTime(timestamp, format = "datetime") {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");
  switch (format) {
    case "date":
      return `${year}-${month}-${day}`;
    case "time":
      return `${hour}:${minute}:${second}`;
    case "datetime":
      return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    case "simple":
      return `${month}-${day} ${hour}:${minute}`;
    default:
      return `${year}-${month}-${day} ${hour}:${minute}`;
  }
}
function formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const minute = 60 * 1e3;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) {
    return "刚刚";
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`;
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`;
  } else if (diff < 7 * day) {
    return `${Math.floor(diff / day)}天前`;
  } else {
    return formatTime(timestamp, "simple");
  }
}
exports.formatRelativeTime = formatRelativeTime;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/formatter.js.map
