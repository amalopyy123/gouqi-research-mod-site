# Gouqi Research Mod Pages

这是一个可直接部署到 Cloudflare Pages 的静态页面，不需要 Node.js、构建命令或服务器函数。

## 发布前配置

编辑 `config.js`，填入百度云分享链接和提取码：

```js
window.SITE_CONFIG = {
  modVersion: 'v1.0.0',
  baiduUrl: 'https://pan.baidu.com/s/你的分享链接',
  baiduCode: 'xxxx',
  archivePassword: '你的解压密码',
  githubUrl: 'https://github.com/amalopyy123/gouqi-mgqp-research-mod'
};
```

`modVersion` 会显示在网站头部和页脚。请按实际发布版本修改，例如 `v1.2.0`。

`baiduCode` 是百度云提取码，`archivePassword` 是下载压缩包后的解压密码。没有解压密码时可以保留为空字符串。

不要删除或改名这十八个 CSV 文件。页面会在浏览器中读取它们，并提供搜索、分页、详情查看和当前表格下载：

- `变量名称表.csv`
- `开关名称表.csv`
- `武器.csv`
- `防具.csv`
- `物品.csv`
- `角色.csv`
- `敌人.csv`
- `敌人掉落偷窃.csv`
- `地图.csv`
- `敌人入队与图片资源.csv`
- `角色图片资源.csv`
- `合成防具.csv`
- `合成武器.csv`
- `合成物品.csv`
- `技能.csv`
- `能力.csv`
- `职业.csv`
- `种族.csv`

后续更新数据时替换对应 CSV，再重新部署即可。

## 分享带搜索条件的链接

页面支持通过 URL 参数直接打开指定数据表和搜索结果：

```text
?dataset=skills&q=火焰
?dataset=jobs&q=战士&type=技能&level=3
```

支持的参数为 `dataset`、`q`、`type`、`level`、`page` 和 `size`。在页面中搜索、切换标签、筛选或翻页时，地址栏会自动同步，复制该 URL 即可分享当前查询。

技能、能力、职业学习和种族学习表默认只显示常用字段。点击每行右侧的“详情”按钮可以查看完整列；长文本在主表中会预览，完整内容保留在详情窗口中。

## Cloudflare Pages 部署

1. 在 Cloudflare Dashboard 打开 **Workers & Pages**，新建 Pages 项目。
2. 若使用直接上传，上传整个 `cloudflare` 文件夹。
3. 若连接 GitHub，将此文件夹设为项目根目录；构建命令留空，输出目录填 `.`（或留空，按 Cloudflare 页面提示选择）。

首页入口和资料表都在 `index.html`，样式与交互分别在 `styles.css`、`app.js`。


## 可复用的说明页模板

`mod-guide-template/` 保存了当前说明页的模板和生成说明。它包含单列大图样式、图片点击放大、按原文顺序穿插文字与图片的内容结构，以及可直接复制到新对话中的操作提示。后续生成新的 Mod 介绍页时，优先阅读其中的 `README.md`。
