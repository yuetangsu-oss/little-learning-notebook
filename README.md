# 孩子的学习小本

一个只在当前设备保存数据的儿童学习记录 PWA，可分别记录中文、英文和阿拉伯数字。

## 本地开发

```bash
npm install
npm run dev
```

## 发布到 GitHub Pages

1. 将项目推送到 GitHub 仓库的 `main` 分支。
2. 在仓库的 **Settings → Pages** 中，将 **Source** 选择为 **GitHub Actions**。
3. 等待 `Deploy to GitHub Pages` 工作流完成。
4. 用安卓 Chrome 打开 Pages 地址，在菜单中选择“添加到主屏幕”。

> 学习记录仅保存在访问设备的浏览器 IndexedDB 中。清除网站数据或更换手机会导致记录丢失。
