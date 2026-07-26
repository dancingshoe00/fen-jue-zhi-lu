var alchemyBuyableDefinitions = {};

DOUPO_CONTENT.alchemy.recipes.forEach(function (item, index) {
  const limits = [6, 5, 4];
  const growth = [3, 4, 5];
  alchemyBuyableDefinitions[item.id] = {
    title: item.title,
    cost: function (amount) {
      return new Decimal(item.cost).times(Decimal.pow(growth[index], amount));
    },
    effect: function (amount) {
      const bases = [2, 1.75, 0.92];
      return Decimal.pow(bases[index], amount);
    },
    display: function () {
      const amount = getBuyableAmount(this.layer, this.id);
      const effect = buyableEffect(this.layer, this.id);
      const effectText = index === 2 ? `功法需求 ×${format(effect)}` : `当前增益 ×${format(effect)}`;
      return `${item.description}<br><br>已炼制：${formatWhole(amount)} / ${limits[index]}<br>${effectText}<br>下次消耗：${formatWhole(this.cost())} 炼药心得`;
    },
    canAfford: function () {
      return player.alchemy.points.gte(this.cost());
    },
    buy: function () {
      const cost = this.cost();
      player.alchemy.points = player.alchemy.points.sub(cost);
      setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1));
    },
    purchaseLimit: limits[index]
  };
});

var alchemyChallengeDefinitions = {
  11: {
    name: "火候失衡",
    challengeDescription: "斗气增长开平方，重新建立稳定火候。",
    goalDescription: "达到 1e6 斗气",
    canComplete: function () { return player.points.gte(DOUPO_BALANCE.alchemyChallengeGoals[0]); },
    rewardDescription: "斗气增长永久 ×3。",
    unlocked: function () { return player.alchemy.total.gte(2); },
    completionLimit: 1
  },
  12: {
    name: "灵魂干扰",
    challengeDescription: "修为获取降为原来的十分之一。",
    goalDescription: "持有 30 修为",
    canComplete: function () { return player.realm.points.gte(DOUPO_BALANCE.alchemyChallengeGoals[1]); },
    rewardDescription: "修为获取永久 ×3。",
    unlocked: function () { return hasChallenge("alchemy", 11); },
    completionLimit: 1
  },
  13: {
    name: "双线炼制",
    challengeDescription: "同时承受火候失衡与灵魂干扰。",
    goalDescription: "达到 5e6 斗气并持有 10 修为",
    canComplete: function () { return player.points.gte(DOUPO_BALANCE.alchemyChallengeGoals[2]) && player.realm.points.gte(10); },
    rewardDescription: "所有基础资源永久 ×2。",
    unlocked: function () { return hasChallenge("alchemy", 12); },
    completionLimit: 1
  }
};

addLayer("alchemy", {
  name: "炼药",
  symbol: "药",
  position: 0,
  row: 1,
  color: "#d8a33f",
  resource: "炼药心得",
  baseResource: "累计修为",
  baseAmount: function () { return player.realm.total; },
  requires: new Decimal(180),
  type: "normal",
  exponent: 0.5,
  branches: ["realm", "technique"],
  startData: function () {
    return {
      unlocked: false,
      points: new Decimal(0),
      best: new Decimal(0),
      total: new Decimal(0)
    };
  },
  gainMult: function () {
    let mult = new Decimal(1);
    if (hasChallenge("alchemy", 13)) mult = mult.times(2);
    return mult;
  },
  gainExp: function () { return new Decimal(1); },
  buyables: alchemyBuyableDefinitions,
  challenges: alchemyChallengeDefinitions,
  milestones: {
    0: {
      requirementDescription: "获得 1 点炼药心得",
      effectDescription: "高层重置后永久保留境界里程碑。",
      done: function () { return player.alchemy.total.gte(1); }
    },
    1: {
      requirementDescription: "三种配方各炼制一次",
      effectDescription: "掌握丹液、火候与护脉之间的配合。",
      done: function () {
        return [11, 12, 13].every(function (id) { return getBuyableAmount("alchemy", id).gte(1); });
      }
    },
    2: {
      requirementDescription: "三种药方各炼制一次，并完成全部炼药挑战",
      effectDescription: "满足启程魔兽山脉的炼药条件。",
      done: function () {
        const recipesPrepared = [11, 12, 13].every(function (id) {
          return getBuyableAmount("alchemy", id).gte(1);
        });
        const challengesComplete = [11, 12, 13].every(function (id) {
          return hasChallenge("alchemy", id);
        });
        return recipesPrepared && challengesComplete;
      }
    }
  },
  milestonePopups: true,
  hotkeys: [
    { key: "a", description: "A：总结炼药心得", onPress: function () { if (canReset("alchemy")) doReset("alchemy"); } }
  ],
  layerShown: function () {
    return hasMilestone("realm", 5) || player.alchemy.unlocked;
  },
  tooltip: function () {
    return `${formatWhole(player.alchemy.points)} 炼药心得<br>高层重置会清空低层临时进度`;
  },
  tabFormat: [
    ["display-text", function () { return "炼药会重置斗气、当前修为、低层升级与功法路线，但境界里程碑、纪事、挑战奖励和自动化会保留。"; }, { "max-width": "680px", "margin": "0 auto", "color": "var(--text-muted)" }],
    ["display-image", "assets/imagegen/alchemy-cauldron.png"],
    "main-display",
    "prestige-button",
    "resource-display",
    "blank",
    "milestones",
    "blank",
    ["display-text", "丹方炼制"],
    "buyables",
    "blank",
    ["display-text", "炼药试炼"],
    "challenges"
  ],
  nodeStyle: function () {
    return { "box-shadow": "0 0 28px rgba(216,163,63,.28)" };
  }
});
