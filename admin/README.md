# 业务运营后台 Demo

- [房间贡献周奖励调整 PRD](room-contribution-rewards.md)

- [在线预览](https://hhahahani-lab.github.io/product-tutorials/admin/)
- [HTML](index.html)

包含当前完整后台模块及邀请新用户奖励统计。仅使用模拟数据，未接入真实账号、查询或发奖服务。

## 维护基线

- 新增、调整和本地预览业务运营后台，默认从个人仓库最新 `main` 的 [`admin/index.html`](index.html) 开始。本地先核对 `origin/main`，已有未提交改动按任务所需作为增量合并。这个入口对应 [在线后台](https://hhahahani-lab.github.io/product-tutorials/admin/)。
- 旧预览 `features/management-backend/` 和各处同步副本用于查阅对应交付版本。累计现金后台及其专用账单 H5 归档在 `demo/accumulated-cash`，仅在用户明确要求回顾或恢复该方案时使用。[累计现金历史分支](https://github.com/hhahahani-lab/product-tutorials/tree/demo/accumulated-cash)
- 修改前及发布前，在默认后台和它加载的业务脚本中检查累计现金入口、账单选择和发放代码。可用 `累计现金`、`Accumulated Cash`、`low-cash-settlement`、`cashSettlementDemo` 和 `lowCashChoice` 定位。确认主干中没有这些逻辑，并核对专用 H5 的旧路径 `features/low-amount-settlement/salary-bill-h5.html` 已下线。
