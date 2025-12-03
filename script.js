// API配置
const API_ENDPOINTS = {
    news60s: 'https://60s.viki.moe/v2/60s',
    douyin: 'https://60s.viki.moe/v2/douyin',
    bili: 'https://60s.viki.moe/v2/bili',
    weibo: 'https://60s.viki.moe/v2/weibo',
    rednote: 'https://60s.viki.moe/v2/rednote',
    tieba: 'https://60s.viki.moe/v2/baidu/tieba',
    toutiao: 'https://60s.viki.moe/v2/toutiao',
    zhihu: 'https://60s.viki.moe/v2/zhihu',
    hackernews: 'https://60s.viki.moe/v2/hacker-news/best',
    hackernews_top: 'https://60s.viki.moe/v2/hacker-news/top',
    hackernews_new: 'https://60s.viki.moe/v2/hacker-news/new'
};

// 本地JSON数据源配置 - 现在包含所有数据源
const LOCAL_DATA_SOURCES = {
    // RSS 数据源
    arstechnica: {
        url: './data/arstechnica.json',
        name: 'Ars Technica',
        description: '科技新闻和评测'
    },
    wasi: {
        url: './data/wasi.json',
        name: '瓦斯阅读',
        description: '微信热门文章聚合'
    },
    // API 数据源
    news60s: {
        url: './data/news60s.json',
        name: '60秒新闻',
        description: '每日新闻简讯'
    },
    douyin: {
        url: './data/douyin.json',
        name: '抖音热榜',
        description: '抖音热门话题'
    },
    bili: {
        url: './data/bili.json',
        name: 'B站热榜',
        description: '哔哩哔哩热门'
    },
    weibo: {
        url: './data/weibo.json',
        name: '微博热榜',
        description: '微博热搜榜'
    },
    rednote: {
        url: './data/rednote.json',
        name: '小红书热榜',
        description: '小红书热门'
    },
    tieba: {
        url: './data/tieba.json',
        name: '百度贴吧',
        description: '贴吧热帖'
    },
    toutiao: {
        url: './data/toutiao.json',
        name: '今日头条',
        description: '头条热榜'
    },
    zhihu: {
        url: './data/zhihu.json',
        name: '知乎热榜',
        description: '知乎热门问题'
    },
    hackernews: {
        url: './data/hackernews.json',
        name: 'Hacker News',
        description: '英文技术新闻最佳'
    },
    hackernews_top: {
        url: './data/hackernews_top.json',
        name: 'Hacker News Top',
        description: '英文技术新闻热门'
    },
    hackernews_new: {
        url: './data/hackernews_new.json',
        name: 'Hacker News New',
        description: '英文技术新闻最新'
    },
    newshares: {
        url: './data/newshares.json',
        name: '新股信息',
        description: '新股申购日历信息'
    },
    quark: {
        url: './data/quark.json',
        name: '夸克热榜',
        description: '夸克热门资讯'
    }
};

// 缓存和状态管理
const CACHE = {
    data: {},
    lastUpdate: null,
    CACHE_DURATION: 5 * 60 * 1000 // 5分钟缓存
};

// DOM元素
const elements = {
    loading: document.getElementById('loading'),
    currentDate: document.getElementById('currentDate'),
    hotLists: document.getElementById('hotLists'),
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    newsDate: document.getElementById('newsDate'),
    tipContainer: document.getElementById('tipContainer'),
    tipText: document.getElementById('tipText')
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    setupCurrentDate();
    setupEventListeners();
    await loadAllData();
}

// 设置当前日期
function setupCurrentDate() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
    elements.currentDate.textContent = dateStr;
}

