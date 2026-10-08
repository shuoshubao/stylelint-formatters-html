window.StylelintCwd = '/Users/shuoshubao/Documents/Github/demo-project';

window.StylelintCreateTime = 1760000000000;

window.RuleMetadata = {
    'color-hex-length': { url: 'https://stylelint.io/user-guide/rules/color-hex-length', fixable: true },
    'property-case': { url: 'https://stylelint.io/user-guide/rules/property-case', fixable: true },
    'length-zero-no-unit': { url: 'https://stylelint.io/user-guide/rules/length-zero-no-unit', fixable: true },
    'block-no-empty': { url: 'https://stylelint.io/user-guide/rules/block-no-empty' }
};

window.StylelintResults = [
    {
        source: 'src/util/2.css',
        css: '.foo {\n    color: red;\n}\n',
        warnings: []
    },
    {
        source: 'src/containers/demo1/4.scss',
        css: '.bar {\n    color: #333333;\n\n}\n',
        warnings: [
            {
                line: 3,
                column: 1,
                rule: 'prettier/prettier',
                severity: 'error',
                text: 'Delete "⏎" (prettier/prettier)'
            },
            {
                line: 2,
                column: 12,
                rule: 'color-hex-length',
                severity: 'error',
                text: 'Expected "#333333" to be "#333" (color-hex-length)'
            }
        ]
    },
    {
        source: 'src/containers/demo2/index.less',
        css: '.baz {\n    COLOR: blue;\n    margin: 0px;\n}\n.empty {}\n',
        warnings: [
            {
                line: 2,
                column: 5,
                rule: 'property-case',
                severity: 'warning',
                text: 'Expected "COLOR" to be "color" (property-case)'
            },
            {
                line: 3,
                column: 13,
                rule: 'length-zero-no-unit',
                severity: 'warning',
                text: 'Unexpected unit (length-zero-no-unit)'
            },
            {
                line: 5,
                column: 8,
                rule: 'block-no-empty',
                severity: 'error',
                text: 'Empty block (block-no-empty)'
            }
        ]
    },
    {
        source: 'src/styles/broken.css',
        css: '',
        warnings: [
            {
                line: 2,
                column: 13,
                rule: 'CssSyntaxError',
                severity: 'error',
                text: 'Unclosed block (CssSyntaxError)'
            }
        ]
    }
];
