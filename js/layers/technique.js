var techniqueUpgradeDefinitions = {};

DOUPO_CONTENT.technique.upgrades.forEach(function (item, index, allItems) {
  const branchStart = item.branch === "speed" ? 0 : 4;
  const previous = index > branchStart ? allItems[index - 1].id : null;
  techniqueUpgradeDefinitions[item.id] = {
    title: item.title,
    description: item.description,
    cost: new Decimal(item.cost),
    unlocked: function () {
      const followsBranch = player.technique.branch === item.branch && (previous === null || hasUpgrade("technique", previous));
      const meetsRealm = item.realmMilestone === null || hasMilestone("realm", item.realmMilestone);
      return followsBranch && meetsRealm;
    }
  };
});

function techniqueRefund() {
  return player.technique.upgrades.reduce(function (total, upgradeId) {
    const item = DOUPO_CONTENT.technique.upgrades.find(function (candidate) { return candidate.id === upgradeId; });
    return item ? total.add(item.cost) : total;
  }, new Decimal(0));
}

addLayer("technique", {
  name: "功法斗技",
  symbol: "诀",
  position: 1,
  row: 0,
  color: "#55b7a6",
  resource: "功法感悟",
  baseResource: "修为",
  baseAmount: function () { return player.realm.points; },
  requires: new Decimal(10),
  type: "static",
  base: 2.5,
  exponent: 1.15,
  resetDescription: "参悟功法，可得：",
  roundUpCost: true,
  startData: function () {
    return {
      unlocked: false,
      points: new Decimal(0),
      best: new Decimal(0),
      total: new Decimal(0),
      branch: null
    };
  },
  gainMult: function () {
    let mult = new Decimal(1);
    if (player.alchemy && player.alchemy.buyables) {
      mult = mult.times(Decimal.pow(0.92, getBuyableAmount("alchemy", 13)));
    }
    return mult;
  },
  canBuyMax: function () { return hasMilestone("realm", 5); },
  onPrestige: function () {
    player.realm.points = player.realm.points.sub(tmp.technique.nextAt).max(0);
  },
  resetsNothing: function () { return true; },
  upgrades: techniqueUpgradeDefinitions,
  clickables: {
    11: {
      title: "斗技实战",
      display: function () { return "依原著顺序磨炼吸掌、八极崩与吹火掌，优先提高斗气增长。"; },
      canClick: function () { return !player.technique.branch; },
      onClick: function () { player.technique.branch = "speed"; },
      style: function () {
        return player.technique.branch === "speed" ? { "border-color": "#55b7a6", "box-shadow": "0 0 18px rgba(85,183,166,.24)" } : {};
      }
    },
    12: {
      title: "修炼根基",
      display: function () { return "以筑基、锻体和气旋为主，晋入斗者后才能修炼焚诀。"; },
      canClick: function () { return !player.technique.branch; },
      onClick: function () { player.technique.branch = "breakthrough"; },
      style: function () {
        return player.technique.branch === "breakthrough" ? { "border-color": "#d9783d", "box-shadow": "0 0 18px rgba(217,120,61,.24)" } : {};
      }
    },
    21: {
      title: "散功重修",
      display: function () {
        if (!player.technique.branch) return "先选择一条功法路线。";
        return `将退还 ${formatWhole(techniqueRefund())} 功法感悟，并清空当前路线与全部功法升级。`;
      },
      canClick: function () { return Boolean(player.technique.branch); },
      onClick: function () {
        if (!confirm("散功重修不可撤销。确定清空当前路线与全部功法升级，并退还已花费的功法感悟吗？")) return;
        player.technique.points = player.technique.points.add(techniqueRefund());
        player.technique.upgrades = [];
        player.technique.branch = null;
      },
      style: {
        "color": "#ffe8e2",
        "border-color": "rgba(158,79,65,.82)",
        "background": "rgba(92,36,33,.92)",
        "box-shadow": "0 0 0 1px rgba(158,79,65,.24)"
      }
    }
  },
  hotkeys: [
    { key: "t", description: "T：参悟功法", onPress: function () { if (canReset("technique")) doReset("technique"); } }
  ],
  doReset: function (resettingLayer) {
    if (layers[resettingLayer] && layers[resettingLayer].row > this.row) layerDataReset(this.layer);
  },
  layerShown: function () {
    return hasMilestone("realm", 1) || player.technique.unlocked;
  },
  tooltip: function () {
    return `${formatWhole(player.technique.points)} 功法感悟`;
  },
  tabFormat: {
    "功法修炼": {
      content: [
        ["display-text", function () { return "消耗当前修为磨炼功法与斗技，不会清空斗气或境界层。路线选择只决定当前训练侧重。"; }, { "max-width": "680px", "margin": "0 auto", "color": "var(--text-muted)" }],
        "main-display",
        "prestige-button",
        "resource-display",
        "blank",
        ["display-text", function () {
          const branch = DOUPO_CONTENT.technique.branches.find(function (item) { return item.id === player.technique.branch; });
          return branch ? `当前路线：<b>${branch.title}</b> · ${branch.description}` : "尚未选择功法路线";
        }],
        ["row", [
          ["clickable", 11, { "margin": "0 6px" }],
          ["clickable", 12, { "margin": "0 6px" }]
        ]],
        "blank",
        "upgrades"
      ]
    },
    "散功重修": {
      content: [
        ["display-text", function () { return "危险操作：散功会清空当前路线与全部功法升级，并全额退还已花费的功法感悟。此操作不可撤销。"; }, { "display": "block", "width": "min(620px, calc(100% - 32px))", "margin": "24px auto 8px", "padding": "16px", "line-height": "1.6", "color": "#ffe8e2", "border": "1px solid rgba(158,79,65,.72)", "border-radius": "6px", "background": "rgba(92,36,33,.42)" }],
        ["blank", "24px"],
        ["clickable", 21, { "margin": "12px auto" }]
      ]
    }
  }
});
