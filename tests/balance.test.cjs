const test = require("node:test");
const assert = require("node:assert/strict");
const Decimal = require("../js/technical/break_eternity.js");

const balance = require("../js/balance.js");

function assertStrictlyIncreasing(values, label) {
  assert.ok(values.length > 0, `${label} must not be empty`);
  values.forEach((value) => assert.ok(Number.isFinite(value) && value > 0));
  for (let index = 1; index < values.length; index += 1) {
    assert.ok(values[index] > values[index - 1], `${label} must increase at ${index}`);
  }
}

function assertValidDecimal(value, label) {
  assert.ok(value instanceof Decimal, `${label} must be a Decimal`);
  assert.ok(Number.isFinite(value.sign), `${label} has an invalid sign`);
  assert.ok(Number.isFinite(value.layer), `${label} has an invalid layer`);
  assert.ok(Number.isFinite(value.mag), `${label} has an invalid magnitude`);
  assert.equal(value.sign < 0, false, `${label} must not be negative`);
}

test("all progression costs are positive and strictly increasing", () => {
  assertStrictlyIncreasing(balance.realmUpgradeCosts.slice(0, 2), "base-resource realm upgrades");
  assertStrictlyIncreasing(balance.realmUpgradeCosts.slice(2), "cultivation realm upgrades");
  assertStrictlyIncreasing(balance.realmMilestoneRequirements, "realm milestones");
  assertStrictlyIncreasing(balance.techniqueUpgradeCosts.slice(0, 4), "combat technique upgrades");
  assertStrictlyIncreasing(balance.techniqueUpgradeCosts.slice(4), "cultivation technique upgrades");
  assert.ok(Math.max(...balance.techniqueUpgradeCosts) <= 8, "static technique upgrades must remain reachable");
  assertStrictlyIncreasing(balance.alchemyRecipeCosts, "alchemy recipes");
});

test("the deterministic opening matches the requested pacing envelope", () => {
  const timing = balance.simulateFirstRun();

  assert.ok(timing.firstPurchaseSeconds <= 30);
  assert.ok(timing.firstRealmResetSeconds >= 4 * 60);
  assert.ok(timing.firstRealmResetSeconds <= 6 * 60);
});

test("the opening simulation spends base resources and never emits invalid values", () => {
  const simulation = balance.simulateOpening();

  assert.equal(simulation.firstPurchaseSeconds, 20);
  assert.ok(simulation.firstRealmResetSeconds >= 4 * 60);
  assert.ok(simulation.firstRealmResetSeconds <= 6 * 60);
  assert.deepEqual(simulation.invalidValues, []);
  assert.deepEqual(simulation.unreachableUpgradeIds, []);
});

test("sampled reset and static costs remain valid Decimals", () => {
  const samples = [0, 1, 10, 100, 1e6, 1e20];

  for (const points of samples) {
    const realmGain = new Decimal(points)
      .div(balance.REALM_RESET_REQUIREMENT)
      .max(0)
      .pow(0.5);
    assertValidDecimal(realmGain, `realm gain at ${points}`);
  }

  for (let amount = 0; amount <= 40; amount += 1) {
    const techniqueCost = new Decimal(10).times(Decimal.pow(2.5, Decimal.pow(amount, 1.15))).ceil();
    assertValidDecimal(techniqueCost, `technique cost at ${amount}`);
  }
});

test("offline progress is clamped to eight hours and rejects negative time", () => {
  assert.equal(balance.OFFLINE_LIMIT_SECONDS, 8 * 60 * 60);
  assert.equal(balance.clampOfflineSeconds(-50), 0);
  assert.equal(balance.clampOfflineSeconds(90), 90);
  assert.equal(balance.clampOfflineSeconds(20 * 60 * 60), 8 * 60 * 60);
});

test("realm resets retain only upgrade rows protected by milestones", () => {
  const allUpgrades = [11, 12, 13, 14, 21, 22, 23, 24, 31, 32, 33, 34];

  assert.deepEqual(balance.getRetainedRealmUpgrades(allUpgrades, []), []);
  assert.deepEqual(
    balance.getRetainedRealmUpgrades(allUpgrades, ["2"]),
    [11, 12, 13, 14]
  );
  assert.deepEqual(
    balance.getRetainedRealmUpgrades(allUpgrades, [2, 4]),
    [11, 12, 13, 14, 21, 22, 23, 24]
  );
  assert.deepEqual(
    balance.getRetainedRealmUpgrades(allUpgrades, [2, 4, 6]),
    allUpgrades
  );
  assert.deepEqual(balance.getRetainedRealmUpgrades(null, null), []);
});

test("alchemy reset clears temporary lower-layer progress only", () => {
  const before = {
    basePoints: 123456,
    realm: { points: 90, upgrades: [11, 12, 13], milestones: [0, 1, 2, 3] },
    technique: { points: 6, upgrades: [11, 12], branch: "speed" },
    alchemy: { points: 2, milestones: [0] },
    storyStep: 3,
    storySeen: ["low", "mentor", "talent"],
    automation: { base: true, realm: false }
  };

  const after = balance.applyAlchemyResetSnapshot(before);

  assert.equal(after.basePoints, 0);
  assert.equal(after.realm.points, 0);
  assert.deepEqual(after.realm.upgrades, []);
  assert.equal(after.technique.points, 0);
  assert.deepEqual(after.technique.upgrades, []);
  assert.equal(after.technique.branch, null);
  assert.deepEqual(after.realm.milestones, before.realm.milestones);
  assert.deepEqual(after.alchemy, before.alchemy);
  assert.equal(after.storyStep, before.storyStep);
  assert.deepEqual(after.storySeen, before.storySeen);
  assert.deepEqual(after.automation, before.automation);
});

test("phase one completes only after all required progress is present", () => {
  const complete = {
    realmMilestone: 6,
    alchemyMilestone: 2,
    storyStep: 4,
    fenjueLearned: true,
    recipesPrepared: true
  };
  assert.equal(balance.isPhaseOneComplete(complete), true);
  assert.equal(balance.isPhaseOneComplete({ ...complete, realmMilestone: 5 }), false);
  assert.equal(balance.isPhaseOneComplete({ ...complete, alchemyMilestone: 1 }), false);
  assert.equal(balance.isPhaseOneComplete({ ...complete, storyStep: 3 }), false);
  assert.equal(balance.isPhaseOneComplete({ ...complete, fenjueLearned: false }), false);
  assert.equal(balance.isPhaseOneComplete({ ...complete, recipesPrepared: false }), false);
});
