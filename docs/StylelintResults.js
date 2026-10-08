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
        css: '.baz {\n    COLOR: blue;\n    margin: 0px;\n}\n',
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
            }
        ]
    }
];
