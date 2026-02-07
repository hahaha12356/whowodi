"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_storage = require("../../utils/storage.js");
const utils_constants = require("../../utils/constants.js");
const utils_cloud = require("../../utils/cloud.js");
const utils_ui = require("../../utils/ui.js");
const _sfc_main = {
  data() {
    return {
      planId: "",
      planData: null,
      // 从URL解析的方案数据
      plan: null,
      myAssignment: null,
      hasViewed: false,
      showCountdown: false,
      countdown: 3,
      showCard: false,
      isProcessing: false,
      // 核心：标记正在分配
      userId: ""
    };
  },
  computed: {
    typeText() {
      return this.myAssignment ? utils_constants.TYPE_TEXT[this.myAssignment.type] || "" : "";
    },
    tipText() {
      return this.myAssignment ? utils_constants.TYPE_TIPS[this.myAssignment.type] || "" : "";
    }
  },
  async onLoad(options) {
    this.userId = utils_storage.getUserId();
    common_vendor.index.__f__("log", "at pages/view/view.vue:113", "view页面接收到的参数:", options);
    this.lastOptions = options;
    await this.handleOptions(options);
  },
  async onShow() {
    let enterOptions = {};
    if (common_vendor.index.getEnterOptionsSync) {
      enterOptions = common_vendor.index.getEnterOptionsSync();
    } else {
      enterOptions = common_vendor.index.getLaunchOptionsSync();
    }
    common_vendor.index.__f__("log", "at pages/view/view.vue:131", "App onShow/Enter Options:", enterOptions);
    if (!this.plan && enterOptions && enterOptions.query) {
      const query = enterOptions.query;
      if (JSON.stringify(query) !== JSON.stringify(this.lastOptions)) {
        common_vendor.index.__f__("log", "at pages/view/view.vue:139", "检测到新的热启动参数，尝试加载:", query);
        await this.handleOptions(query);
      }
    }
  },
  methods: {
    // 统一处理参数逻辑
    // 统一处理参数逻辑
    async handleOptions(options) {
      if (options.cid) {
        await this.loadCloudPlan(options.cid);
        return;
      }
      if (options.q) {
        try {
          const rawQ = decodeURIComponent(options.q);
          const parts = rawQ.split("|");
          if (parts.length >= 7) {
            const pid = parts[0];
            utils_ui.showLoading("同步中...");
            const cloudPlan = await utils_cloud.getPlanByPlanId(pid);
            utils_ui.hideLoading();
            if (cloudPlan) {
              this.planId = pid;
              this.plan = cloudPlan;
              this.plan.cloudId = cloudPlan._id;
              this.checkViewStatus();
              utils_storage.savePlan(this.plan);
              return;
            }
            this.planData = {
              pid,
              tc: parseInt(parts[1]),
              ac: parseInt(parts[2]),
              bc: parseInt(parts[3]),
              cc: parseInt(parts[4]),
              wa: parts[5],
              wb: parts[6]
            };
            this.planId = pid;
            this.plan = this.createPlanFromData(this.planData);
            this.checkViewStatus();
            return;
          }
        } catch (e) {
          common_vendor.index.__f__("error", "at pages/view/view.vue:183", e);
        }
      }
      if (options.pid && options.wa) {
        this.planData = {
          pid: options.pid,
          tc: parseInt(options.tc),
          ac: parseInt(options.ac),
          bc: parseInt(options.bc),
          cc: parseInt(options.cc || 0),
          wa: decodeURIComponent(options.wa),
          wb: decodeURIComponent(options.wb)
        };
        this.planId = options.pid;
        this.plan = this.createPlanFromData(this.planData);
        this.checkViewStatus();
        return;
      }
      if (options.planId) {
        this.planId = options.planId;
        this.init();
      }
    },
    // 核心分配逻辑：自动、随机、使用claims集合避免权限问题
    async startAutoAssign() {
      if (this.hasViewed || this.isProcessing)
        return;
      if (this.plan && this.plan.creatorId && this.plan.creatorId === this.userId) {
        common_vendor.index.showModal({
          title: "主持人不可领牌",
          content: "您是本局游戏的主持人，不能参与领牌。请将链接分享给其他玩家。",
          showCancel: false
        });
        return;
      }
      this.isProcessing = true;
      await new Promise((r) => setTimeout(r, 800));
      try {
        const assignment = await this.getRobustAssignment();
        this.isProcessing = false;
        if (assignment) {
          this.selectedAssignment = assignment;
          this.startView();
        }
      } catch (err) {
        this.isProcessing = false;
        common_vendor.index.__f__("error", "at pages/view/view.vue:233", "领取失败:", err);
        let content = "网络拥堵，请稍后重试";
        if (err.message && err.message.includes("PERMISSION_DENIED")) {
          content = "数据库权限不足：非房主用户无法写入记录。请联系房主将plans集合权限设置为“所有用户可读、所有用户可写”。";
        }
        common_vendor.index.showModal({
          title: "领取身份失败",
          content,
          showCancel: false
        });
      }
    },
    async getRobustAssignment(retry = 0) {
      if (retry > 5) {
        common_vendor.index.showToast({ title: "网络繁忙，请重试", icon: "none" });
        return null;
      }
      const assignments = this.plan.assignments;
      const myUserId = this.userId;
      const localData = common_vendor.index.getStorageSync(`view_${this.planId}_${this.userId}`);
      if (localData && localData.assignment) {
        return localData.assignment;
      }
      const claims = await utils_cloud.getClaimsForPlan(this.planId);
      common_vendor.index.__f__("log", "at pages/view/view.vue:266", "当前已领取记录:", claims);
      const myClaim = claims.find((c) => c.oddrtyId === myUserId);
      if (myClaim) {
        const myAssign = assignments.find((a) => a.index === myClaim.seatIndex);
        if (myAssign)
          return myAssign;
      }
      const claimedSeats = new Set(claims.map((c) => c.seatIndex));
      const emptySeats = assignments.filter((a) => !claimedSeats.has(a.index));
      if (emptySeats.length === 0) {
        common_vendor.index.showToast({ title: "所有人已领完", icon: "none" });
        return null;
      }
      const target = emptySeats[Math.floor(Math.random() * emptySeats.length)];
      common_vendor.index.__f__("log", "at pages/view/view.vue:289", "随机选中座位:", target.index);
      const success = await utils_cloud.createClaim(this.planId, target.index, myUserId);
      if (!success) {
        await new Promise((r) => setTimeout(r, 500));
        return this.getRobustAssignment(retry + 1);
      }
      const freshClaims = await utils_cloud.getClaimsForPlan(this.planId);
      const sameSeatClaims = freshClaims.filter((c) => c.seatIndex === target.index);
      if (sameSeatClaims.length > 1) {
        sameSeatClaims.sort((a, b) => {
          const timeA = a.claimTime ? new Date(a.claimTime).getTime() : 0;
          const timeB = b.claimTime ? new Date(b.claimTime).getTime() : 0;
          return timeA - timeB;
        });
        const winner = sameSeatClaims[0];
        if (winner.oddrtyId !== myUserId) {
          common_vendor.index.__f__("warn", "at pages/view/view.vue:316", "并发冲突，正在换号重试...");
          return this.getRobustAssignment(retry + 1);
        }
      }
      common_vendor.index.__f__("log", "at pages/view/view.vue:322", "领取成功:", target.index);
      return target;
    },
    // 严谨倒计时
    startView() {
      this.countdown = 3;
      this.showCountdown = true;
      this.startTimer();
    },
    startTimer() {
      if (this.timer)
        clearInterval(this.timer);
      this.timer = setInterval(() => {
        this.countdown--;
        if (this.countdown <= 0) {
          clearInterval(this.timer);
          this.timer = null;
          this.showCountdown = false;
          this.assignAndShow();
        }
      }, 500);
    },
    async assignAndShow() {
      const a = this.selectedAssignment || this.myAssignment;
      if (!a)
        return;
      this.myAssignment = a;
      this.showCard = true;
      const key = `view_${this.planId}_${this.userId}`;
      common_vendor.index.setStorageSync(key, { assignment: a, time: Date.now() });
      this.hasViewed = true;
    },
    async loadCloudPlan(cloudId) {
      try {
        const p = await utils_cloud.getPlanFromCloud(cloudId);
        if (p) {
          this.plan = p;
          this.plan.cloudId = cloudId;
          this.planId = p.planId;
          this.checkViewStatus();
          utils_storage.savePlan(this.plan);
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/view/view.vue:371", "拉取云端方案失败", e);
      }
    },
    createPlanFromData(data) {
      return {
        planId: data.pid,
        config: { totalCount: data.tc, typeACount: data.ac, typeBCount: data.bc, typeCCount: data.cc },
        wordPair: { wordA: data.wa, wordB: data.wb },
        assignments: this.generateAssignments(data),
        createTime: Date.now()
      };
    },
    generateAssignments(data) {
      const arr = [];
      for (let i = 0; i < data.ac; i++)
        arr.push({ type: "A", word: data.wa });
      for (let i = 0; i < data.bc; i++)
        arr.push({ type: "B", word: data.wb });
      for (let i = 0; i < (data.cc || 0); i++)
        arr.push({ type: "C", word: null });
      return arr.map((it, i) => ({ ...it, index: i + 1, viewed: false, userId: null }));
    },
    checkViewStatus() {
      const data = common_vendor.index.getStorageSync(`view_${this.planId}_${this.userId}`);
      if (data) {
        this.hasViewed = true;
        this.myAssignment = data.assignment;
      }
    },
    viewAgain() {
      if (this.myAssignment)
        this.showCard = true;
    },
    hideCard() {
      this.showCard = false;
    },
    showErrorAndBack() {
      common_vendor.index.reLaunch({ url: "/pages/index/index" });
    },
    init() {
      this.loadPlan();
    },
    async loadPlan() {
      this.plan = await utils_storage.getPlanById(this.planId);
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.plan && !$data.showCard && !$data.isProcessing
  }, $data.plan && !$data.showCard && !$data.isProcessing ? {
    b: common_vendor.t($data.plan.planId)
  } : {}, {
    c: $data.plan && !$data.showCard && !$data.isProcessing
  }, $data.plan && !$data.showCard && !$data.isProcessing ? {
    d: common_vendor.t($data.plan.config.totalCount)
  } : {}, {
    e: $data.isProcessing
  }, $data.isProcessing ? {} : {}, {
    f: !$data.hasViewed && $data.plan && !$data.showCard && !$data.isProcessing
  }, !$data.hasViewed && $data.plan && !$data.showCard && !$data.isProcessing ? {
    g: common_vendor.o((...args) => $options.startAutoAssign && $options.startAutoAssign(...args))
  } : {}, {
    h: $data.hasViewed && $data.plan && !$data.showCard && !$data.isProcessing
  }, $data.hasViewed && $data.plan && !$data.showCard && !$data.isProcessing ? {
    i: common_vendor.t($data.myAssignment.index),
    j: common_vendor.o((...args) => $options.viewAgain && $options.viewAgain(...args))
  } : {}, {
    k: $data.showCard && $data.myAssignment
  }, $data.showCard && $data.myAssignment ? common_vendor.e({
    l: $data.myAssignment.word
  }, $data.myAssignment.word ? {
    m: common_vendor.t($data.myAssignment.word)
  } : {}, {
    n: common_vendor.t($data.myAssignment.index),
    o: common_vendor.o((...args) => $options.hideCard && $options.hideCard(...args)),
    p: common_vendor.n(`type-${$data.myAssignment.type}`)
  }) : {}, {
    q: $data.showCountdown
  }, $data.showCountdown ? {
    r: common_vendor.t($data.countdown)
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-56affd5a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/view/view.js.map
