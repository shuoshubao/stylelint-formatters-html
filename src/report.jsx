const { React, ReactDOM, antd, icons } = window;

const { useMemo, useState } = React;
const { Alert, Button, Card, Empty, Modal, Radio, Space, Table, Tooltip, message } = antd;
const { CheckCircleFilled, CodeOutlined, CopyOutlined, DownOutlined, RightOutlined } = icons;

const { StylelintResults = [], RuleMetadata = {} } = window;

// 规则文档: 优先用 stylelint 自己给的 url, 其次按规则名猜
const getRuleUrl = rule => {
    if (!rule) {
        return '';
    }
    const { url } = RuleMetadata[rule] || {};
    if (url) {
        return url;
    }
    if (rule === 'prettier/prettier') {
        return 'https://github.com/prettier/stylelint-prettier';
    }
    if (rule.includes('order')) {
        return 'https://github.com/constverum/stylelint-config-rational-order';
    }
    return `https://stylelint.io/user-guide/rules/${rule}`;
};

const copyText = async text => {
    try {
        await navigator.clipboard.writeText(text);
    } catch {
        // file:// 下 navigator.clipboard 可能不可用
        const input = document.createElement('input');
        document.body.appendChild(input);
        input.setAttribute('value', text);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
    }
    message.success(`复制成功: ${text}`);
};

const getStatus = ({ errorCount, warningCount }) => {
    if (errorCount) {
        return 'error';
    }
    if (warningCount) {
        return 'warning';
    }
    return 'success';
};

const ResultList = StylelintResults.map(item => {
    const { warnings = [] } = item;
    return {
        ...item,
        errorCount: warnings.filter(item2 => item2.severity === 'error').length,
        warningCount: warnings.filter(item2 => item2.severity === 'warning').length,
        warnings: warnings.map(item2 => {
            return { ...item2, url: getRuleUrl(item2.rule) };
        })
    };
});

const FileCard = ({ item, collapsed, onToggle, onShowCode }) => {
    const { source, errorCount, warningCount, warnings } = item;

    const total = errorCount + warningCount;

    const columns = [
        {
            key: 'position',
            width: 80,
            render: (text, item2) => (
                <Tooltip title="点击复制文件路径和行号">
                    <a onClick={() => copyText([source, item2.line, item2.column].filter(Boolean).join(':'))}>{[item2.line, item2.column].join(':')}</a>
                </Tooltip>
            )
        },
        {
            key: 'severity',
            width: 110,
            render: (text, item2) => (
                <Space size={4}>
                    <span className={`color-${item2.severity}`}>{item2.severity === 'error' ? 'Error' : 'Warning'}</span>
                    <Tooltip title="点击查看源码">
                        <CodeOutlined className="cursor-pointer" onClick={() => onShowCode(item, item2)} />
                    </Tooltip>
                </Space>
            )
        },
        {
            key: 'text',
            render: (text, item2) => (
                <Tooltip title={item2.text}>
                    <pre className="warning-text">{item2.text}</pre>
                </Tooltip>
            )
        },
        {
            key: 'rule',
            width: 240,
            align: 'right',
            render: (text, item2) =>
                item2.rule ? (
                    <a href={item2.url} target="_blank" rel="noreferrer">
                        {item2.rule}
                    </a>
                ) : null
        }
    ];
    const title = (
        <div className={`flex items-center gap-2 file-card-title${total ? ' cursor-pointer' : ''}`} onClick={total ? onToggle : undefined}>
            <span className="flex-none">{total ? collapsed ? <RightOutlined /> : <DownOutlined /> : <CheckCircleFilled />}</span>
            <span className="truncate" onClick={e => e.stopPropagation()}>
                {source}
            </span>
            <Tooltip title="点击复制文件路径">
                <CopyOutlined
                    className="flex-none cursor-pointer"
                    onClick={e => {
                        e.stopPropagation();
                        copyText(source);
                    }}
                />
            </Tooltip>
            <b className="ml-auto flex-none text-xs whitespace-nowrap">
                {`${total} problems`}
                {total ? ` (${errorCount} errors, ${warningCount} warnings)` : ''}
            </b>
        </div>
    );

    return (
        <Card className={`file-card is-${getStatus(item)}`} size="small" title={title} styles={{ body: { padding: 0 } }}>
            {collapsed || !total ? null : (
                <Table rowKey={(item2, index) => index} columns={columns} dataSource={warnings} showHeader={false} pagination={false} size="small" />
            )}
        </Card>
    );
};

const CodeModal = ({ data, onClose }) => {
    const { open, source, lines, warning } = data;

    return (
        <Modal
            className="code-modal"
            open={open}
            title={`源码: ${source}`}
            width="90%"
            onCancel={onClose}
            footer={warning.text ? <Alert type={warning.severity} showIcon message={warning.text} /> : null}
        >
            {lines.length ? (
                <div className="css-source">
                    {lines.map((item, index) => (
                        <pre key={index} className={warning.line === index + 1 ? 'highlight' : ''}>
                            {item}
                        </pre>
                    ))}
                </div>
            ) : (
                <Empty description="无源码" />
            )}
        </Modal>
    );
};

const SortOptions = [
    { label: '错误数', value: 'count' },
    { label: '文件路径', value: 'path' }
];

const App = () => {
    const [sortType, setSortType] = useState('count');
    const [collapsedMap, setCollapsedMap] = useState({});
    const [codeModal, setCodeModal] = useState({ open: false, source: '', lines: [], warning: {} });

    const dataSource = useMemo(() => {
        const list = [...ResultList];
        if (sortType === 'count') {
            return list.sort((a, b) => b.errorCount - a.errorCount || b.warningCount - a.warningCount || a.source.localeCompare(b.source));
        }
        return list.sort((a, b) => a.source.localeCompare(b.source));
    }, [sortType]);

    const openAll = dataSource.some(item => item.errorCount + item.warningCount && !collapsedMap[item.source]);

    const handleToggleAll = () => {
        setCollapsedMap(openAll ? Object.fromEntries(dataSource.map(item => [item.source, true])) : {});
    };

    const handleShowCode = (item, item2) => {
        setCodeModal({ open: true, source: item.source, lines: item.css ? item.css.split('\n') : [], warning: item2 });
    };

    const title = (
        <div className="flex items-center gap-2">
            <span className="flex-none">Stylelint 报告</span>
            <Radio.Group value={sortType} onChange={e => setSortType(e.target.value)} optionType="button" size="small" options={SortOptions} />
            <Button className="ml-auto" type="primary" size="small" onClick={handleToggleAll}>
                {openAll ? '全部折叠' : '全部展开'}
            </Button>
        </div>
    );

    return (
        <Card className="stylelint-report" size="small" title={title} styles={{ body: { padding: 0 } }}>
            {dataSource.map(item => (
                <FileCard
                    key={item.source}
                    item={item}
                    collapsed={!!collapsedMap[item.source]}
                    onToggle={() => setCollapsedMap(prev => ({ ...prev, [item.source]: !prev[item.source] }))}
                    onShowCode={handleShowCode}
                />
            ))}
            <CodeModal data={codeModal} onClose={() => setCodeModal(prev => ({ ...prev, open: false }))} />
        </Card>
    );
};

ReactDOM.createRoot(document.querySelector('#root')).render(<App />);
