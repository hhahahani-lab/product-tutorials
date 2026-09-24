# Room Rocket 房间火箭玩法 PRD

## 一、功能说明

用户在房间内送礼为 Rocket 累积 Energy。

Rocket Energy 达到当前等级目标后，触发火箭发射及 World Banner，并进入本轮开奖流程。

每个 Rocket Level 独立统计：

- Rocket Energy
- Contribution Ranking
- Ranking Reward
- In Room Reward

当前等级完成后进入下一等级；最高等级完成后可继续重复最高等级，直至每日重置。

---

## 二、Rocket Energy

### 1. Energy 计算

- Regular Gift：**1 Coin = 1 Energy**
- Lucky Gift：按礼物 Coins 的 **10%** 计入 Rocket Energy
- 免费礼物 / 非 Coins 礼物不计入

用户 Contribution 与实际计入的 Rocket Energy 使用同一口径。

示例：

- Regular Gift 100,000 Coins → +100,000 Energy
- Lucky Gift 100,000 Coins → +10,000 Energy

---

## 三、Rocket Level

等级及目标 Energy 后台可配置。

| Level | Target Energy |
| ----- | -------------:|
| Lv1   | 100,000       |
| Lv2   | 300,000       |
| Lv3   | 800,000       |
| Lv4   | 2,000,000     |
| Lv5   | 5,000,000     |

每个 Level 独立统计，不继承上一等级数据。

---

## 四、超额送礼

当单笔礼物使当前 Rocket Energy 超出 Target Energy 时：

- Rocket Energy 最多累计至当前等级 Target
- 用户 Contribution 按该笔礼物实际有效 Energy **完整累计**
- 超出的 Energy **不继承至下一等级**

示例：

Lv3 当前：

**790,000 / 800,000**

用户送出 Regular Gift：

**100,000 Coins**

则：

- Rocket Energy → 800,000
- 用户 Contribution → +100,000
- 剩余 90,000 Energy 不进入 Lv4

---

## 五、Rocket Launch

当前 Rocket Energy 达到 **100%** 时：

1. 当前 Level 立即完成
2. 当前 Level Contribution Ranking 锁定
3. 立即触发 World Banner
4. 进入本轮 Rocket Launch / Reward Draw 流程
5. 本轮开奖完成后进入下一 Rocket Level

---

## 六、Contribution Ranking

每个 Rocket Level 独立统计 Contribution Ranking。

排序规则：

1. Contribution 高 → 排名靠前
2. Contribution 相同时，优先达到该 Contribution 的用户排名靠前

### 开奖前

展示 **Top 10**：

- Top1–Top3：使用 **2-1-3 山形布局**
- Top4–Top10：使用普通列表

展示字段：

- Rank
- Avatar
- Nickname
- Contribution

### Level 已完成后

历史 Level 仅展示：

- Top1
- Top2
- Top3

继续使用 **2-1-3 山形布局**。

---

## 七、Ranking Reward

Top1 / Top2 / Top3 分别配置固定 Ranking Reward。

每个排名可配置：

- 奖励内容
- 奖励数量 / 时长
- Minimum Contribution

若对应用户 Contribution 未达到 Minimum Contribution：

- 不获得该排名奖励
- 奖励不顺延给下一名

当前 Level 达到 100% 时，Ranking 锁定，并按最终排名结算 Ranking Reward。

---

## 八、In Room Reward

Rocket 发射后进入本轮 In Room Reward 开奖流程。

### 开奖流程

**Rocket 100% → World Banner → 点击进入房间 → Rocket Launch Animation → 10s Countdown → 自动开奖**

不需要用户手动点击 Claim。

### Eligible Users

倒计时结束瞬间，仍在当前房间且符合参与条件的用户，进入本轮 In Room Reward Eligible Pool。

因此：

- 倒计时期间进入房间 → 可以参与
- 倒计时结束前离开房间 → 不参与
- 开奖完成后进入房间 → 不参与本轮

### 开奖时间

**最终中奖用户在 10s Countdown = 0 时确定。**

由服务端：

1. 获取开奖瞬间的 Eligible Users
2. 根据配置规则确定中奖用户
3. 确定各中奖用户奖励
4. 自动发放奖励
5. 返回开奖结果

同一用户单次 Rocket Launch 最多获得一次 In Room Reward。

---

## 九、开奖结果

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
- 奖励名称 / 数量

中奖用户的奖励自动到账，无需再次点击领取。

中奖记录写入 Winning Record；未中奖不写入。

---

## 十、Rocket Launch Animation

用户通过 World Banner 进入对应房间后展示 Rocket Launch Animation。

动画中：

- 展示当前 Rocket
- 固定展示本轮 **Top1 用户头像**
- Top1 Avatar 固定在画面上方，不随 Rocket 动画移动
- Avatar 下方展示 `TOP 1`
- 不展示 Top1 用户昵称
- 播放 Rocket 发射动画
- 同步展示本轮统一 Countdown

