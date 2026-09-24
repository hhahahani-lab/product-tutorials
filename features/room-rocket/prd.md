# Room Rocket 房间火箭玩法 PRD

## 一、功能说明

房间内新增 Room Rocket 玩法。

用户在房间内送礼可增加当前火箭 Energy。Energy 达到目标值后，火箭自动发射并结算奖励，随后进入下一等级。

核心流程：

**送礼 → 火箭充能 → 满值发射 → 发放奖励 → 进入下一等级**

---

## 二、Rocket Energy

### 2.1 Energy 计算

房间内任意用户收到礼物增加 Rocket Energy：

- Regular Gift：1 Coin = 1 Energy
- Lucky Gift：按礼物 Coins 的 10% 计入

用户对应增加相同数值的 Contribution。

---

## 三、Rocket Level

火箭共设置多个等级。

| Level | Target Energy |
|---|---:|
| 1 | 100,000 |
| 2 | 300,000 |
| 3 | 800,000 |
| 4 | 2,000,000 |
| 5 | 5,000,000 |

具体等级数量、Target Energy 及奖励均由服务端配置。

每个等级独立计算：

- Rocket Energy
- Contribution Ranking
- Ranking Reward
- Lucky Reward

当前等级完成后，下一等级 Energy 从 0 开始重新累计。

最高等级完成后可继续循环最高等级，直到每日重置。

---

## 四、Rocket Launch

当当前 Rocket Energy 达到 Target Energy 后，当前火箭自动发射。发射后：

1. 结算当前 Level Contribution Ranking
2. 发放 Ranking Reward
3. 进入 In Room Lucky Reward 开奖流程
4. 当前房间播放 Rocket Launch Animation
5. 触发 World Banner
6. 本轮开奖完成后进入下一 Rocket Level

---

## 五、超额送礼

若单笔礼物超过当前 Rocket 剩余 Energy，超出的 Energy 不转入下一等级，下一等级仍从 0 开始。

---

## 六、Contribution Ranking

每个 Rocket Level 独立统计。

Contribution：用户在当前 Rocket Level 内累计贡献的有效 Rocket Energy。

排序：按贡献值从高到低；数值相同时，先达到该值的用户排名靠前。

榜单：

- 开奖前展示 **Top 10** 用户
- Level 已完成后仅展示 **Top 3** 用户

---

## 七、Ranking Reward

每个 Rocket Level 发射后，向符合条件的：

**Top 1 / Top 2 / Top 3** 用户发放对应固定奖励。

### 奖励资格

服务端配置 Minimum Contribution。

未达到最低贡献要求的排名不获得奖励，奖励不向后顺延。

---

## 八、In Room Lucky Reward

Rocket 发射后进入本轮 In Room Reward 开奖。

### 开奖流程

**Rocket 100% → World Banner → 点击进入房间 → Rocket Launch Animation → 10s Countdown → 自动开奖**

### Eligible Users

倒计时结束瞬间：

仍在当前房间且符合参与条件的用户，进入本轮 In Room Reward Eligible Pool。

- 倒计时期间进入房间 → 可以参与
- 倒计时结束前离开房间 → 不参与
- 开奖完成后进入房间 → 不参与本轮

服务端：

- 获取开奖瞬间的 Eligible Users
- 根据配置规则（获奖人数、Reward Pool、奖励权重 / 概率）确定中奖用户以及奖励
- 自动发放奖励
- 返回开奖结果

同一用户单次 Rocket Launch 最多获得一次 In Room Reward。

---

## 九、奖励类型

支持配置：

- 金币、金豆
- Wealth EXP
- 头像框、发言气泡、徽章、名片框、座驾
- 房间边框、卡片、背景、标签

不同 Rocket Level 可配置不同奖励。

---

## 十、Daily Reset

每天 **00:00（UTC+5）** 重置 Rocket：

- Rocket Level → Lv.1
- Current Energy → 0
- Current Contribution Ranking → 清空
- 当日奖励次数 → 清零

Winning Record 保留。

---

## 十一、房间 Rocket 挂件

房间内增加 Rocket 挂件入口，展示：

- 当前 Rocket 等级和进度

点击挂件，打开 Room Rocket 页面。