// 将美国时间转换为中国时间并格式化
function formatUSDateToChinaTime(usDateStr) {
    if (!usDateStr) return '';

    try {
        // 解析UTC时间 (ISO格式)
        const utcDate = new Date(usDateStr);

        // 格式化为中国时间 (直接使用localeString会自动转换为本地时区)
        const timeStr = utcDate.toLocaleString('zh-CN', {
            timeZone: 'Asia/Shanghai',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        return timeStr;
    } catch (error) {
        console.error('时间转换错误:', error);
        return '';
    }
}

// 添加更新时间到标题
function addUpdateTimeToTitle(key, source) {
    if (!source || !source.lastUpdate) return;

    // 60秒新闻已经有时间显示，跳过
    if (key === 'news60s') return;

    const section = document.getElementById(key);
    if (!section) return;

    const titleElement = section.querySelector('h2');
    if (!titleElement) return;

    const timeStr = formatUSDateToChinaTime(source.lastUpdate);
    if (!timeStr) return;

    // 检查是否已经存在时间元素
    let timeElement = titleElement.querySelector('.update-time');
    if (timeElement) {
        timeElement.textContent = `📅 ${timeStr}`;
    } else {
        // 创建时间元素
        timeElement = document.createElement('span');
        timeElement.className = 'update-time';
        timeElement.textContent = `📅 ${timeStr}`;
        titleElement.appendChild(timeElement);
    }
}

// 设置事件监听器
function setupEventListeners() {
    elements.searchInput.addEventListener('input', debounce(handleSearch, 300));
    elements.clearSearchBtn.addEventListener('click', clearSearch);
}

// 加载所有数据
async function loadAllData() {
    const promises = [
        // 只加载本地JSON数据源（所有数据现在都通过JSON文件提供）
        ...Object.entries(LOCAL_DATA_SOURCES).map(([key, source]) =>
            fetchLocalData(key, source).catch(err => {
                console.error(`加载本地数据 ${key} 失败:`, err);
                showError(key, err.message);
            })
        )
    ];

    try {
        await Promise.all(promises);
        updateCacheTimestamp();
    } catch (error) {
        console.error('加载数据时出现错误:', error);
    }
}

// 获取数据
async function fetchData(key, url) {
    // 检查缓存
    if (isCacheValid(key)) {
        renderData(key, CACHE.data[key]);
        return;
    }

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            timeout: 10000
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.code !== 200) {
            throw new Error(data.message || 'API返回错误');
        }

        CACHE.data[key] = data;
        renderData(key, data);
    } catch (error) {
        console.error(`获取 ${key} 数据失败:`, error);
        throw error;
    }
}

// 获取本地JSON数据
async function fetchLocalData(key, source) {
    try {
        console.log(`🔄 开始加载本地数据: ${key}`);
        const response = await fetch(source.url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`📥 ${key} 原始数据:`, data);

        // 检查数据格式并转换为标准格式
        let standardData;

        if (data.items) {
            // RSS 数据格式：包含 items 数组
            standardData = {
                code: 200,
                message: '获取成功',
                data: data.items.map(item => ({
                    title: item.title,
                    link: item.link,
                    description: decodeHTML(item.description),
                    pubDate: item.pubDate
                }))
            };
            console.log(`✅ ${key} RSS 数据转换完成，条目数:`, standardData.data.length);
        } else if (data.data) {
            // API 数据格式：直接包含 data 字段
            standardData = {
                code: data.code || 200,
                message: data.message || '获取成功',
                data: data.data
            };
            console.log(`✅ ${key} API 数据处理完成，条目数:`, Array.isArray(standardData.data) ? standardData.data.length : 'N/A');
        } else {
            throw new Error('未知的数据格式');
        }

        CACHE.data[key] = standardData;

        // 添加更新时间到标题
        addUpdateTimeToTitle(key, data.source);

        // 根据数据源类型调用不同的渲染函数
        if (key === 'arstechnica' || key === 'wasi') {
            // RSS 数据源使用特殊的渲染函数
            console.log(`🎨 调用 RSS 渲染函数: ${key}`);
            renderLocalData(key, standardData, source);
        } else {
            // API 数据源使用标准渲染函数
            console.log(`🎨 调用标准渲染函数: ${key}`);
            renderData(key, standardData);
        }
    } catch (error) {
        console.error(`❌ 获取本地数据 ${key} 失败:`, error);
        throw error;
    }
}

// 检查缓存是否有效
function isCacheValid(key) {
    return CACHE.data[key] &&
        CACHE.lastUpdate &&
        (Date.now() - CACHE.lastUpdate < CACHE.CACHE_DURATION);
}

// 渲染数据
function renderData(key, data) {
    switch (key) {
        case 'news60s':
            render60sNews(data.data);
            break;
        case 'douyin':
            renderDouyin(data.data);
            break;
        case 'bili':
            renderBili(data.data);
            break;
        case 'weibo':
            renderWeibo(data.data);
            break;
        case 'rednote':
            renderRedNote(data.data);
            break;
        case 'tieba':
            renderTieba(data.data);
            break;
        case 'toutiao':
            renderToutiao(data.data);
            break;
        case 'zhihu':
            renderZhihu(data.data);
            break;
        case 'hackernews':
            renderHackerNews(data.data);
            break;
        case 'hackernews_top':
            renderHackerNewsTop(data.data);
            break;
        case 'hackernews_new':
            renderHackerNewsNew(data.data);
            break;
        case 'newshares':
            renderNewShares(data.data);
            break;
        case 'quark':
            renderQuark(data.data);
            break;
    }
}

