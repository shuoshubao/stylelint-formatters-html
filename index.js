import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import stripAnsi from 'strip-ansi';

const rootPath = process.cwd();

const readAsset = fileName => {
    return readFileSync(fileURLToPath(new URL(`src/${fileName}`, import.meta.url))).toString();
};

/**
 * source => 相对路径
 * _postcssResult => css 源码, 报告页查看源码用
 * warnings[].text => 去掉 ansi 颜色码
 */
const formatStylelintResults = (results = []) => {
    return results.map(item => {
        const { source, _postcssResult, warnings = [] } = item;
        return {
            source: relative(rootPath, source),
            css: _postcssResult ? _postcssResult.toString() : '',
            warnings: warnings.map(item2 => {
                return {
                    ...item2,
                    text: stripAnsi(item2.text)
                };
            })
        };
    });
};

// 内联进 <script> 的数据需要转义, 否则 </script> 之类的内容会提前闭合标签
const serialize = data => {
    return JSON.stringify(data).replace(/</g, '\\u003c');
};

export default (results, returnValue = {}) => {
    if (results.every(item => item.warnings.length === 0)) {
        return '';
    }

    const { ruleMetadata = {} } = returnValue;

    return `
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Stylelint Report</title>
    <link rel="icon" href="https://stylelint.io/img/favicon.svg" />
    <link rel="stylesheet" href="https://registry.npmmirror.com/antd/6.6.4/files/dist/reset.css" />
    <script src="https://registry.npmmirror.com/react/18.3.1/files/umd/react.production.min.js"></script>
    <script src="https://registry.npmmirror.com/react-dom/18.3.1/files/umd/react-dom.production.min.js"></script>
    <script src="https://registry.npmmirror.com/dayjs/1.11.13/files/dayjs.min.js"></script>
    <script src="https://registry.npmmirror.com/antd/6.6.4/files/dist/antd.min.js"></script>
    <script src="https://registry.npmmirror.com/@ant-design/icons/6.3.4/files/dist/index.umd.min.js"></script>
    <script src="https://registry.npmmirror.com/@babel/standalone/7.26.4/files/babel.min.js"></script>
    <style>
        ${readAsset('report.css')}
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script>
      window.StylelintResults = ${serialize(formatStylelintResults(results))};
      window.RuleMetadata = ${serialize(ruleMetadata)};
    </script>
    <script type="text/babel" data-presets="react">
        ${readAsset('report.jsx')}
    </script>
  </body>
</html>
`;
};
