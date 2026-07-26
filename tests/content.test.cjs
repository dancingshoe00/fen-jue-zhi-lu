const test = require("node:test");
const assert = require("node:assert/strict");

const content = require("../js/content.js");

test("phase one exposes the planned amount of progression content", () => {
  assert.equal(content.realm.upgrades.length, 12);
  assert.equal(content.realm.milestones.length, 7);
  assert.equal(content.technique.upgrades.length, 8);
  assert.deepEqual(content.technique.branches.map((branch) => branch.id), ["speed", "breakthrough"]);
  assert.equal(content.alchemy.recipes.length, 3);
  assert.equal(content.alchemy.challenges.length, 3);
  assert.equal(content.story.events.length, 5);
});

test("content identifiers and titles are unique", () => {
  const groups = [
    content.realm.upgrades,
    content.realm.milestones,
    content.technique.upgrades,
    content.alchemy.recipes,
    content.alchemy.challenges,
    content.story.events
  ];

  for (const group of groups) {
    assert.equal(new Set(group.map((item) => item.id)).size, group.length);
    assert.equal(new Set(group.map((item) => item.title)).size, group.length);
  }
});

test("realm milestones progressively protect upgrade rows from realm resets", () => {
  assert.match(content.realm.milestones[2].description, /第一排境界升级/);
  assert.match(content.realm.milestones[4].description, /第二排境界升级/);
  assert.match(content.realm.milestones[6].description, /全部境界升级/);
});

test("the story ends with the departure for the Magic Beast Mountains", () => {
  const finalEvent = content.story.events.at(-1);
  assert.equal(finalEvent.id, "depart");
  assert.equal(finalEvent.completesPhase, true);
});

test("phase-one techniques follow the novel's Wutan City progression", () => {
  const techniques = content.technique.upgrades;
  const firstAppearances = ["吸掌", "八极崩", "吹火掌", "焚诀"];

  for (const title of firstAppearances) {
    assert.ok(techniques.some((item) => item.title.includes(title)), `missing canonical technique: ${title}`);
  }

  assert.match(techniques.find((item) => item.title.includes("吸掌")).description, /玄阶低级/);
  assert.match(techniques.find((item) => item.title.includes("吹火掌")).description, /玄阶低级/);
  assert.match(techniques.find((item) => item.title.includes("八极崩")).description, /玄阶高级/);
  assert.match(techniques.find((item) => item.title.includes("焚诀")).description, /黄阶低级/);
  assert.equal(techniques.find((item) => item.title.includes("焚诀")).realmMilestone, 6);
});

test("phase-one recipes are available before the departure from Wutan City", () => {
  assert.deepEqual(
    content.alchemy.recipes.map((recipe) => recipe.title),
    ["筑基灵液", "凝血散", "回气丹"]
  );
  assert.equal(content.story.events[1].title, "药老苏醒");
  assert.match(content.story.events[0].description, /聚气散/);
});
