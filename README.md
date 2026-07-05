# 1. 狼人杀知识表示助手（Werewolf Knowledge Representation Assistant）

基于规则推理的狼人杀局势分析助手。A rule-based reasoning assistant for Werewolf game state analysis.

## 1.1 项目概述（Project Overview）

本项目是一个面向狼人杀简化局势的知识表示与规则推理 demo。系统将狼人杀中的玩家声明、查验结果、投票记录和死亡信息表示为结构化事实，并使用一组显式规则识别身份冲突、查验矛盾、投票关注点和局势中的关键推理链。

第一版采用 6 人简化局设定：

- 2 Werewolves，狼人，属于 **the Werewolves，狼人阵营**。
- 1 Seer，预言家，属于 **the Villagers，村民阵营**。
- 3 Villagers，平民，属于 **the Villagers，村民阵营**。

用户可以添加局势事实，运行前向链推理，并在页面中查看当前知识库、触发规则、推理轨迹和局势总结。

## 1.2 知识表示设计（Knowledge Representation Design）

本项目将狼人杀局势表示为一个知识库（Knowledge Base）。知识库包含两类内容：

| 类型 | 含义 | 示例 |
|---|---|---|
| 事实（Facts） | 用户输入或规则推出的结构化信息 | `claim(P1, Seer)` |
| 规则（Rules） | 可触发的推理条件与结论 | `claim(X, Seer) + claim(Y, Seer) -> role_conflict(X, Y, Seer)` |

系统使用前向链推理（Forward Chaining）：从已有事实出发，逐条检查规则前提是否满足；当某条规则被触发时，系统生成新的推理事实并加入知识库。这个过程持续运行，直到没有新的事实可以推出。

```text
用户输入（User Input）
→ 初始事实（Initial Facts）
→ 知识库（Knowledge Base）
→ 规则匹配（Rule Matching）
→ 推理事实（Inferred Facts）
→ 推理轨迹（Reasoning Trace）
→ 局势总结（Situation Summary）
```

## 1.3 游戏范围（Game Scope）

第一版采用简化狼人杀设定，重点展示知识表示、规则库和前向链推理机制。

### 1.3.1 玩家（Players）

```text
P1, P2, P3, P4, P5, P6
```

### 1.3.2 身份（Roles）

```text
Seer
Werewolf
Villager
```

### 1.3.3 阵营（Camps）

```text
the Werewolves
the Villagers
```

### 1.3.4 事件类型（Event Types）

| 事件类型（Event Type） | 含义（Meaning） | 示例（Example） |
|---|---|---|
| 身份声明（Role Claim） | 玩家声明自己的身份 | `P1 claims Seer` |
| 预言家查验（Seer Check） | 预言家候选人给出查验结果 | `P1 checks P3 as Good` |
| 投票记录（Vote） | 玩家在白天投票 | `P4 votes P1 at Day1` |
| 死亡信息（Death） | 玩家在某个阶段死亡 | `P6 died at Night1` |

## 1.4 事实表示（Fact Representation）

系统内部用结构化事实表示局势信息。

### 1.4.1 身份声明（Role Claim）

```text
claim(player, role)
```

示例：

```text
claim(P1, Seer)
claim(P2, Seer)
```

含义：P1 和 P2 都声明自己是预言家。

### 1.4.2 预言家查验（Seer Check）

```text
check(seer_claimant, target, result)
```

示例：

```text
check(P1, P3, Good)
check(P2, P3, Wolf)
```

含义：P1 声称查验 P3 为好人；P2 声称查验 P3 为狼人。该事实记录的是玩家给出的查验声明，后续规则会结合身份冲突和查验冲突分析其局势意义。

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

## 1.5 推理事实（Inferred Facts）

规则触发后，系统会生成新的中间事实。中间事实用于记录推理结果并支持后续规则继续触发。

| 推理事实（Inferred Fact） | 含义（Meaning） |
|---|---|
| `role_conflict(X, Y, Seer)` | X 和 Y 都声明唯一身份 Seer，形成身份冲突 |
| `at_least_one_fake(X, Y, Seer)` | X 和 Y 至少一人不是真预言家 |
| `check_contradiction(X, Y, Z)` | X 和 Y 对 Z 给出相反查验结果 |
| `seer_pair_conflict(X, Y)` | X 和 Y 构成当前局势中的预言家对跳核心冲突 |
| `claimed_good_by(Z, X)` | Z 被 X 声称为好人 |
| `claimed_wolf_by(Z, X)` | Z 被 X 声称为狼人 |
| `target_under_conflicting_claims(Z, X, Y)` | Z 被 X/Y 给出相反身份声明 |
| `vote_related_to_conflict(Voter, Target)` | Voter 的投票卷入核心冲突 |
| `voting_split_on_seer_pair(A, B, X, Y)` | 投票围绕对跳双方产生分裂 |
| `multiple_votes_on(X, Phase)` | X 在某一轮次被多人投票 |
| `conflict_player_under_pressure(X, Phase)` | 核心冲突玩家受到集中投票压力 |

## 1.6 规则库 v1（Rule Base v1）

第一版规则库包含三类规则：硬逻辑规则、依赖型声明规则和软性关注规则。

### 1.6.1 硬逻辑规则（Hard Logic Rules）

**R1. 唯一预言家冲突规则（Unique Seer Conflict Rule）**

```text
IF claim(X, Seer)
AND claim(Y, Seer)
AND X != Y
THEN role_conflict(X, Y, Seer)
```

**R2. 至少一人伪预言家规则（At Least One Fake Seer Rule）**

```text
IF role_conflict(X, Y, Seer)
THEN at_least_one_fake(X, Y, Seer)
```

