# 1. v1 规则库设计文档（v1 Rulebase Design Document）

本文档记录 `werewolf-assistant` 第一版的知识表示方案、规则库设计、推理流程、默认案例和当前实现边界。v1 的目标是构建一个可以交互运行的狼人杀局势分析 demo，用显式事实和规则展示知识表示（Knowledge Representation）与前向链推理（Forward Chaining）的基本过程。

## 1.1 项目定位（Project Positioning）

本项目面向 6 人简化狼人杀局势。系统将玩家声明、查验结果、投票记录和死亡信息表示为结构化事实，再使用规则库识别局势中的身份冲突、查验矛盾、依赖型身份声明、投票分裂和投票压力。

v1 的核心任务可以写成：

```text
结构化输入局势事实
→ 建立知识库
→ 使用规则库进行前向链推理
→ 生成中间事实和推理轨迹
→ 输出局势总结与关注点
```

## 1.2 游戏范围（Game Scope）

v1 采用 6 人简化局。

### 1.2.1 玩家（Players）

```text
P1, P2, P3, P4, P5, P6
```

### 1.2.2 身份（Roles）

```text
Seer
Werewolf
Villager
```

### 1.2.3 阵营（Camps）

```text
the Werewolves = 狼人阵营
the Villagers = 村民阵营
```

### 1.2.4 身份配置（Role Configuration）

```text
2 Werewolves
1 Seer
3 Villagers
```

## 1.3 输入事件（Input Events）

v1 支持四类结构化事件。

| 事件类型（Event Type） | 内部事实（Internal Fact） | 含义（Meaning） | 示例（Example） |
|---|---|---|---|
| 身份声明（Role Claim） | `claim(player, role, phase)` | 玩家在某一阶段声明身份 | `claim(P1, Seer, Day1)` |
| 预言家查验（Seer Check） | `check(seer, target, result, phase)` | 预言家候选人给出查验结果 | `check(P1, P3, Good, Day1)` |
| 投票记录（Vote） | `vote(voter, target, phase)` | 玩家在白天投票 | `vote(P4, P1, Day1)` |
| 死亡信息（Death） | `dead(player, phase)` | 玩家在某一阶段死亡 | `dead(P6, Night1)` |

## 1.4 事实表示（Fact Representation）

### 1.4.1 身份声明（Role Claim）

```text
claim(player, role, phase)
```

示例：

```text
claim(P1, Seer, Day1)
claim(P2, Seer, Day1)
```

含义：P1 和 P2 都在 Day1 声明自己是预言家。

### 1.4.2 预言家查验（Seer Check）

```text
check(seer_claimant, target, result, phase)
```

示例：

```text
check(P1, P3, Good, Day1)
check(P2, P3, Wolf, Day1)
```

含义：P1 声称查验 P3 为好人；P2 声称查验 P3 为狼人。这里记录的是玩家给出的查验声明。系统后续会结合身份冲突、查验矛盾和投票行为解释这条声明的局势意义。

### 1.4.3 投票记录（Vote）

```text
vote(voter, target, phase)
```

示例：

```text
vote(P4, P1, Day1)
vote(P5, P2, Day1)
```

含义：P4 在 Day1 投票给 P1；P5 在 Day1 投票给 P2。

### 1.4.4 死亡信息（Death）

```text
dead(player, phase)
```

示例：

```text
dead(P6, Night1)
```

含义：P6 在 Night1 死亡。

## 1.5 中间事实（Inferred Facts）

规则触发后，系统生成新的中间事实。中间事实会继续进入知识库，支持后续规则继续触发。

| 中间事实（Inferred Fact） | 含义（Meaning） |
|---|---|
| `role_conflict(X, Y, Seer)` | X 和 Y 都声明唯一身份 Seer，形成预言家对跳 |
| `at_least_one_fake(X, Y, Seer)` | X 和 Y 至少一人不是真预言家 |
| `check_contradiction(X, Y, Z)` | X 和 Y 对 Z 给出相反查验结果 |
| `seer_pair_conflict(X, Y)` | X 和 Y 构成当前局势中的核心预言家对跳 |
| `invalid_event(EventID, reason)` | 某事件发生在玩家死亡之后，被标记为无效 |
| `claimed_good_by(Z, X)` | Z 被 X 声称为好人 |
| `claimed_wolf_by(Z, X)` | Z 被 X 声称为狼人 |
| `target_under_conflicting_claims(Z, X, Y)` | Z 同时被 X/Y 给出相反身份声明 |
| `vote_related_to_conflict(Voter, Target)` | Voter 的投票卷入核心对跳冲突 |
| `voting_split_on_seer_pair(A, B, X, Y)` | 投票围绕对跳双方产生分裂 |
| `multiple_votes_on(X, Phase)` | X 在某一轮次被多人投票 |
| `conflict_player_under_pressure(X, Phase)` | 核心冲突玩家受到集中投票压力 |

