这是一个整合了之前所有讨论要点，专注于 **V1.1 版本（去截图化、强化仪式感、样式强一致性）** 的详细前端设计说明书。此文档可直接作为前端开发的执行标准。

---

# 🧧 新春悦换 - 前端详细设计说明书 (V1.1)

## 1. 文档概述 (Document Overview)

* **项目名称**：新春悦换 (New Year Card Exchange)
* **文档版本**：V1.1
* **核心变更**：
1. **移除截图功能**：不再依赖 `html2canvas` 生成图片，规避跨域与渲染风险，降低开发难度。
2. **新增“拆信”交互**：将结果页升级为“收到信封 -> 拆开阅读”的沉浸式动画体验，强化线下互动的仪式感。
3. **样式强一致性**：建立严格的样式映射表，确保发送者选择的信纸主题能 100% 还原展示给接收者。



## 2. 设计理念与规范 (Design System)

### 2.1 核心隐喻：见字如面

* **概念**：摒弃“电子回执”的冷漠感，模拟“书信投递”的温情。
* **关键词**：盲盒、仪式感、沉浸、新国潮。

### 2.2 视觉规范 (Visual Identity)

采用高饱和度色彩搭配纸质纹理，营造春节氛围。

* **色彩体系**：
* 🔴 **Brand Red (主色)**: `#D32F2F` (用于主按钮、信封主体、强调文字)
* 🟡 **Fortune Gold (辅色)**: `#FFD700` (用于边框、图标、高亮装饰)
* 📜 **Rice Paper (背景)**: `#FFF9F0` (用于页面通底、信纸内页，模拟宣纸质感)
* ⚫ **Ink Black (文字)**: `#333333` (正文)、`#B71C1C` (标题)


* **布局策略**：
* **Mobile-First**：100% 宽度适配手机屏幕。
* **PC 兼容**：在 PC/Pad 端限制最大宽度 `max-width: 480px`，居中显示，两侧增加深色毛玻璃背景，模拟手机视窗。



### 2.3 字体策略

* **标题/装饰字**：推荐使用 WebFont（如“站酷快乐体”或“马山正”）或 SVG 图片代替，用于“新年快乐”、“拆开有喜”等大字。
* **正文内容**：使用系统默认无衬线字体 (System Sans-serif) 保证在 iOS/Android 上的最佳可读性。

---

## 3. 核心业务逻辑：样式一致性映射

为了保证“所见即所得”，前端需维护一份静态配置表，**发送端**与**接收端**共用此配置。

### 3.1 样式配置表 (Style Config)

```javascript
// src/constants/styles.js

export const CARD_THEMES = {
  // 主题 0: 鸿运当头 (默认)
  0: {
    id: 0,
    name: '鸿运当头',
    cssClass: 'theme-red',          // 挂载到 DOM 上的类名
    primaryColor: '#D32F2F',
    icon: '🧧',                     // 装饰图标
    headerText: '新年快樂',
    desc: '红红火火，诸事顺遂'
  },
  // 主题 1: 金玉满堂
  1: {
    id: 1,
    name: '金玉满堂',
    cssClass: 'theme-gold',
    primaryColor: '#FBC02d',
    icon: '💰',
    headerText: '招財進寶',
    desc: '财源广进，日进斗金'
  },
  // 主题 2: 水墨丹青
  2: {
    id: 2,
    name: '水墨丹青',
    cssClass: 'theme-ink',
    primaryColor: '#424242',
    icon: '🏔️',
    headerText: '高山流水',
    desc: '岁月静好，优雅从容'
  }
};

```

### 3.2 CSS 样式实现 (CSS Strategy)

利用 CSS 变量或嵌套选择器实现“一键换肤”。

```css
/* theme-red 实现示例 */
.theme-red .card-body {
  background: linear-gradient(135deg, #ffcdd2 0%, #ffebee 100%);
  border: 4px solid #b71c1c;
  color: #b71c1c;
}

/* theme-gold 实现示例 */
.theme-gold .card-body {
  background: linear-gradient(135deg, #fff9c4 0%, #fffde7 100%);
  border: 4px solid #fbc02d;
  color: #f57f17;
}

```

---

## 4. 详细页面设计 (Page Specifications)

### 4.1 首页 (Home)

* **功能**：活动入口与氛围营造。
* **关键元素**：
* **实时计数器**：胶囊样式，悬浮显示“已集结 XX 人”，增加紧迫感。
* **主视觉**：动态的灯笼或生肖插画。
* **主按钮**：“开始写祝福”（需显著提示：**昵称必填**）。


* **交互**：点击按钮检查 LocalStorage，若已有 UUID 且状态为“已提交”，直接跳转匹配页或结果页。

### 4.2 撰写页 (Write) - 发送者视角

* **功能**：内容录入与样式选择。
* **表单验证**：
* **昵称**：必填，2-10字。失焦时若为空，输入框边框变红并震动。
* **内容**：10-200字。