// 渲染本地JSON数据
function renderLocalData(key, data, source) {
    console.log(`🎨 开始渲染 RSS 数据: ${key}`);
    const container = document.getElementById(key + 'List');

    if (!container) {
        console.error(`❌ 找不到容器元素: ${key}List`);
        return;
    }

    if (!Array.isArray(data.data)) {
        console.error(`❌ ${key} 数据格式错误，data.data 不是数组:`, data);
        showError(key, '数据格式错误');
        return;
    }

    const items = data.data;
    console.log(`📊 ${key} 准备渲染 ${items.length} 条数据`);

    const html = items.map((item, index) => {
        console.log(`📝 ${key} 第${index + 1}条: ${item.title}`);

        // 根据不同的数据源决定显示内容
        let extraContent = '';

        if (key === 'wasi') {
            // 瓦斯阅读：只显示标题，不显示详情和时间
            extraContent = '';
        } else if (key === 'arstechnica') {
            // Ars Technica：只显示标题，不显示时间
            extraContent = item.description ? `<div class="hot-desc">${item.description.substring(0, 100)}...</div>` : '';
        } else {
            // 其他RSS源：显示完整内容
            extraContent = `
                ${item.description ? `<div class="hot-desc">${item.description.substring(0, 100)}...</div>` : ''}
                ${item.pubDate ? `<div class="hot-date">${formatDate(item.pubDate)}</div>` : ''}
            `;
        }

        return `
        <div class="hot-item rss">
            <div class="hot-rank ${index < 5 ? 'top5' : ''}">${index + 1}</div>
            <div class="hot-content">
                <a href="${decodeHTML(item.url || item.link)}" target="_blank" class="hot-title">${item.title}</a>
                ${extraContent}
            </div>
        </div>
    `;
    }).join('');

    container.innerHTML = html;
    console.log(`✅ ${key} 渲染完成，容器内容长度:`, container.innerHTML.length);
}

// 渲染60秒新闻
function render60sNews(data) {
    const newsList = document.getElementById('newsList');

    if (!data || !data.news) {
        showError('news60s', '数据格式错误');
        return;
    }

    // 设置标题栏日期
    if (elements.newsDate) {
        elements.newsDate.textContent = `📅 ${data.date} | ${data.day_of_week}`;
    }

    // 设置每日一句tip
    if (elements.tipText && data.tip) {
        elements.tipText.textContent = data.tip;
    }

    // 显示所有新闻（包括第一条），统一样式，限制60个字符
    const allNews = data.news.slice(0, 15); // 显示前15条新闻
    newsList.innerHTML = `
        <ul>
            ${allNews.map((news, index) => {
        const shortNews = news.length > 60 ? news.substring(0, 60) + '...' : news;
        return `<li title="${news}">• ${shortNews}</li>`;
    }).join('')}
        </ul>
    `;
}

// 渲染抖音热榜
function renderDouyin(data) {
    const container = document.getElementById('douyinList');

    if (!Array.isArray(data)) {
        showError('douyin', '数据格式错误');
        return;
    }

    const items = data; // 显示全部数据
    container.innerHTML = items.map((item, index) => `
        <div class="hot-item simple">
            <div class="hot-rank ${index < 5 ? 'top5' : ''}">${index + 1}</div>
            <div class="hot-content">
                <a href="${decodeHTML(item.url || item.link)}" target="_blank" class="hot-title">${item.title}</a>
            </div>
        </div>
    `).join('');
}

// 渲染B站热榜
function renderBili(data) {
    const container = document.getElementById('biliList');

    if (!Array.isArray(data)) {
        showError('bili', '数据格式错误');
        return;
    }

    const items = data; // 显示全部数据
    container.innerHTML = items.map((item, index) => `
        <div class="hot-item simple">
            <div class="hot-rank ${index < 5 ? 'top5' : ''}">${index + 1}</div>
            <div class="hot-content">
                <a href="${decodeHTML(item.url || item.link)}" target="_blank" class="hot-title">${item.title}</a>
            </div>
        </div>
    `).join('');
}

