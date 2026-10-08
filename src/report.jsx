const { React, ReactDOM, antd, icons, dayjs } = window;

const { useEffect, useMemo, useState } = React;
const {
    Alert,
    Badge,
    Button,
    Card,
    ConfigProvider,
    Dropdown,
    Empty,
    FloatButton,
    List,
    Modal,
    Progress,
    Space,
    Statistic,
    Table,
    Tooltip,
    Typography,
    message,
    theme
} = antd;
const { CodeOutlined, CopyOutlined, DownOutlined, RightOutlined, VerticalAlignTopOutlined } = icons;

const { Link, Text } = Typography;

const { defaultAlgorithm, darkAlgorithm } = theme;

const { StylelintResults = [], RuleMetadata = {}, StylelintCwd = '', StylelintCreateTime = 0 } = window;

// 语法错误: 文件根本没解析成功, 单独展示, 不参与规则排行
const SyntaxErrorRule = 'CssSyntaxError';

const ErrorColor = '#ff4d4f';

const WarningColor = '#faad14';

const SuccessColor = '#52c41a';

const sum = (list = []) => list.reduce((prev, item) => prev + item, 0);

const uniq = (list = []) => [...new Set(list)];

const getSeverityType = severity => (severity === 'error' ? 'danger' : 'warning');

const copyText = (text, messageApi) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    messageApi.success(`已复制: ${text}`);
};