* **样式选择器 (重要)**：
* 底部提供横向滚动栏展示 3 种主题的缩略图。
* 点击缩略图，上方的编辑区域背景**实时切换**对应的 `cssClass`，让用户明确知道对方看到的颜色。


* **防丢机制**：监听 `input` 事件，将内容实时存入 `localStorage`。

### 4.3 匹配页 (Match) - 等待状态

* **视觉**：深色背景，中心为雷达/声波扩散动画。
* **文案**：
* “祝福已寄出，正在寻找有缘人...”
* “请勿关闭页面 (已等待 Xs)”


* **逻辑**：每 2s 轮询 `/api/status`。若超过 30s 未匹配，显示“正在呼叫管理员”安抚文案。

### 4.4 结果页 (Result) - 接收者视角 (核心重构)

此页面分为两个状态阶段，通过 Vue 的 `v-if` 或 `v-show` 切换。

#### 阶段一：未拆封 (The Envelope)

* **场景**：用户匹配成功，首次进入结果页。
* **视觉**：
* 屏幕中央一个巨大的红色信封（纯 CSS 或 SVG 绘制）。
* 信封上有封泥特效，上方悬浮文字：“来自 **[对方昵称]** 的祝福”。
* 整体呈现轻微的“呼吸”或“上下浮动”动画。


* **交互**：用户点击信封。
* **动画**：信封执行 `Fade Out` (淡出) + `Scale Up` (放大消散)。

#### 阶段二：卡片展示 (The Card)

* **场景**：信封消失后。
* **视觉**：
* 卡片从屏幕中心弹窗式出现 (`Pop In` 动画)。
* **关键点**：DOM 结构应用接口返回的 `style_id` 对应的 `cssClass`。
* 内容包含：对方昵称、祝福语（支持长文本滚动）、装饰 Icon。


* **底部操作**：
* 不再显示“保存图片”。
* 按钮 A：“返回首页”（允许用户再次查看状态或重新开始）。
* 提示文案：“截图屏幕即可永久保存这份缘分”。



---

## 5. 技术实现架构 (Technical Architecture)

### 5.1 目录结构

```text
src/
├── assets/             # 静态资源 (纹理图, SVG)
├── components/
│   ├── Envelop.vue     # [新增] 信封组件 (含拆信动画)
│   ├── CardBody.vue    # [核心] 卡片主体 (复用于撰写预览和结果展示)
│   └── NavBar.vue      # 顶部导航
├── constants/
│   └── styles.js       # 样式映射配置表
├── stores/
│   └── user.js         # Pinia状态 (uuid, nickname, style_id, match_data)
├── views/
│   ├── Home.vue
│   ├── Write.vue
│   ├── Match.vue
│   └── Result.vue      # 包含信封与卡片两个状态
└── utils/
    └── request.js      # Axios 封装

```

### 5.2 关键组件：`CardBody.vue`

为了确保预览和结果完全一致，建议将卡片样式封装为独立组件。

```html
<template>
  <div class="card-container relative rounded-xl overflow-hidden shadow-xl" :class="themeClass">
    <div class="card-header h-24 flex items-center justify-center">
      <h2 class="text-2xl font-bold tracking-widest text-white">{{ themeConfig.headerText }}</h2>
    </div>
    
    <div class="card-content p-6 min-h-[300px] flex flex-col">
       <div class="text-lg font-serif leading-loose text-justify flex-1">
         <slot name="content"></slot> </div>
       <div class="text-right mt-6">
         <span class="text-xs opacity-60">From</span>
         <div class="text-xl font-bold"><slot name="nickname"></slot></div>
       </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { CARD_THEMES } from '@/constants/styles';

const props = defineProps(['styleId']);
const themeConfig = computed(() => CARD_THEMES[props.styleId] || CARD_THEMES[0]);
const themeClass = computed(() => themeConfig.value.cssClass);
</script>

```

---

## 6. 异常处理与兜底 (Error Handling)

1. **网络波动**：
* 由于是线下局域网，可能会出现瞬时断连。
* **措施**：Axios 拦截器中捕获错误，使用 `Vant Toast` 提示“网络开小差了”，并允许用户点击按钮重试，而不是锁死页面。


2. **长文本溢出**：
* 若用户输入 200 字，手机一屏可能放不下。
* **措施**：卡片内容区域 (`.card-content`) 设置 `max-height: 60vh; overflow-y: auto;`，允许在卡片内部滑动阅读。


3. **字体加载失败**：
* **措施**：Font-family 设置回退机制 `'ZCOOL KuaiLe', system-ui, sans-serif`。



---

## 7. 开发交付物清单 (Deliverables)

1. **Source Code**: Vue 3 项目源码。
2. **Assets**: 3套背景纹理图、信封 SVG 图标。
3. **Build**: `dist` 文件夹 (用于 Node 后端托管)。

这份设计说明书 V1.1 旨在通过**降低技术风险**（去截图）来换取**更高的用户体验**（动画交互），非常适合 100 人规模的现场活动快速落地。