// 渲染微博热榜
function renderWeibo(data) {
    const container = document.getElementById('weiboList');

    if (!Array.isArray(data)) {
        showError('weibo', '数据格式错误');
        return;
    }

    const items = data; // 显示全部数据
    container.innerHTML = items.map((item, index) => `
        <div class="hot-item simple">
            <div class="hot-rank ${index < 5 ? 'top5' : ''}">${index + 1}</div>
            <div class="hot-content">
                <a href="${decodeHTML(item.url || item.link)}" target="_blank" class="hot-title">${item.title}</a>
            </div>
        </div>
    `).join('');
}

// 渲染小红书热榜
function renderRedNote(data) {
    const container = document.getElementById('rednoteList');

    if (!Array.isArray(data)) {
        showError('rednote', '数据格式错误');
        return;
    }

    const items = data; // 显示全部数据
    container.innerHTML = items.map((item, index) => `
        <div class="hot-item simple">
            <div class="hot-rank ${index < 5 ? 'top5' : ''}">${index + 1}</div>
            <div class="hot-content">
                <a href="${decodeHTML(item.url || item.link)}" target="_blank" class="hot-title">${item.title}</a>
            </div>
        </div>
    `).join('');
}

// 渲染百度贴吧
function renderTieba(data) {
    const container = document.getElementById('tiebaList');

    if (!Array.isArray(data)) {
        showError('tieba', '数据格式错误');
        return;
    }

    const items = data; // 显示全部数据
    container.innerHTML = items.map((item, index) => `
        <div class="hot-item simple">
            <div class="hot-rank ${index < 5 ? 'top5' : ''}">${index + 1}</div>
            <div class="hot-content">
                <a href="${decodeHTML(item.url || item.link)}" target="_blank" class="hot-title">${item.title}</a>
            </div>
        </div>
    `).join('');
}

// 渲染今日头条
function renderToutiao(data) {
    const container = document.getElementById('toutiaoList');

    if (!Array.isArray(data)) {
        showError('toutiao', '数据格式错误');
        return;
    }

    const items = data; // 显示全部数据
    container.innerHTML = items.map((item, index) => `
        <div class="hot-item simple">
            <div class="hot-rank ${index < 5 ? 'top5' : ''}">${index + 1}</div>
            <div class="hot-content">
                <a href="${decodeHTML(item.url || item.link)}" target="_blank" class="hot-title">${item.title}</a>
            </div>
        </div>
    `).join('');
}

// 渲染知乎热榜
function renderZhihu(data) {
    const container = document.getElementById('zhihuList');

    if (!Array.isArray(data)) {
        showError('zhihu', '数据格式错误');
        return;
    }

    const items = data; // 显示全部数据
    container.innerHTML = items.map((item, index) => `
        <div class="hot-item simple">
            <div class="hot-rank ${index < 5 ? 'top5' : ''}">${index + 1}</div>
            <div class="hot-content">
                <a href="${decodeHTML(item.url || item.link)}" target="_blank" class="hot-title">${item.title}</a>
            </div>
        </div>
    `).join('');
}

// 渲染Hacker News
function renderHackerNews(data) {
    const container = document.getElementById('hackernewsList');

    if (!Array.isArray(data)) {
        showError('hackernews', '数据格式错误');
        return;
    }

    const items = data; // 显示全部数据
    container.innerHTML = items.map((item, index) => `
        <div class="hot-item simple">
            <div class="hot-rank ${index < 5 ? 'top5' : ''}">${index + 1}</div>
            <div class="hot-content">
                <a href="${decodeHTML(item.url || item.link)}" target="_blank" class="hot-title">${item.title}</a>
            </div>
        </div>
    `).join('');
}

// 渲染Hacker News Top Stories
function renderHackerNewsTop(data) {
    const container = document.getElementById('hackernewsTopList');

    if (!Array.isArray(data)) {
        showError('hackernews_top', '数据格式错误');
        return;
    }

    const items = data; // 显示全部数据
    container.innerHTML = items.map((item, index) => `
        <div class="hot-item simple">
            <div class="hot-rank ${index < 5 ? 'top5' : ''}">${index + 1}</div>
            <div class="hot-content">
                <a href="${decodeHTML(item.url || item.link)}" target="_blank" class="hot-title">${item.title}</a>
            </div>
        </div>
    `).join('');
}