// 规则文档: 优先用 stylelint 自己给的 url, 其次按规则名猜
const getRuleUrl = rule => {
    if (!rule || rule === SyntaxErrorRule) {
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

const AllResults = StylelintResults.map(item => {
    const { warnings = [] } = item;
    return {
        ...item,
        errorCount: warnings.filter(item2 => item2.severity === 'error').length,
        warningCount: warnings.filter(item2 => item2.severity === 'warning').length,
        fatal: warnings.some(item2 => item2.rule === SyntaxErrorRule),
        warnings: warnings.map(item2 => {
            return {
                ...item2,
                url: getRuleUrl(item2.rule),
                fixable: Boolean((RuleMetadata[item2.rule] || {}).fixable)
            };
        })
    };
});

const FatalResults = AllResults.filter(item => item.fatal);

const ProblematicResults = AllResults.filter(item => !item.fatal && item.warnings.length !== 0);

const CleanResults = AllResults.filter(item => !item.fatal && item.warnings.length === 0);

const AllWarnings = ProblematicResults.flatMap(item => item.warnings);

const Analysis = {
    errorCount: sum(ProblematicResults.map(item => item.errorCount)),
    warningCount: sum(ProblematicResults.map(item => item.warningCount)),
    fixableCount: AllWarnings.filter(item => item.fixable).length,
    filesCount: AllResults.length,
    successFileCount: CleanResults.length
};

const hasNoError = Analysis.errorCount === 0 && FatalResults.length === 0;

const SeverityEnum = [
    { value: 'error', text: <Text type="danger">error</Text> },
    { value: 'warning', text: <Text type="warning">warning</Text> }
];

// 规则排行: error 在前, 同级按出现次数倒序
const getRankRules = (severities = ['error', 'warning']) => {
    return uniq(AllWarnings.map(item => item.rule))
        .filter(Boolean)
        .map(rule => {
            const sameList = AllWarnings.filter(item => item.rule === rule);
            const { severity, url, fixable, text } = sameList[0];
            return {
                rule,
                url,
                fixable,
                text,
                severity,
                count: sameList.length,
                filesCount: ProblematicResults.filter(item => item.warnings.some(item2 => item2.rule === rule)).length
            };
        })
        .filter(item => severities.includes(item.severity))
        .sort((a, b) => {
            if (a.severity !== b.severity) {
                return a.severity === 'error' ? -1 : 1;
            }
            return b.count - a.count || a.rule.localeCompare(b.rule);
        });
};

const RulesColumns = [
    { title: 'Count', dataIndex: 'count', width: 70 },
    { title: 'Files', dataIndex: 'filesCount', width: 70 },
    {
        title: 'Rule',
        dataIndex: 'rule',
        width: 320,
        filters: SeverityEnum,
        render: (value, item) => {
            const { url, fixable, severity } = item;
            const type = getSeverityType(severity);
            return (
                <Space size={4}>
                    {url ? (
                        <Link href={url} target="_blank" type={type} copyable>
                            {value}
                        </Link>
                    ) : (
                        <Text type={type} copyable>
                            {value}
                        </Text>
                    )}
                    {fixable && <span title="stylelint --fix 可自动修复">🔧</span>}
                </Space>
            );
        }
    },
    {
        title: 'Example',
        dataIndex: 'text',
        render: value => (
            <Text type="secondary" ellipsis={{ tooltip: value }}>
                {value}
            </Text>
        )
    }
];

const FileColumns = [
    {
        key: 'source',
        render: (value, item) => (
            <Text copyable type={item.errorCount ? 'danger' : 'warning'}>
                {item.source}
            </Text>
        )
    },
    {
        key: 'count',
        width: 120,
        align: 'right',
        render: (value, item) => (
            <Space size={4}>
                {Boolean(item.errorCount) && <Badge color={ErrorColor} count={item.errorCount} />}
                {Boolean(item.warningCount) && <Badge color={WarningColor} count={item.warningCount} />}
            </Space>
        )
    }
];

const getWarningColumns = (item, onShowCode) => [
    {
        key: 'position',
        width: 90,
        render: (value, item2) => {
            const text = [item.source, item2.line, item2.column].filter(Boolean).join(':');
            return <Text copyable={{ text, tooltips: ['复制文件路径和行号', '已复制'] }}>{[item2.line, item2.column].join(':')}</Text>;
        }
    },
    {
        key: 'code',
        width: 40,
        render: (value, item2) => (
            <Tooltip title="查看源码">
                <Button type="text" icon={<CodeOutlined />} onClick={() => onShowCode(item, item2)} />
            </Tooltip>
        )
    },
    {
        key: 'rule',
        width: 320,
        render: (value, item2) => {
            const { rule, url, fixable, severity } = item2;
            const type = getSeverityType(severity);
            return (
                <Space size={4}>
                    {url ? (
                        <Link href={url} target="_blank" type={type} copyable>
                            {rule}
                        </Link>
                    ) : (
                        <Text type={type}>{rule}</Text>
                    )}
                    {fixable && <span title="stylelint --fix 可自动修复">🔧</span>}
                </Space>
            );
        }
    },
    {
        key: 'text',
        dataIndex: 'text',
        render: value => <pre className="warning-text">{value}</pre>
    }
];

const SortModeEnum = [
    { key: 'errors', label: '错误数' },
    { key: 'source', label: '文件路径' }
];

const isDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

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

const App = () => {
    const [dark, setDark] = useState(isDark);
    const [rankRules, setRankRules] = useState(getRankRules);
    const [selectedRules, setSelectedRules] = useState(() => getRankRules().map(item => item.rule));
    const [sortMode, setSortMode] = useState('errors');
    const [collapsedMap, setCollapsedMap] = useState({});
    const [codeModal, setCodeModal] = useState({ open: false, source: '', lines: [], warning: {} });

    const [messageApi, messageContextHolder] = message.useMessage();

    useEffect(() => {
        const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = event => setDark(event.matches);
        mediaQueryList.addEventListener('change', handleChange);
        return () => mediaQueryList.removeEventListener('change', handleChange);
    }, []);

    const showResults = useMemo(() => {
        const list = ProblematicResults.filter(item => item.warnings.some(item2 => selectedRules.includes(item2.rule)));
        if (sortMode === 'errors') {
            return list.sort((a, b) => b.errorCount - a.errorCount || b.warningCount - a.warningCount || a.source.localeCompare(b.source));
        }
        return list.sort((a, b) => a.source.localeCompare(b.source));
    }, [sortMode, selectedRules]);

    const expandedRowKeys = showResults.filter(item => !collapsedMap[item.source]).map(item => item.source);

    const openAll = expandedRowKeys.length !== 0;

    const handleToggleAll = () => {
        setCollapsedMap(openAll ? Object.fromEntries(showResults.map(item => [item.source, true])) : {});
    };

    const handleRankTableChange = (pagination, filters) => {
        const severities = filters.rule || SeverityEnum.map(item => item.value);
        const nextRankRules = getRankRules(severities);
        setRankRules(nextRankRules);
        setSelectedRules(nextRankRules.map(item => item.rule));
    };

    const handleShowCode = (item, item2) => {
        setCodeModal({ open: true, source: item.source, lines: item.css ? item.css.split('\n') : [], warning: item2 });
    };

    const handleCopyErrorFiles = () => {
        const files = showResults.filter(item => item.errorCount).map(item => item.source);
        copyText(files.join(' '), messageApi);
    };

    return (
        <ConfigProvider componentSize="small" theme={{ algorithm: dark ? darkAlgorithm : defaultAlgorithm }}>
            <div className="report-root" style={{ background: dark ? '#000' : '#fff' }}>
                <Space direction="vertical" size={12} className="w-full">
                    {FatalResults.length !== 0 && (
                        <Card title="Syntax Errors" extra={<Badge color={ErrorColor} count={FatalResults.length} />} hoverable>
                            <List
                                rowKey="source"
                                dataSource={FatalResults}
                                renderItem={item => (
                                    <List.Item>
                                        <Space direction="vertical" size={4} className="w-full">
                                            <Text type="danger" copyable>
                                                {item.source}
                                            </Text>
                                            <pre className="warning-text">{item.warnings[0].text}</pre>
                                        </Space>
                                    </List.Item>
                                )}
                            />
                        </Card>
                    )}

                    <Card
                        title="Stylelint Report"
                        extra={
                            <Space>
                                <Button>{StylelintCwd.split('/').filter(Boolean).pop()}</Button>
                                <Button>{dayjs(StylelintCreateTime).format('YYYY-MM-DD HH:mm:ss')}</Button>
                            </Space>
                        }
                        hoverable
                    >
                        {hasNoError ? (
                            <Progress type="circle" percent={100} />
                        ) : (
                            <Space size={50}>
                                <Statistic title="Totals" formatter={() => `${Analysis.errorCount + Analysis.warningCount}(${Analysis.fixableCount}🔧)`} />
                                <Statistic title="Errors" value={Analysis.errorCount} />
                                <Statistic title="Warnings" value={Analysis.warningCount} />
                                <Statistic
                                    title="Files"
                                    formatter={() => (
                                        <Space size={4}>
                                            <span>{Analysis.filesCount}</span>
                                            <Badge color={ErrorColor} count={Analysis.filesCount - Analysis.successFileCount} />
                                            <Badge color={SuccessColor} count={Analysis.successFileCount} />
                                        </Space>
                                    )}
                                />
                            </Space>
                        )}
                        {rankRules.length !== 0 && (
                            <Table
                                rowKey="rule"
                                className="rank-table"
                                rowSelection={{ selectedRowKeys: selectedRules, onChange: setSelectedRules }}
                                columns={RulesColumns}
                                dataSource={rankRules}
                                onChange={handleRankTableChange}
                                pagination={false}
                                scroll={{ y: 41 * 10 }}
                            />
                        )}
                        <FloatButton.BackTop icon={<VerticalAlignTopOutlined />} />
                    </Card>

                    {showResults.length !== 0 && (
                        <Card
                            title="Errors & Warnings"
                            extra={
                                <Space>
                                    <Badge color={Analysis.errorCount ? ErrorColor : WarningColor} count={showResults.length} />
                                    <Dropdown menu={{ items: SortModeEnum, onClick: ({ key }) => setSortMode(key) }}>
                                        <Button className="sort-button">{`排序: ${SortModeEnum.find(item => item.key === sortMode).label}`}</Button>
                                    </Dropdown>
                                    <Tooltip title="复制所有有 error 的文件路径" placement="topRight">
                                        <Button icon={<CopyOutlined />} onClick={handleCopyErrorFiles} />
                                    </Tooltip>
                                    <Tooltip title="全部展开/折叠" placement="topRight">
                                        <Button icon={openAll ? <DownOutlined /> : <RightOutlined />} onClick={handleToggleAll} />
                                    </Tooltip>
                                </Space>
                            }
                            hoverable
                            styles={{ body: { padding: 0 } }}
                        >
                            <Table
                                rowKey="source"
                                columns={FileColumns}
                                dataSource={showResults}
                                pagination={false}
                                showHeader={false}
                                expandable={{
                                    columnWidth: 32,
                                    expandRowByClick: true,
                                    expandedRowKeys,
                                    onExpandedRowsChange: expandedRows => {
                                        setCollapsedMap(Object.fromEntries(showResults.map(item => [item.source, !expandedRows.includes(item.source)])));
                                    },
                                    expandedRowRender: item => (
                                        <Table
                                            rowKey={item2 => [item2.rule, item2.line, item2.column].join(':')}
                                            columns={getWarningColumns(item, handleShowCode)}
                                            dataSource={item.warnings.filter(item2 => selectedRules.includes(item2.rule))}
                                            showHeader={false}
                                            pagination={false}
                                        />
                                    )
                                }}
                            />
                        </Card>
                    )}

                    {CleanResults.length !== 0 && (
                        <Card title="No Bugs" extra={<Badge color={SuccessColor} count={CleanResults.length} />} hoverable styles={{ body: { padding: 0 } }}>
                            <List
                                rowKey="source"
                                dataSource={CleanResults}
                                renderItem={item => (
                                    <List.Item>
                                        <Text type="success" copyable>
                                            {item.source}
                                        </Text>
                                    </List.Item>
                                )}
                            />
                        </Card>
                    )}
                </Space>
            </div>
            <CodeModal data={codeModal} onClose={() => setCodeModal(prev => ({ ...prev, open: false }))} />
            {messageContextHolder}
        </ConfigProvider>
    );
};

ReactDOM.createRoot(document.querySelector('#root')).render(<App />);
