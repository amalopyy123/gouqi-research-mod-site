# Gouqi Research Mod Pages

这是一个可直接部署到 Cloudflare Pages 的静态页面，不需要 Node.js、构建命令或服务器函数。

## 发布前配置

编辑 `config.js`，填入百度云分享链接和提取码：

```js
window.SITE_CONFIG = {
  baiduUrl: 'https://pan.baidu.com/s/你的分享链接',
  baiduCode: 'xxxx',
  githubUrl: 'https://github.com/amalopyy123/gouqi-mgqp-research-mod'
};
```

不要删除或改名这五个 CSV 文件。页面会在浏览器中读取它们，并提供搜索、分页和当前表格下载：

- `变量名称表.csv`
- `开关名称表.csv`
- `武器.csv`
- `防具.csv`
- `物品.csv`

后续更新数据时替换对应 CSV，再重新部署即可。

## Cloudflare Pages 部署

1. 在 Cloudflare Dashboard 打开 **Workers & Pages**，新建 Pages 项目。
2. 若使用直接上传，上传整个 `cloudflare` 文件夹。
3. 若连接 GitHub，将此文件夹设为项目根目录；构建命令留空，输出目录填 `.`（或留空，按 Cloudflare 页面提示选择）。

首页入口和资料表都在 `index.html`，样式与交互分别在 `styles.css`、`app.js`。
