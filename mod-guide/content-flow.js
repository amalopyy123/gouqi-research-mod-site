(function () {
  "use strict";

  const flows = {
    v10: [
      [["text", 0], ["images", ["编队.png", "全队友.png", "全形态.png"]]],
      [["images", ["跟随.png"]]],
      [["text", 0], ["images", ["物品和变量修改.png"]]],
      [["text", 0], ["images", ["开关功能.png"]]],
      [["text", 0], ["text", 1], ["images", ["查看备注.png"]], ["text", 2], ["text", 3], ["images", ["图鉴特写.png"]]],
      [["text", 0], ["images", ["魔王城全对话.png"]]],
      [["text", 0], ["text", 1], ["images", ["搭话模拟.png"]], ["text", 2], ["images", ["特殊技能.png", "异常状态.png"]]],
      [["text", 0], ["text", 1], ["images", ["查看敌方信息3.png"]], ["text", 2], ["images", ["查看cut-in.png"]]],
      [["text", 0], ["images", ["调试音乐.png"]]],
      [["text", 0], ["text", 1], ["text", 2], ["text", 3], ["text", 4], ["text", 5], ["images", ["圣山开关EV023.png", "空贼团宴会EV002.png"]], ["text", 6], ["images", ["开关和变量.png"]], ["text", 7], ["images", ["卡关处理.png"]], ["text", 8], ["images", ["地图跳转.png"]]],
      [["text", 0], ["images", ["地图与事件检查1.png", "地图与事件检查2.png"]]],
      [["text", 0], ["images", ["实验功能.png"]]],
      [["text", 0], ["text", 1], ["images", ["战斗修改.png"]]]
    ],
    v11: [
      [["text", 0], ["images", ["全技能台词1.png", "全技能台词2.png"]]],
      [["text", 0], ["images", ["哈比羽毛改.png"]]],
      [["text", 0], ["images", ["获取敌人物品1.png"]]],
      [["text", 0], ["images", ["获取敌人物品2.png"]]],
      [["text", 0], ["images", ["宝箱提示.png", "宝箱提示2.png", "宝箱提示3.png"]]],
      [["text", 0], ["images", ["打开宝箱.png"]]],
      [["text", 0], ["images", ["消耗类开关.png"]]],
      [["text", 0], ["images", ["无消耗料理.png"]]],
      [["text", 0], ["images", ["月无之舞.png"]]]
    ],
    v12: [
      [["text", 0], ["text", 1], ["text", 2], ["images", ["累计类增伤修改.png"]]],
      [["text", 0], ["images", ["香水诱惑模拟.png"]]],
      [["text", 0], ["images", ["入队模拟.png", "入队模拟2.png"]]],
      [["text", 0], ["images", ["魔王城赠送礼物改.png"]]],
      [["text", 0], ["images", ["移出候补1.png", "移出候补2.png"]]],
      [["text", 0], ["images", ["魔王城撒娇改.png"]]],
      [["text", 0], ["images", ["切换当前角色种族.png"]]],
      [["text", 0], ["text", 1], ["text", 2], ["images", ["查询能力.png", "当前角色学习技能.png", "当前角色学习能力.png"]]],
      [["text", 0], ["images", ["强制胜利.png"]]],
      [["text", 0], ["images", ["查询合成.png", "合成改.png"]]],
      [["text", 0], ["text", 1], ["text", 2], ["text", 3], ["text", 4], ["text", 5], ["text", 6], ["images", ["查询鲁卡图片.png", "图片资源替换1.png"]], ["text", 7], ["images", ["图片资源替换2.png"]], ["text", 8], ["text", 9], ["text", 10], ["images", ["图片资源替换3.png"]]]
    ]
  };

  function fileNameFromSource(source) {
    return decodeURIComponent(source.split("/").pop());
  }

  function createFigure(version, fileName) {
    const figure = document.createElement("figure");
    const image = document.createElement("img");
    const caption = document.createElement("figcaption");
    const label = fileName.replace(/\.[^.]+$/, "");
    image.src = `images/${version}/${fileName}`;
    image.alt = `${label}截图`;
    image.loading = "lazy";
    caption.textContent = label;
    figure.append(image, caption);
    return figure;
  }

  function applyFlow(sectionId, version, sectionFlows) {
    const cards = document.querySelectorAll(`#${sectionId} .feature-card`);
    sectionFlows.forEach((flow, cardIndex) => {
      const card = cards[cardIndex];
      if (!card) return;

      const title = card.querySelector(":scope > h3");
      const paragraphs = Array.from(card.querySelectorAll(":scope > p"));
      const figures = new Map();
      card.querySelectorAll(":scope > .gallery figure").forEach((figure) => {
        const image = figure.querySelector("img");
        if (image) figures.set(fileNameFromSource(image.getAttribute("src")), figure);
      });

      card.replaceChildren(title);
      flow.forEach(([type, value]) => {
        if (type === "text") {
          if (paragraphs[value]) card.append(paragraphs[value]);
          return;
        }

        const gallery = document.createElement("div");
        gallery.className = "gallery";
        value.forEach((fileName) => gallery.append(figures.get(fileName) || createFigure(version, fileName)));
        card.append(gallery);
      });
    });
  }

  applyFlow("v10", "v1.0", flows.v10);
  applyFlow("v11", "v1.1", flows.v11);
  applyFlow("v12", "v1.2", flows.v12);
})();
