# Yaloka 产品原型协作约定

- 先读取 [.agents/pm-working-rules.md](.agents/pm-working-rules.md)。
- 业务运营后台的新增、调整和本地预览默认从最新 `main` 的 `admin/index.html` 开始，按 [后台维护基线](admin/README.md#维护基线) 核对本地版本及累计现金归档范围。
- 新建、修改或检查活动页前，读取 [通用规则入口](rules/README.md)，按任务读取页面、榜单、奖励、弹窗和容器规则，不只读取当前活动PRD。
- 业务价格、比例、门槛、奖项和周期按对应活动PRD使用；通用设计默认不代表业务功能已上线。
- 通用规则统一维护在 `rules/`；活动目录下原 `rules/` 文件仅作兼容入口，不再复制规则正文。
- `.agents/pm-working-rules.md`是公共协作约定维护源；修改后运行 `python3 .agents/scripts/sync-pm-working-rules.py --write`，校验时省略`--write`。不要单独修改各Skill的working-rules副本。