## 1.6 规则分类（Rule Categories）

v1 规则库分为三类。

| 类别（Category） | 含义（Meaning） | 规则（Rules） |
|---|---|---|
| 硬逻辑规则（Hard Logic Rules） | 从身份唯一性、查验冲突、死亡顺序中推出结构性结论 | R1-R5 |
| 依赖型声明规则（Dependent Claim Rules） | 记录玩家声称的查验信息，保留信息来源 | R6-R8 |
| 软性关注规则（Soft Attention Rules） | 从投票行为中生成关注点，不作为确定身份判断 | R9-R12 |

## 1.7 硬逻辑规则（Hard Logic Rules）

### 1.7.1 R1 唯一预言家冲突规则（Unique Seer Conflict Rule）

```text
IF claim(X, Seer)
AND claim(Y, Seer)
AND X != Y
THEN role_conflict(X, Y, Seer)
```

解释：6 人简化局中只有 1 名预言家。如果两个不同玩家都声明自己是预言家，则二者形成预言家对跳。

### 1.7.2 R2 至少一人伪预言家规则（At Least One Fake Seer Rule）

```text
IF role_conflict(X, Y, Seer)
THEN at_least_one_fake(X, Y, Seer)
```

解释：两个玩家对同一唯一身份产生冲突时，至少一人不是真预言家。

### 1.7.3 R3 查验结果矛盾规则（Contradictory Check Rule）

```text
IF check(X, Z, Good)
AND check(Y, Z, Wolf)
AND X != Y
THEN check_contradiction(X, Y, Z)
```

解释：两个玩家对同一目标给出 Good 和 Wolf 的相反查验结果，形成查验矛盾。

### 1.7.4 R4 核心预言家对跳规则（Core Seer Pair Conflict Rule）

```text
IF role_conflict(X, Y, Seer)
AND check_contradiction(X, Y, Z)
THEN seer_pair_conflict(X, Y)
```

解释：如果两个玩家既存在预言家身份冲突，又对同一目标给出相反查验结果，则该二人构成局势中的核心对跳冲突。

### 1.7.5 R5 死亡后事件无效规则（Invalid Event after Death Rule）

```text
IF dead(X, Phase1)
AND event_by(X, Phase2)
AND Phase2 later_than Phase1
THEN invalid_event(EventID, "player already dead")
```

解释：玩家死亡后产生的声明、查验或投票被标记为无效事件。

## 1.8 依赖型声明规则（Dependent Claim Rules）

### 1.8.1 R6 被声称为好人规则（Claimed Good Rule）

```text
IF claim(X, Seer)
AND check(X, Z, Good)
THEN claimed_good_by(Z, X)
```

解释：如果 X 声明自己是预言家，并声称查验 Z 为好人，则系统记录 Z 被 X 声称为好人。

### 1.8.2 R7 被声称为狼人规则（Claimed Wolf Rule）

```text
IF claim(X, Seer)
AND check(X, Z, Wolf)
THEN claimed_wolf_by(Z, X)
```

解释：如果 X 声明自己是预言家，并声称查验 Z 为狼人，则系统记录 Z 被 X 声称为狼人。

### 1.8.3 R8 同一目标相反声明规则（Conflicting Claims on Same Target Rule）

```text
IF claimed_good_by(Z, X)
AND claimed_wolf_by(Z, Y)
AND X != Y
THEN target_under_conflicting_claims(Z, X, Y)
```

解释：同一目标被不同预言家候选人给出相反身份声明时，该目标的身份判断依赖于信息源可信度。

## 1.9 软性关注规则（Soft Attention Rules）

### 1.9.1 R9 投票卷入核心冲突规则（Vote Related to Core Conflict Rule）

```text
IF vote(Voter, Target, Phase)
AND seer_pair_conflict(Target, Other)
THEN vote_related_to_conflict(Voter, Target)
```

解释：玩家投票给核心对跳玩家时，这条投票被记录为冲突相关投票。

### 1.9.2 R10 对跳双方投票分裂规则（Voting Split on Seer Pair Rule）

```text
IF vote(A, X, Phase)
AND vote(B, Y, Phase)
AND seer_pair_conflict(X, Y)
THEN voting_split_on_seer_pair(A, B, X, Y)
```

解释：同一轮次中，不同玩家分别投向对跳双方时，系统记录投票分裂。

### 1.9.3 R11 同一玩家多人投票规则（Multiple Votes on Same Player Rule）

