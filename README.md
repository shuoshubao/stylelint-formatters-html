# 简介

- 一款更好的 stylelint 报告格式化工具.
- 基于 React + antd 渲染, 产出单文件 HTML 报告.
- 官方介绍请参考: [https://stylelint.io/developer-guide/formatters](https://stylelint.io/developer-guide/formatters)
- [demo](https://shuoshubao.github.io/stylelint-formatters-html/index.html)
- [github](https://github.com/shuoshubao/stylelint-formatters-html)

# 安装

```
npm i -D stylelint-formatters-html
```

# 使用

```
stylelint -o StylelintReport.html --aei --custom-formatter node_modules/stylelint-formatters-html **/*.{css,less,scss,sass}
```

# 说明

- 纯 ESM 包, 需要 node >= 18、stylelint >= 16.
- 报告页的 React / antd / babel 走 cdn, 打开报告需要联网.
- 本地看 demo: 启动静态服务后访问 `index.html` (`npx serve .`), babel 需要用 http 协议加载 `src/report.jsx`; 实际产出的报告是单文件内联的, 直接双击打开即可.
