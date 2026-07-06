# 1. v1 工作总结（v1 Work Summary）

本文档总结 `werewolf-assistant` 项目到 v1 当前阶段为止已经完成的设计、代码、文档和待补齐事项。项目当前开发分支为 `init-werewolf-v1`，稳定版本目标分支为 `main`。

## 1.1 当前分支策略（Current Branch Strategy）

当前仓库采用以下分支策略：

```text
main = 稳定版本 / 最终交作业版本
init-werewolf-v1 = 第一版开发分支
```

开发过程先在 `init-werewolf-v1` 分支完成规则库、页面、推理引擎和文档。v1 功能检查后，再从 `init-werewolf-v1` 向 `main` 创建 Pull Request。

## 1.2 项目目标（Project Goal）

v1 的目标是实现一个面向 6 人简化狼人杀局势的知识表示与规则推理 demo。系统将局势信息表示为事实（Facts），将狼人杀中的基本推理逻辑表示为规则（Rules），再通过前向链推理（Forward Chaining）生成中间事实、推理轨迹和局势总结。

当前设计聚焦四类输入：

1. 身份声明（Role Claim）
2. 预言家查验（Seer Check）
3. 投票记录（Vote）
4. 死亡信息（Death）

当前设计聚焦三类输出：

1. 硬逻辑结论（Hard Logic Conclusions）
2. 依赖型声明结果（Dependent Claim Results）
3. 软性关注点（Soft Attention Points）

## 1.3 已完成的文档工作（Completed Documentation Work）

### 1.3.1 README（README）

`README.md` 已经建立第一版项目说明，包含：

- 项目概述（Project Overview）
- 知识表示设计（Knowledge Representation Design）
- 游戏范围（Game Scope）
- 事实表示（Fact Representation）
- 推理事实（Inferred Facts）
- 规则库 v1（Rule Base v1）
- 推理引擎（Inference Engine）
- 默认案例（Default Case）
- 用户界面（User Interface）
- 项目结构（Project Structure）
- 运行方式（How to Run）
- 当前版本（Current Version）
- 扩展计划（Extension Plan）
- 教学目的（Educational Purpose）

README 标题和小标题采用“中文（English）”格式，并保留编号。

### 1.3.2 规则库设计文档（Rulebase Design Document）

已新增：

```text
docs/rulebase_design.md
```

该文档记录 v1 的知识表示方案、事实结构、规则分类、R1-R12 规则、前向链推理流程、默认案例和当前实现状态。

## 1.4 已完成的代码工作（Completed Code Work）

### 1.4.1 页面入口（index.html）

已新增静态页面入口：

```text
index.html
```

页面当前包含：

- 项目标题与说明
- 6 人简化局设定
- 事实输入面板
- 当前知识库面板
- 推理轨迹面板
- 局势总结面板
- 规则库展示面板

### 1.4.2 样式文件（Style Sheet）

已新增：

```text
assets/style.css
```

样式文件提供页面布局、面板、按钮、事实卡片、规则卡片和推理轨迹卡片的基础视觉结构。

### 1.4.3 事实模型（Fact Model）

已更新：

```text
src/facts.js
```

当前 `facts.js` 包含：

- 玩家列表 `PLAYERS`
- 身份列表 `ROLES`
- 阵营列表 `CAMPS`
- 阶段列表 `PHASES`
- 默认事实 `DEFAULT_FACTS`
- 事实生成函数 `makeFact`
- 事实复制函数 `cloneFacts`
- 玩家对排序函数 `canonicalPair`
- 阶段顺序函数 `phaseIndex` 和 `isLaterPhase`
- 事实去重键 `factKey`
- 事实文本描述 `describeFact`
- 中文事实描述 `describeFactInChinese`
- 句子列表生成 `toSentenceList`

### 1.4.4 规则库（Rule Base）

已更新：

```text
src/rules.js
```

当前规则库已包含 R1-R12：

| 编号（ID） | 规则（Rule） | 类别（Category） |
|---|---|---|
| R1 | 唯一预言家冲突规则（Unique Seer Conflict Rule） | hard |
| R2 | 至少一人伪预言家规则（At Least One Fake Seer Rule） | hard |
| R3 | 查验结果矛盾规则（Contradictory Check Rule） | hard |
| R4 | 核心预言家对跳规则（Core Seer Pair Conflict Rule） | hard |
| R5 | 死亡后事件无效规则（Invalid Event after Death Rule） | hard |
| R6 | 被声称为好人规则（Claimed Good Rule） | dependent |
| R7 | 被声称为狼人规则（Claimed Wolf Rule） | dependent |
| R8 | 同一目标相反声明规则（Conflicting Claims on Same Target Rule） | dependent |
| R9 | 投票卷入核心冲突规则（Vote Related to Core Conflict Rule） | soft |
| R10 | 对跳双方投票分裂规则（Voting Split on Seer Pair Rule） | soft |
| R11 | 同一玩家多人投票规则（Multiple Votes on Same Player Rule） | soft |
| R12 | 冲突玩家承压规则（Conflict Player under Voting Pressure Rule） | soft |