**R3. 查验结果矛盾规则（Contradictory Check Rule）**

```text
IF check(X, Z, Good)
AND check(Y, Z, Wolf)
AND X != Y
THEN check_contradiction(X, Y, Z)
```

**R4. 核心预言家对跳规则（Core Seer Pair Conflict Rule）**

```text
IF role_conflict(X, Y, Seer)
AND check_contradiction(X, Y, Z)
THEN seer_pair_conflict(X, Y)
```

**R5. 死亡后事件无效规则（Invalid Event after Death Rule）**

```text
IF dead(X, Phase1)
AND event_by(X, Phase2)
AND Phase2 later_than Phase1
THEN invalid_event(EventID, "player already dead")
```

### 1.6.2 依赖型声明规则（Dependent Claim Rules）

**R6. 被声称为好人规则（Claimed Good Rule）**

```text
IF claim(X, Seer)
AND check(X, Z, Good)
THEN claimed_good_by(Z, X)
```

**R7. 被声称为狼人规则（Claimed Wolf Rule）**

```text
IF claim(X, Seer)
AND check(X, Z, Wolf)
THEN claimed_wolf_by(Z, X)
```

**R8. 同一目标相反声明规则（Conflicting Claims on Same Target Rule）**

```text
IF claimed_good_by(Z, X)
AND claimed_wolf_by(Z, Y)
AND X != Y
THEN target_under_conflicting_claims(Z, X, Y)
```

### 1.6.3 软性关注规则（Soft Attention Rules）

**R9. 投票卷入核心冲突规则（Vote Related to Core Conflict Rule）**

```text
IF vote(Voter, Target, Phase)
AND seer_pair_conflict(Target, Other)
THEN vote_related_to_conflict(Voter, Target)
```

**R10. 对跳双方投票分裂规则（Voting Split on Seer Pair Rule）**

```text
IF vote(A, X, Phase)
AND vote(B, Y, Phase)
AND seer_pair_conflict(X, Y)
THEN voting_split_on_seer_pair(A, B, X, Y)
```

**R11. 同一玩家多人投票规则（Multiple Votes on Same Player Rule）**

```text
IF vote(A, X, Phase)
AND vote(B, X, Phase)
AND A != B
THEN multiple_votes_on(X, Phase)
```

**R12. 冲突玩家承压规则（Conflict Player under Voting Pressure Rule）**

```text
IF multiple_votes_on(X, Phase)
AND seer_pair_conflict(X, Y)
THEN conflict_player_under_pressure(X, Phase)
```

## 1.7 推理引擎（Inference Engine）

系统使用简化版前向链推理引擎。每一步推理会记录规则编号、规则名称、匹配事实、推出的新事实和中文解释。

```text
1. 加载初始事实（Load initial facts）
2. 加入知识库（Add facts to the knowledge base）
3. 扫描规则库（Scan all rules）
4. 匹配规则前提（Match rule conditions）
5. 生成推理事实（Generate inferred facts）
6. 记录推理轨迹（Record reasoning trace）
7. 重复直到没有新事实产生（Repeat until no new facts can be inferred）
```

## 1.8 默认案例（Default Case）

### 1.8.1 初始事实（Initial Facts）

```text
claim(P1, Seer)
claim(P2, Seer)
check(P1, P3, Good)
check(P2, P3, Wolf)
vote(P4, P1, Day1)
vote(P5, P2, Day1)
dead(P6, Night1)
```

### 1.8.2 预期推理（Expected Inference）

系统应推出：

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

### 1.8.3 局势总结（Situation Summary）

默认案例会显示 P1 和 P2 的预言家对跳、P1/P2 对 P3 的相反查验声明，以及 P4/P5 投票围绕对跳双方产生分裂。

## 1.9 用户界面（User Interface）

第一版采用静态网页实现，打开 `index.html` 即可运行。页面包含以下区域：

1. 项目说明（Project Introduction）
2. 游戏设定（Game Setup）
3. 事实输入面板（Fact Input Panel）
4. 知识库面板（Knowledge Base Panel）
5. 规则库面板（Rule Base Panel）
6. 推理轨迹面板（Reasoning Trace Panel）
7. 局势总结面板（Situation Summary Panel）

## 1.10 项目结构（Project Structure）

```text
werewolf-assistant/
├── index.html
├── README.md
├── docs/
│   ├── rulebase_design.md
│   └── project_report.md
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

## 1.11 运行方式（How to Run）

克隆或下载仓库后，直接在浏览器中打开：

```text
index.html
```

第一版不需要后端服务，也不需要安装依赖。

## 1.12 当前版本（Current Version）

Version: `v1`

主要功能：

- 6 人简化狼人杀设定。
- 结构化事实输入。
- 12 条规则的规则库。
- 前向链推理。
- 推理轨迹展示。
- 局势总结生成。
- 默认案例加载。

## 1.13 扩展计划（Extension Plan）

后续可以扩展：

1. 加入女巫、猎人、守卫、骑士等角色。
2. 增加救人、毒人、守护、公开发言等事件类型。
3. 添加小规模可能世界枚举器。
4. 添加自然语言到结构化事实的解析模块。
5. 添加玩家、声明、查验、投票和冲突的图结构可视化。
6. 在符号推理之上增加概率评分层。
7. 支持 JSON 格式的局势日志导入和导出。

## 1.14 教学目的（Educational Purpose）

本项目展示知识表示在不完全信息游戏中的一种应用方式。游戏局势被表示为事实，领域逻辑被表示为规则，推理引擎从已有事实推出新的中间事实，并记录可解释的推理轨迹。这个设计使狼人杀局势分析过程更结构化、可检查、可复用。