// 渲染Hacker News New Stories
function renderHackerNewsNew(data) {
    const container = document.getElementById('hackernewsNewList');

    if (!Array.isArray(data)) {
        showError('hackernews_new', '数据格式错误');
        return;
    }

    const items = data; // 显示全部数据
    container.innerHTML = items.map((item, index) => `
        <div class="hot-item simple">
            <div class="hot-rank ${index < 5 ? 'top5' : ''}">${index + 1}</div>
            <div class="hot-content">
                <a href="${decodeHTML(item.url || item.link)}" target="_blank" class="hot-title">${item.title}</a>
            </div>
        </div>
    `).join('');
}

// 渲染新股信息
function renderNewShares(data) {
    const container = document.getElementById('newsharesList');

    if (!Array.isArray(data)) {
        showError('newshares', '数据格式错误');
        return;
    }

    if (data.length === 0) {
        container.innerHTML = '<div class="no-data">暂无新股申购信息</div>';
        return;
    }

    const items = data;
    container.innerHTML = items.map((item, index) => {
        const dateInfo = formatPurchaseDate(item.sgrq);
        return `
        <div class="hot-item newshare">
            <div class="hot-rank ${index < 5 ? 'top5' : ''}">${index + 1}</div>
            <div class="hot-content">
                <div class="newshare-header">
                    <span class="stock-code">${item.zqdm || '--'}</span>
                    <span class="stock-name">${item.zqjc || '--'}</span>
                    <span class="stock-type">${getStockType(item.zqdm)}</span>
                </div>
                <div class="newshare-info">
                    <div class="purchase-row">
                        <div class="purchase-code">
                            <span class="label">申购代码:</span>
                            <span class="value">${item.sgdm || '--'}</span>
                        </div>
                        <div class="purchase-date">
                            <span class="label">申购日期:</span>
                            <span class="value purchase-date-${dateInfo.type}">${dateInfo.text}</span>
                        </div>
                    </div>
                    <div class="info-row">
                        <span class="label">主营业务:</span>
                        <span class="value business" title="${item.zyyw || '--'}">${truncateText(item.zyyw, 40)}</span>
                    </div>
                </div>
            </div>
        </div>
    `}).join('');
}

// 渲染夸克热榜
function renderQuark(data) {
    const container = document.getElementById('quarkList');

    if (!Array.isArray(data)) {
        showError('quark', '数据格式错误');
        return;
    }

    const items = data; // 显示全部数据
    container.innerHTML = items.map((item, index) => `
        <div class="hot-item simple">
            <div class="hot-rank ${index < 5 ? 'top5' : ''}">${index + 1}</div>
            <div class="hot-content">
                <a href="${decodeHTML(item.url || item.link)}" target="_blank" class="hot-title">${item.title}</a>
            </div>
        </div>
    `).join('');
}

// 显示错误信息
function showError(section, message) {
    const container = document.getElementById(section + 'List');

    if (container) {
        container.innerHTML = `
            <div class="error-message">
                ❌ 加载失败: ${message}
            </div>
        `;
    }
}

// 格式化热度值
function formatHotValue(value) {
    if (!value) return '';

    if (value >= 10000000) {
        return (value / 10000000).toFixed(1) + '千万';
    } else if (value >= 10000) {
        return (value / 10000).toFixed(1) + '万';
    }
    return value.toString();
}

// 格式化时间
function formatTime(timeStr) {
    if (!timeStr) return '';

    try {
        const date = new Date(timeStr);
        const now = new Date();
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        // 处理未来日期
        if (diffMs < 0) {
            const futureDiffMs = date - now;
            const futureDiffHours = Math.floor(futureDiffMs / (1000 * 60 * 60));
            const futureDiffDays = Math.floor(futureDiffMs / (1000 * 60 * 60 * 24));

            if (futureDiffDays > 0) {
                return `${futureDiffDays}天后`;
            } else if (futureDiffHours > 0) {
                return `${futureDiffHours}小时后`;
            } else {
                const futureDiffMinutes = Math.floor(futureDiffMs / (1000 * 60));
                return `${futureDiffMinutes}分钟后`;
            }
        }

        if (diffHours < 1) {
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            return diffMinutes + '分钟前';
        } else if (diffHours < 24) {
            return diffHours + '小时前';
        } else {
            return date.toLocaleDateString('zh-CN');
        }
    } catch (error) {
        return timeStr;
    }
}