每条规则当前包含：

- `id`
- `type`
- `name`
- `description`
- `when`
- `then`
- `explain`

### 1.4.5 推理引擎（Inference Engine）

已新增：

```text
src/inferenceEngine.js
```

当前推理引擎执行前向链推理：

```text
initial facts
→ scan rules
→ generate inferred facts
→ deduplicate by factKey
→ repeat until no new facts
```

当前已经支持：

- 多轮规则扫描
- 新事实加入 `inferred`
- 基于 `factKey` 去重
- 推理轨迹 `trace`

### 1.4.6 页面渲染（Renderer）

已新增：

```text
src/renderer.js
```

当前支持：

- 渲染初始事实
- 渲染推理事实
- 渲染推理轨迹
- 渲染规则库

### 1.4.7 主交互逻辑（App Logic）

已新增：

```text
src/app.js
```

当前支持：

- 加载默认案例
- 清空事实
- 添加事实
- 运行推理
- 渲染规则库

### 1.4.8 默认案例（Default Case）

已新增：

```text
examples/default_case.json
```

默认案例包含：

```text
claim(P1, Seer, Day1)
claim(P2, Seer, Day1)
check(P1, P3, Good, Day1)
check(P2, P3, Wolf, Day1)
vote(P4, P1, Day1)
vote(P5, P2, Day1)
dead(P6, Night1)
```

## 1.5 当前实现边界（Current Implementation Boundaries）

当前 v1 代码已经建立主要文件结构和规则库，但仍需要继续检查和补齐。当前明确边界如下：

1. `rules.js` 已补齐 R1-R12。
2. `facts.js` 已统一为 ES module 结构。
3. `inferenceEngine.js` 还需要升级 trace 内容，调用规则中的 `explain` 并记录 matched facts。
4. `renderer.js` 当前分开渲染初始事实和推理事实，但需要避免同一容器被后一次渲染覆盖。
5. `app.js` 当前表单读取方式需要改成更稳定的选择器或 `FormData`。
6. `Situation Summary` 面板目前还需要接入根据推理事实生成的自然语言总结。
7. 页面需要本地打开验证 module import、表单输入、默认案例和推理结果是否正常。

## 1.6 当前文件结构（Current File Structure）

当前 v1 目标结构为：

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

## 1.7 下一步工作（Next Steps）

v1 下一步建议按以下顺序完成：

### 1.7.1 推理引擎升级（Inference Engine Upgrade）

需要补齐：

- trace 中的 `step`
- trace 中的 `matchedFacts`
- trace 中的 `inferredFact`
- trace 中的 `explanation`
- 调用 `rule.explain(match)` 生成自然语言解释

### 1.7.2 渲染逻辑修复（Renderer Fix）

需要补齐：

- 当前知识库同时显示初始事实和推理事实
- 初始事实、硬逻辑事实、依赖型事实、软性关注事实分组展示
- 空状态显示
- 规则库显示每条规则的 description

### 1.7.3 表单逻辑修复（Form Logic Fix）

需要补齐：

- 使用 `select` 限制玩家、身份、阶段和查验结果
- 使用稳定 DOM 查询读取输入
- 检查空值
- 防止玩家对自己查验或投票时的异常输入

### 1.7.4 局势总结生成（Situation Summary Generation）

需要补齐：

- 从 `seer_pair_conflict` 生成核心冲突总结
- 从 `target_under_conflicting_claims` 生成目标身份冲突总结
- 从 `voting_split_on_seer_pair` 生成投票分裂总结
- 从 `conflict_player_under_pressure` 生成投票压力总结

### 1.7.5 文档对齐（Documentation Alignment）

需要在最终提交前检查：

- README 中写到的规则是否都在代码中实现
- 规则库设计文档是否与 `rules.js` 对齐
- 默认案例输出是否与文档预期一致
- 运行方式是否准确

## 1.8 v1 完成标准（v1 Completion Criteria）

v1 完成时应满足：

1. 打开 `index.html` 后页面可正常加载。
2. 默认案例可一键加载。
3. 运行推理后能生成 R1-R12 中适用规则的推理结果。
4. 当前知识库能同时显示初始事实和推理事实。
5. 推理轨迹能显示规则编号、规则名称、匹配事实、新事实和解释。
6. 局势总结能根据推理事实生成自然语言说明。
7. README、`docs/rulebase_design.md`、`docs/work_summary_v1.md` 和代码实现保持一致。
8. 从 `init-werewolf-v1` 向 `main` 开 Pull Request。

## 1.9 当前结论（Current Conclusion）

当前项目已经完成 v1 的主要设计框架、规则库框架和基础页面结构。接下来的重点是把推理引擎、渲染逻辑和局势总结补齐，使默认案例能够完整展示从初始事实到规则触发、推理事实和局势总结的全过程。