Rocket Energy 变化时实时更新进度；Rocket 发射并进入下一等级后，挂件同步更新。

---

## 十二、Room Rocket 玩法主页面

展示 Rocket 信息：

- 当前查看的 Rocket Level
- Rocket 主视觉
- Energy 进度条
- Current Energy / Target Energy
- Energy Percentage
- Reset Countdown

### Rocket Level

- 每次进入 Room Rocket 页面时，默认选中当前正在进行中的 Rocket Level
- 所有等级均支持点击查看
- 当前查看的 Level 使用高亮选中态
- 切换 Level 后，同步切换对应的：
  - Rocket 主视觉
  - Energy 进度
  - Rewards
  - Ranking
- 已完成 Level 显示 100%
- 当前进行中的 Level 显示实时进度
- 未开始 Level 显示 0%

### Rewards

展示当前查看 Rocket Level 对应的奖励：

- Top 1 Reward
- Top 2 Reward
- Top 3 Reward
- In Room Lucky Reward

通过 Tab 切换查看对应奖励。

### Ranking

展示当前查看 Level 的 Top 10 Contribution Ranking：

- 排名
- 用户头像
- 昵称
- 贡献值

---

## 十三、房间发射反馈

Rocket 达到 100% 后，在房间页面展示发射效果。

展示：

- Rocket Launch Animation
- 当前 Rocket Level 发射完成
- 房间挂件在本轮开奖完成并进入下一等级后同步切换

---

## 十四、World Banner

每次 Rocket 成功发射后，触发一条全服 World Banner。点击 World Banner 可进入对应房间。

展示：

- 触发用户昵称 launched Lv.X Rocket in 房间名称!

触发用户：**最后一笔有效送礼使 Rocket Energy 达到 100% 的用户**

---

## 十五、Rocket Launch Animation

用户通过 World Banner 进入对应房间后展示 Rocket Launch Animation。

动画中：

- 展示当前 Rocket
- 固定展示本轮 **Top1 用户头像**
- Top1 Avatar 固定在画面上方，不随 Rocket 动画移动
- Avatar 下方展示 TOP 1
- 不展示 Top1 用户昵称
- 播放 Rocket 发射动画
- 同步展示本轮统一 Countdown

Countdown 仅展示数字：

**10 → 9 → 8 → … → 1**

---

## 十六、统一开奖倒计时

10s Countdown 为**本轮 Rocket 的统一服务端时间**，不是用户进入房间后重新开始。

示例：

Rocket Launch：

**20:10:00**

开奖：

**20:10:10**

用户：

- 20:10:03 进入 → 看到剩余 7s
- 20:10:09 进入 → 看到剩余 1s
- 20:10:11 进入 → 本轮已开奖，不重新开始 Countdown

---

## 十七、开奖结果

Countdown 结束后自动展示开奖弹窗。

### 当前用户

展示：

- 是否中奖
- 奖励缩略图
- 奖励名称
- 奖励数量 / 时长

未中奖时展示对应未中奖状态。

### Other Winners

同时展示本轮其他中奖用户：

- 用户头像
- 用户昵称
- 奖励缩略图
- 奖励名称 / 数量 / 时长

中奖用户的奖励自动到账，无需再次点击领取。

中奖记录写入 Winning Record；未中奖不写入。

---

## 十八、Winning Record

Room Rocket 页面提供 Winning Record 入口。

点击后打开底部弹窗，展示用户自己的 Rocket 获奖记录。

记录列表：

- 奖励名称 × 数量（单位，如有）
- 类型：Ranking / Lucky
- Rocket Level
- Time：YYYY/MM/DD HH:mm:ss

---

## 十九、关键规则汇总

- Regular Gift：100% 计入 Energy
- Lucky Gift：10% 计入 Energy
- 超额 Energy 不跨 Level
- Contribution 按实际有效礼物完整累计
- 当前 Level 100% 时锁定 Ranking
- 100% 时立即触发 World Banner
- In Room Reward 在统一 10s Countdown 结束时开奖
- 开奖瞬间仍在房间的 Eligible Users 才参与
- 无手动 Claim
- 奖励自动到账
- 每个 Level 独立 Ranking / Reward
- 每日 00:00 UTC+5 重置
