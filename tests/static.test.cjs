const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

test("the game has no external runtime dependencies", () => {
  const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.doesNotMatch(index, /https?:\/\//i);
  assert.match(index, /vendor\/vue\.min\.js/);
});

test("the save id, version and offline cap are stable", () => {
  const mod = fs.readFileSync(path.join(root, "js", "mod.js"), "utf8");
  assert.match(mod, /id:\s*["']doupo-fenjue-road["']/);
  assert.match(mod, /num:\s*["']0\.1\.0["']/);
  assert.match(mod, /offlineLimit:\s*8/);
});

test("the working copy keeps required third-party notices", () => {
  for (const file of ["LICENSE", "Prestige-tree-license", "THIRD_PARTY_NOTICES.md", "FAN_NOTICE.md"]) {
    assert.equal(fs.existsSync(path.join(root, file)), true, `${file} must exist`);
  }
});

test("offline ticks generate resources without running automatic actions", () => {
  const game = fs.readFileSync(path.join(root, "js", "game.js"), "utf8");
  assert.match(game, /function gameLoop\(diff, automaticActions = true\)/);
  assert.match(game, /if \(automaticActions\) \{/);
  assert.match(game, /gameLoop\(offlineDiff, false\)/);
});

test("tree drawing tolerates layers that are still initializing", () => {
  const canvas = fs.readFileSync(path.join(root, "js", "technical", "canvas.js"), "utf8");

  assert.match(canvas, /if \(!tmp\[layer\]\) continue/);
});

test("the realm automation toggle controls both resetting and upgrade buying", () => {
  const realm = fs.readFileSync(path.join(root, "js", "layers", "realm.js"), "utf8");
  assert.match(realm, /autoPrestige:\s*function/);
  assert.match(realm, /hasUpgrade\("technique", 14\)/);
  assert.match(realm, /autoUpgrade:\s*function/);
});

test("realm prestige clears upgrades except milestone-protected rows", () => {
  const realm = fs.readFileSync(path.join(root, "js", "layers", "realm.js"), "utf8");

  assert.match(realm, /resettingLayer === this\.layer/);
  assert.match(realm, /getRetainedRealmUpgrades/);
  assert.match(realm, /layers\[resettingLayer\]\.row > this\.row/);
});

test("realm upgrades and milestones use separate tabs", () => {
  const realm = fs.readFileSync(path.join(root, "js", "layers", "realm.js"), "utf8");
  const tabFormat = realm.slice(realm.indexOf("tabFormat:"));
  const upgradesTabStart = tabFormat.indexOf('"境界升级"');
  const milestonesTabStart = tabFormat.indexOf('"修炼里程碑"');
  const upgradesTab = tabFormat.slice(upgradesTabStart, milestonesTabStart);
  const milestonesTab = tabFormat.slice(milestonesTabStart);

  assert.match(tabFormat, /^tabFormat:\s*\{/);
  assert.ok(upgradesTabStart >= 0 && upgradesTabStart < milestonesTabStart);
  assert.match(upgradesTab, /"upgrades"/);
  assert.doesNotMatch(upgradesTab, /"milestones"/);
  assert.match(milestonesTab, /"milestones"/);
  assert.doesNotMatch(milestonesTab, /"upgrades"/);
});

test("upgrade buttons expose clear purchase states", () => {
  const theme = fs.readFileSync(path.join(root, "css", "doupo-theme.css"), "utf8");
  const index = fs.readFileSync(path.join(root, "index.html"), "utf8");

  assert.match(theme, /\.upg\.can:not\(\.bought\)::after[\s\S]*content:\s*"可修炼"/);
  assert.match(theme, /\.upg\.locked:not\(\.bought\)::after[\s\S]*content:\s*"资源不足"/);
  assert.match(theme, /\.upg\.bought::after[\s\S]*content:\s*"已掌握"/);
  assert.match(theme, /\.upg\.bought\s*\{[\s\S]*animation:\s*upgrade-acquired/);
  assert.match(index, /css\/doupo-theme\.css\?v=[^"']+/);
});

test("custom mod files are parser loaded in their declared order", () => {
  const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const scriptSources = [
    "js/balance.js",
    "js/content.js",
    "js/layers/realm.js",
    "js/layers/technique.js",
    "js/layers/alchemy.js",
    "js/layers/story.js",
    "js/tree.js"
  ];
  let previousIndex = -1;

  for (const source of scriptSources) {
    const sourceIndex = index.indexOf(`src="${source}"`);
    assert.ok(sourceIndex > previousIndex, `${source} must load after the previous mod file`);
    previousIndex = sourceIndex;
  }
  assert.doesNotMatch(index, /src="js\/technical\/loader\.js"/);
});

test("content data only uses require inside Node", () => {
  const content = fs.readFileSync(path.join(root, "js", "content.js"), "utf8");

  assert.match(content, /typeof require === ["']function["']/);
  assert.doesNotMatch(content, /DOUPO_BALANCE\s*\|\|\s*require/);
});
