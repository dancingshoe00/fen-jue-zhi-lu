(function (root, factory) {
  const nodeBalance = typeof require === "function" ? require("./balance.js") : null;
  const content = factory(root.DOUPO_BALANCE || nodeBalance);
  root.DOUPO_CONTENT = content;
  if (typeof module !== "undefined" && module.exports) module.exports = content;
})(typeof globalThis !== "undefined" ? globalThis : this, function (balance) {
  "use strict";

  const realmUpgradeTitles = [
    "吐纳入门", "经脉温养", "筑基灵液淬体", "聚气凝旋",
    "稳固根基", "负重修行", "灵魂感知", "斗者之心",
    "经脉重塑", "家族试炼", "成人礼", "远行准备"
  ];
  const realmUpgradeDescriptions = [
    "调整呼吸节律，使斗气增长翻倍。",
    "以温和斗气疏通经脉，再次翻倍斗气增长。",
    "借筑基灵液温养斗者以下的身体，使斗气增长提高三倍。",
    "将散乱斗气收束成旋，修炼与凝聚效率同步提升。",
    "压实每一次周天所得，使修为获取翻倍。",
    "在持续负重中修炼，当前修为会反过来加快斗气增长。",
    "感知体内细微变化，解锁功法感悟层。",
    "不再被一时得失动摇，使修为获取提高三倍。",
    "重整受阻经脉，历史总修为会增幅斗气增长。",
    "把演武场压力化为养分，功法感悟会增幅修为获取。",
    "在众目之下完成检验，使所有基础增益提高五倍。",
    "整理药材、武器与路线，为远行提供全局十倍增益。"
  ];
  const realmUpgradeIds = [11, 12, 13, 14, 21, 22, 23, 24, 31, 32, 33, 34];

  const realmMilestoneTitles = [
    "斗之气四段", "斗之气五段", "斗之气六段", "斗之气七段",
    "斗之气八段", "斗之气九段", "晋入斗者"
  ];
  const realmMilestoneRewards = [
    "斗气增长 ×1.5。",
    "功法节点开始显现。",
    "每次境界重置后保留第一排境界升级。",
    "斗气增长 ×2，并解锁药老授业纪事。",
    "修为获取 ×2，并在境界重置后保留第二排境界升级。",
    "解锁炼药节点。",
    "境界重置后保留全部境界升级，开启低层自动购买，并满足远行的境界条件。"
  ];

  const techniqueUpgradeIds = [11, 12, 13, 14, 21, 22, 23, 24];
  const techniqueUpgradeTitles = [
    "吸掌·牵引", "八极崩·锻体", "吹火掌·反推", "吸吹转换",
    "筑基灵液·固本", "八极崩·暗劲", "斗气凝旋", "焚诀·初修"
  ];
  const techniqueUpgradeDescriptions = [
    "玄阶低级斗技，以掌力牵引目标；斗气增长 ×3。",
    "玄阶高级近身斗技，先以锻体承受刚猛劲力；斗气增长 ×5。",
    "玄阶低级斗技，以强劲风压形成反推；斗气增长受当前功法感悟增幅。",
    "熟练衔接吸掌与吹火掌，解锁境界自动重置。",
    "继续用筑基灵液修复锻体损伤；修为获取 ×2。",
    "把八极崩劲力进一步凝入目标内部；修为获取 ×3。",
    "突破斗者并凝聚斗气旋；修为获取受功法感悟增幅。",
    "黄阶低级火属性功法，可通过吞噬异火进化；境界获取指数小幅提高。"
  ];

  const content = {
    realm: {
      upgrades: realmUpgradeIds.map((id, index) => ({
        id,
        title: realmUpgradeTitles[index],
        description: realmUpgradeDescriptions[index],
        cost: balance.realmUpgradeCosts[index],
        currency: index < 2 ? "base" : "realm"
      })),
      milestones: realmMilestoneTitles.map((title, index) => ({
        id: index,
        title,
        description: realmMilestoneRewards[index],
        requirement: balance.realmMilestoneRequirements[index]
      }))
    },
    technique: {
      branches: [
        { id: "speed", title: "斗技实战", description: "磨炼吸掌、八极崩与吹火掌的衔接。" },
        { id: "breakthrough", title: "修炼根基", description: "完成锻体、凝聚气旋并在斗者阶段修炼焚诀。" }
      ],
      upgrades: techniqueUpgradeIds.map((id, index) => ({
        id,
        branch: index < 4 ? "speed" : "breakthrough",
        title: techniqueUpgradeTitles[index],
        description: techniqueUpgradeDescriptions[index],
        cost: balance.techniqueUpgradeCosts[index],
        realmMilestone: id === 24 ? 6 : null
      }))
    },
    alchemy: {
      recipes: [
        { id: 11, title: "筑基灵液", description: "温养斗者以下的身体；每份使斗气增长 ×2。", cost: balance.alchemyRecipeCosts[0] },
        { id: 12, title: "凝血散", description: "用于处理锻体留下的伤势；每份使修为获取 ×1.75。", cost: balance.alchemyRecipeCosts[1] },
        { id: 13, title: "回气丹", description: "二品丹药，可加快斗气恢复；每份使功法感悟需求降低 8%。", cost: balance.alchemyRecipeCosts[2] }
      ],
      challenges: [
        { id: 11, title: "火候失衡", description: "斗气增长开平方。", goal: "1e6 斗气", reward: "斗气增长永久 ×3。" },
        { id: 12, title: "灵魂干扰", description: "修为获取降为原来的十分之一。", goal: "30 修为", reward: "修为获取永久 ×3。" },
        { id: 13, title: "双线炼制", description: "同时承受前两项限制。", goal: "5e6 斗气并持有 10 修为", reward: "所有资源永久 ×2。" }
      ]
    },
    story: {
      events: [
        { id: "low", title: "斗气低谷", description: "修为接连倒退，云岚宗来客又以聚气散为筹码逼迫退婚；少年立下三年之约。" },
        { id: "mentor", title: "药老苏醒", description: "戒指中的灵魂现身，失去斗气的缘由终于揭开，重新修炼也有了老师。" },
        { id: "talent", title: "天赋恢复", description: "筑基灵液、锻体与斗技训练逐步见效，斗之气重新攀升。" },
        { id: "ceremony", title: "成人仪式", description: "家族仪式与实战检验相继落幕，昔日的轻视已经无法阻挡前路。" },
        { id: "depart", title: "启程魔兽山脉", description: "晋入斗者并修炼焚诀后，少年离开乌坦城，向魔兽山脉开始长期历练。", completesPhase: true }
      ]
    }
  };

  return Object.freeze(content);
});
