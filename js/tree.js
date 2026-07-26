var layoutInfo = {
  startTab: "realm",
  startNavTab: "tree-tab",
  showTree: true,
  treeLayout: [
    ["realm", "technique"],
    ["blank", "alchemy", "blank"]
  ]
};

addNode("blank", {
  layerShown: "ghost"
});

addLayer("tree-tab", {
  tabFormat: [["tree", function () { return layoutInfo.treeLayout; }]],
  previousTab: "",
  leftTab: true,
  style: function () {
    return {
      "background-color": "transparent"
    };
  }
});
