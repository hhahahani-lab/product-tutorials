# Money Rain 活动 PRD

活动期间，按用户每日在所有游戏中的金币差额确定返还档位，并于次日自动发放金豆。

## 1. 用户端活动页

- 展示活动名称 Money Rain、活动时间及首屏文案。活动时间统一按 UTC+5 展示。
- 主标题下展示 **Up to 20% Back in Beans**。说明文案为 “Bet on games during Money Rain. If you qualify, your Beans will be credited automatically the next day.”
- 头图下方右侧提供 **Rule** 入口，点击打开可滚动的英文规则弹窗。首页仅展示统一活动信息。

### Rule 弹窗文案

All games count during Money Rain. Rebates are calculated daily in UTC+5.

Subtract the Coins you earned in games from the Coins you spent in those games on the same day. Convert the difference at 14,000 Coins = USD 1. Rebate rates are 10% from $100, 15% from $200, and 20% from $300. The highest tier you reach applies.

Your rebate is calculated using the total Coins you spent in games that day multiplied by your tier rate. We convert the result at 1 Coin = 1 Bean, round down to whole Beans, and credit your rebate automatically the next day.

## 2. 每日结算与发放

1. **定档**　按 UTC+5 每日汇总用户在活动期间所有游戏的金币消耗和所得。用当天的实际扣币总额减去游戏所得金币，按差额取达到的最高档。满 1,400,000 Coins（$100）返 10%，满 2,800,000 Coins（$200）返 15%，满 4,200,000 Coins（$300）返 20%。差额低于首档门槛，当日不发放。
2. **计算**　当日返还金豆 = 当日游戏实际扣币总额 × 档位比例，按 1 Coin = 1 Bean 换算后向下取整。
3. **发放**　符合条件的金豆于次日 10:20（UTC+8）自动发放，每人每天最多发放一次。活动最后一天的返还照常于次日发放。

### 金豆到账系统消息

返还金豆到账后，向获得返还的用户发送一条系统消息。{amount} 为本次实际到账的金豆数，同一笔返还只通知一次。

**标题**　Money Rain!

> Your rebate of {amount} Beans has been credited to your account.

## 3. 后台返还统计

- **统计**　每日 08:45（UTC+8）按上一活动日的游戏数据生成待发明细。活动日按 UTC+5 划分。
- **列表**　展示用户 ID、返还档位、返还金豆数、发放时间和发放状态。发放成功后，状态由「待发放」更新为「已发放」。
- **汇总**　按查询条件汇总返还总人数和金豆总数，人数按用户 ID 去重。

## 4. 待确认

- 活动起止时间。