Countdown 仅展示数字：

**10 → 9 → 8 → … → 1**

无需增加：

- Reward Draw
- Drawing
- Lucky Draw

等额外文案。

---

## 十一、统一开奖倒计时

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

## 十二、World Banner

Rocket Energy 达到 100% 后立即触发 World Banner。

展示：

- 本轮触发 Rocket 100% 的用户 Avatar
- 用户 Nickname
- Rocket Level
- Room Name

示例：

`Alex launched Rocket Lv.3 in Yaloka Night Party!`

点击 World Banner：

→ 进入对应 Room  
→ 展示当前 Rocket Launch / Countdown 状态

World Banner 展示的用户是**触发最后一笔有效 Energy 的用户**，不代表其额外获得 Final Hit Reward。

---

## 十三、Daily Reset

每天：

**00:00 UTC+5**

重置：

- Rocket Level → Lv1
- Rocket Energy → 0
- Contribution Ranking → Clear
- 当日 Reward 相关计数 → Clear

Winning Record 不清除。

---

## 十四、Room Rocket 挂件

房间内固定展示 Rocket 入口挂件。

展示：

- 当前 Rocket 缩略图
- 当前 Rocket Level
- 当前 Energy %

Rocket Energy / Level 变化时实时更新。

点击进入 Room Rocket 页面。

---

## 十五、Room Rocket 主玩法页面

Room Rocket 使用房间内 **Bottom Sheet / Overlay** 展示。

最大高度：

**75vh**

保留房间背景可见。

主页面从上到下固定为：

1. 主视觉区
2. Rewards
3. Ranking

### 1. 主视觉区

核心内容：

- 中间：Current Rocket 主视觉
- 左侧：Rocket Energy 竖向进度
- 右侧：Lv1–Lv5 Level Selector
- 主视觉下方：当前查看 Level
- Reset Countdown
- 左下：Rules
- 右下：Winning Record

进入 Room Rocket 时：

默认选中 **当前进行中的 Rocket Level**。

所有 Level 均可点击查看。

切换 Level 后同步更新：

- Rocket Visual
- Energy
- Rewards
- Ranking

状态：

- 已完成 Level → Energy 100%
- 当前 Level → 实时 Energy
- 未来 Level → Energy 0%

无需额外增加“Current Level”提示，选中状态即可表达。

---

## 十六、Rewards 区

位于**主视觉区下方**。

结构：

**Rewards → Reward Tabs → Reward Cards**

Tabs：

- Top 1
- Top 2
- Top 3
- In Room

每个 Tab 奖励数量尽量**补满一整行**。

当前 Demo 采用：

**4 个奖励 / 行**

单个奖励卡仅展示：

- Reward Thumbnail
- Reward Name
- Amount / Duration

不增加额外规则说明。

### 已完成 Level

查看历史已完成 Rocket Level 时：

**隐藏 Rewards 模块**

仅展示最终 Ranking。

---

## 十七、Ranking 区

位于 **Rewards 区下方**。

因此主页面固定顺序为：

**主视觉区 → Rewards → Ranking**

### 当前 / 未完成 Level

展示：

- Top1–Top3：2-1-3 山形卡片
- Top4–Top10：列表

Top1 / Top2 / Top3：

- 每名用户独立使用卡片容器
- 排名数字不单独增加 Badge / 外框
- Avatar
- Nickname
- Contribution

### 已完成 Level

仅展示 Top3：

**Top2 – Top1 – Top3**

不展示 Top4–Top10。

---

## 十八、Rules

Rules 使用独立 Bottom Sheet。

高度约：

**主玩法页高度的 1/2**

即约：

**37.5vh**

内容可内部滚动。

---

## 十九、Winning Record

Winning Record 使用独立 Bottom Sheet。

与 Rules 高度一致。

展示用户实际获得的奖励记录。

字段：

- Reward
- Reward Source
  - Ranking
  - In Room
- Rocket Level
- Time

Time 格式：

**YYYY/MM/DD HH:mm:ss**

例如：

**2026/09/24 10:35:26**

---

## 二十、后台配置

### Rocket Level

- Level
- Target Energy
- Rocket Visual

### Ranking Reward

- Top1 Reward
- Top2 Reward
- Top3 Reward
- Minimum Contribution

### In Room Reward

- Reward Pool
- Reward Quantity
- Probability / Weight
- Winning User Count
- User Winning Limit

### General

- Launch Countdown
- World Banner
- Daily Reset Time

---

## 二十一、关键规则汇总

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

---

## 二十二、V1 暂不包含

- Final Hit / Last Contributor Reward
- 全服 Rocket Ranking
- Room Rocket PK
- Agency / Guild Rocket
- 多 Rocket 并行
- 跨房累计 Energy
- 用户主动触发发射
- 剩余 Energy 跨 Level 继承