```text
IF vote(A, X, Phase)
AND vote(B, X, Phase)
AND A != B
THEN multiple_votes_on(X, Phase)
```

解释：同一轮次中同一玩家被至少两名玩家投票时，该玩家成为投票焦点。

### 1.9.4 R12 冲突玩家承压规则（Conflict Player under Voting Pressure Rule）

```text
IF multiple_votes_on(X, Phase)
AND seer_pair_conflict(X, Y)
THEN conflict_player_under_pressure(X, Phase)
```

解释：核心冲突玩家同时被多人投票时，系统记录其投票压力。

## 1.10 前向链推理流程（Forward Chaining Process）

v1 推理引擎采用前向链推理。

```text
1. 读取用户输入事实。
2. 将初始事实加入知识库。
3. 扫描规则库。
4. 检查规则前提是否被当前知识库满足。
5. 触发满足条件的规则。
6. 将规则结论作为新事实加入知识库。
7. 记录规则触发过程。
8. 重复扫描，直到没有新事实产生。
```

每条推理轨迹记录：

```json
{
  "step": 1,
  "ruleId": "R1",
  "ruleName": "唯一预言家冲突规则（Unique Seer Conflict Rule）",
  "matchedFacts": [
    "claim(P1, Seer, Day1)",
    "claim(P2, Seer, Day1)"
  ],
  "inferredFact": "role_conflict(P1, P2, Seer)",
  "explanation": "P1 和 P2 都声明自己是预言家，因此形成预言家对跳。"
}
```

## 1.11 默认案例（Default Case）

### 1.11.1 初始事实（Initial Facts）

```text
claim(P1, Seer, Day1)
claim(P2, Seer, Day1)
check(P1, P3, Good, Day1)
check(P2, P3, Wolf, Day1)
vote(P4, P1, Day1)
vote(P5, P2, Day1)
dead(P6, Night1)
```

### 1.11.2 预期推理（Expected Inference）

```text
role_conflict(P1, P2, Seer)
at_least_one_fake(P1, P2, Seer)
check_contradiction(P1, P2, P3)
seer_pair_conflict(P1, P2)
claimed_good_by(P3, P1)
claimed_wolf_by(P3, P2)
target_under_conflicting_claims(P3, P1, P2)
vote_related_to_conflict(P4, P1)
vote_related_to_conflict(P5, P2)
voting_split_on_seer_pair(P4, P5, P1, P2)
```

### 1.11.3 预期局势总结（Expected Situation Summary）

```text
P1 和 P2 都声明自己是预言家，因此形成预言家对跳。
由于预言家是唯一身份，P1/P2 至少一人不是真预言家。

P1 声称 P3 是好人，P2 声称 P3 是狼人。
二者对同一目标给出相反查验结果，因此 P3 的身份处于冲突声明之下。

P4 投票给 P1，P5 投票给 P2。
投票围绕预言家对跳双方产生分裂，P4/P5 的投票可以作为后续局势分析的关注点。
```

## 1.12 当前实现状态（Current Implementation Status）

当前 `init-werewolf-v1` 分支已经完成：

- `README.md`：项目说明、规则库、运行方式和扩展计划。
- `index.html`：静态页面结构。
- `assets/style.css`：页面样式。
- `src/facts.js`：玩家、身份、阵营、阶段、默认事实、事实描述和事实去重键。
- `src/rules.js`：R1-R12 规则库。
- `src/inferenceEngine.js`：前向链推理循环。
- `src/renderer.js`：事实、规则和推理轨迹渲染。
- `src/app.js`：页面交互、默认案例加载和事实输入。
- `examples/default_case.json`：默认案例。

## 1.13 待补齐事项（Remaining v1 Tasks）

v1 代码层还需要继续补齐：

1. 推理轨迹需要调用 `rule.explain`，展示自然语言解释。
2. `renderer.js` 需要同时展示初始事实和推理事实，避免后渲染覆盖前渲染。
3. `app.js` 表单读取需要改成稳定的 `querySelector` 或 `FormData` 方式。
4. `Situation Summary` 需要根据推理事实生成局势总结。
5. README、规则库设计文档和代码实现需要在最终提交前再次对齐。

## 1.14 v1 交付物（v1 Deliverables）

v1 计划交付：

```text
werewolf-assistant/
├── index.html
├── README.md
├── docs/
│   ├── rulebase_design.md
│   └── work_summary_v1.md
├── examples/
│   └── default_case.json
├── assets/
│   └── style.css
└── src/
    ├── facts.js
    ├── rules.js
    ├── inferenceEngine.js
    ├── renderer.js
    └── app.js
```