// HTML 解码函数
function decodeHTML(html) {
    if (!html) return '';

    const text = document.createElement('textarea');
    text.innerHTML = html;
    return text.value;
}
function getStockType(stockCode) {
    if (!stockCode || typeof stockCode !== 'string') {
        return '未知代码';
    }

    // 清理代码中的空格和非数字字符，只保留数字
    const code = stockCode.replace(/\s+/g, '').replace(/[^\d]/g, '');

    if (code.length !== 6) {
        return '代码格式错误';
    }

    // 根据代码前缀判断股票类型（基于最新规则）

    // 上海证券交易所
    if (['600', '601', '603', '605'].some(prefix => code.startsWith(prefix))) {
        return '上交所A股主板';
    }
    if (code.startsWith('688')) {
        return '科创板';
    }
    if (code.startsWith('900')) {
        return '上交所B股';
    }

    // 深圳证券交易所
    if (code.startsWith('000')) {
        return '深交所A股主板';
    }
    if (code.startsWith('300')) {
        return '创业板';
    }
    if (code.startsWith('200')) {
        return '深交所B股';
    }

    // 北京证券交易所（最新规则：920开头）
    if (code.startsWith('920')) {
        return '北交所';
    }

    // 原中小板（已合并到深交所主板）
    if (code.startsWith('002')) {
        return '深交所A股主板（原中小板）';
    }

    // 基金、债券等其他品种
    if (['1', '5'].some(prefix => code.startsWith(prefix))) {
        return '基金/债券/其他';
    }

    return '未知类型';
}

/**
 * 获取详细的股票市场信息
 * @param {string} stockCode - 股票代码
 * @returns {object} 股票详细信息
 */
function getStockDetail(stockCode) {
    const type = getStockType(stockCode);

    const marketInfo = {
        '上交所A股': { exchange: '上海证券交易所', market: '主板', board: '主板' },
        '深交所A股': { exchange: '深圳证券交易所', market: '主板', board: '主板' },
        '深交所A股（原中小板）': { exchange: '深圳证券交易所', market: '主板', board: '原中小板' },
        '科创板': { exchange: '上海证券交易所', market: '科创板', board: '科创板' },
        '创业板': { exchange: '深圳证券交易所', market: '创业板', board: '创业板' },
        '北交所': { exchange: '北京证券交易所', market: '北交所', board: '北交所' },
        'B股': { exchange: '沪深交易所', market: 'B股市场', board: 'B股' },
        '基金/债券/其他': { exchange: '沪深交易所', market: '基金债券', board: '其他' }
    };

    return {
        code: stockCode,
        type: type,
        exchange: marketInfo[type]?.exchange || '未知交易所',
        market: marketInfo[type]?.market || '未知市场',
        board: marketInfo[type]?.board || '未知板块'
    };
}

// 截断文本并添加省略号
function truncateText(text, maxLength = 40) {
    if (!text) return '--';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// 格式化新股申购日期
function formatPurchaseDate(dateStr) {
    if (!dateStr) return { text: '', type: 'unknown' };

    try {
        const date = new Date(dateStr);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const purchaseDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        // 计算日期差异（忽略时分秒）
        const diffDays = Math.floor((purchaseDate - today) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return { text: '今日申购', type: 'today' };
        } else if (diffDays === 1) {
            return { text: '明日申购', type: 'tomorrow' };
        } else if (diffDays === -1) {
            return { text: '昨日申购', type: 'past' };
        } else if (diffDays > 0 && diffDays <= 3) {
            return { text: `${diffDays}天后申购`, type: 'upcoming' };
        } else if (diffDays > 3) {
            return { text: `${diffDays}天后申购`, type: 'future' };
        } else if (diffDays < 0) {
            return { text: '已结束申购', type: 'past' };
        } else {
            // 其他情况显示具体日期
            const formattedDate = date.toLocaleDateString('zh-CN', {
                month: 'short',
                day: 'numeric'
            });
            return { text: formattedDate, type: 'default' };
        }
    } catch (error) {
        return { text: dateStr, type: 'error' };
    }
}

// 格式化RSS日期
function formatDate(dateStr) {
    if (!dateStr) return '';

    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        // 处理未来日期（如新股申购日期）
        if (diffMs < 0) {
            // 未来日期直接显示完整日期
            return date.toLocaleDateString('zh-CN');
        }

        if (diffHours < 24) {
            return formatTime(dateStr);
        } else {
            return date.toLocaleDateString('zh-CN', {
                month: 'short',
                day: 'numeric'
            });
        }
    } catch (error) {
        return dateStr;
    }
}

// 更新缓存时间戳
function updateCacheTimestamp() {
    CACHE.lastUpdate = new Date().getTime();
}

// 搜索功能
function handleSearch(event) {
    const searchTerm = event.target.value.trim().toLowerCase();

    if (searchTerm === '') {
        clearSearch();
        return;
    }

    elements.clearSearchBtn.style.display = 'inline-block';

    let totalResults = 0;

    // 搜索所有热榜区域（现在只包含本地数据源）
    const allDataSources = Object.keys(LOCAL_DATA_SOURCES);

    allDataSources.forEach(key => {
        const section = document.getElementById(key);
        if (!section) return;

        const items = section.querySelectorAll('.hot-item');
        let sectionHasResults = false;

        items.forEach(item => {
            const title = item.querySelector('.hot-title');
            const titleText = title ? title.textContent.toLowerCase() : '';

            // 对于 RSS 项目，也搜索描述内容
            const desc = item.querySelector('.hot-desc');
            const descText = desc ? desc.textContent.toLowerCase() : '';

            const searchText = titleText + ' ' + descText;

            if (searchText.includes(searchTerm)) {
                item.classList.remove('search-hidden');
                sectionHasResults = true;
                totalResults++;

                // 高亮搜索词
                if (title) {
                    const originalText = title.textContent;
                    const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
                    title.innerHTML = originalText.replace(regex, '<span class="search-highlight">$1</span>');
                }
                if (desc) {
                    const originalDesc = desc.textContent;
                    const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
                    desc.innerHTML = originalDesc.replace(regex, '<span class="search-highlight">$1</span>');
                }
            } else {
                item.classList.add('search-hidden');
                // 移除高亮
                if (title) {
                    title.innerHTML = title.textContent;
                }
                if (desc) {
                    desc.innerHTML = desc.textContent;
                }
            }
        });

        // 显示/隐藏整个区域
        if (sectionHasResults) {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
        }
    });

    // 显示搜索结果统计
    showSearchResults(totalResults, searchTerm);
}

// 清除搜索
function clearSearch() {
    elements.searchInput.value = '';
    elements.clearSearchBtn.style.display = 'none';

    // 显示所有隐藏的项目
    document.querySelectorAll('.search-hidden').forEach(item => {
        item.classList.remove('search-hidden');
    });

    // 移除所有高亮
    document.querySelectorAll('.search-highlight').forEach(highlight => {
        const parent = highlight.parentNode;
        parent.textContent = parent.textContent;
    });

    // 显示所有区域
    document.querySelectorAll('.hot-section').forEach(section => {
        section.style.display = 'block';
    });

    // 隐藏搜索结果提示
    hideSearchResults();
}

// 显示搜索结果统计
function showSearchResults(count, term) {
    hideSearchResults();

    if (count === 0) {
        const noResultsMsg = document.createElement('div');
        noResultsMsg.id = 'searchResults';
        noResultsMsg.className = 'no-results';
        noResultsMsg.textContent = `未找到包含 "${term}" 的内容`;
        elements.hotLists.appendChild(noResultsMsg);
    } else {
        const resultsMsg = document.createElement('div');
        resultsMsg.id = 'searchResults';
        resultsMsg.className = 'search-results-info';
        resultsMsg.textContent = `找到 ${count} 条包含 "${term}" 的内容`;
        resultsMsg.style.cssText = 'text-align: center; color: #666; font-size: 12px; margin-bottom: 10px; background: #e9ecef; padding: 5px; border-radius: 10px;';
        elements.hotLists.appendChild(resultsMsg);
    }
}

// 隐藏搜索结果统计
function hideSearchResults() {
    const resultsMsg = document.getElementById('searchResults');
    if (resultsMsg) {
        resultsMsg.remove();
    }
}

// 转义正则表达式特殊字符
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 工具函数：防抖
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 错误处理
window.addEventListener('unhandledrejection', event => {
    console.error('未处理的Promise拒绝:', event.reason);
});

window.addEventListener('error', event => {
    console.error('JavaScript错误:', event.error);
});