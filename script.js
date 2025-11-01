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

// 本地JSON数据源配置
const LOCAL_DATA_SOURCES = {
    arstechnica: {
        url: './data/arstechnica.json',
        name: 'Ars Technica',
        description: '科技新闻和评测'
    }
    // 以后可以添加更多本地数据源
};

// 缓存和状态管理
const CACHE = {
    data: {},
    lastUpdate: null,
    CACHE_DURATION: 5 * 60 * 1000 // 5分钟缓存
};

// DOM元素
const elements = {
    refreshBtn: document.getElementById('refreshBtn'),
    loading: document.getElementById('loading'),
    updateTime: document.getElementById('updateTime'),
    currentDate: document.getElementById('currentDate'),
    hotLists: document.getElementById('hotLists'),
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn')
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

// 设置事件监听器
function setupEventListeners() {
    elements.refreshBtn.addEventListener('click', handleRefresh);
    elements.searchInput.addEventListener('input', debounce(handleSearch, 300));
    elements.clearSearchBtn.addEventListener('click', clearSearch);

    // 自动刷新（每5分钟）
    setInterval(async () => {
        await loadAllData();
    }, 5 * 60 * 1000);
}

// 处理刷新按钮点击
async function handleRefresh() {
    showLoading(true);
    CACHE.data = {}; // 清空缓存
    await loadAllData();
    showLoading(false);
}

// 显示/隐藏加载状态
function showLoading(show) {
    elements.loading.style.display = show ? 'inline-block' : 'none';
    elements.refreshBtn.disabled = show;
    if (show) {
        elements.refreshBtn.textContent = '🔄 刷新中...';
    } else {
        elements.refreshBtn.textContent = '🔄 刷新数据';
    }
}

// 加载所有数据
async function loadAllData() {
    const promises = [
        // 加载API数据源
        ...Object.entries(API_ENDPOINTS).map(([key, url]) =>
            fetchData(key, url).catch(err => {
                console.error(`加载 ${key} 数据失败:`, err);
                showError(key, err.message);
            })
        ),
        // 加载本地JSON数据源
        ...Object.entries(LOCAL_DATA_SOURCES).map(([key, source]) =>
            fetchLocalData(key, source).catch(err => {
                console.error(`加载本地数据 ${key} 失败:`, err);
                showError(key, err.message);
            })
        )
    ];

    try {
        await Promise.all(promises);
        updateLastUpdateTime();
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
        const response = await fetch(source.url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // 将本地数据转换为标准格式
        const standardData = {
            code: 200,
            message: '获取成功',
            data: data.items.map(item => ({
                title: item.title,
                link: item.link,
                description: item.description,
                pubDate: item.pubDate
            }))
        };

        CACHE.data[key] = standardData;
        renderLocalData(key, standardData, source);
    } catch (error) {
        console.error(`获取本地数据 ${key} 失败:`, error);
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
    }
}

// 渲染本地JSON数据
function renderLocalData(key, data, source) {
    const container = document.getElementById(key + 'List');

    if (!Array.isArray(data.data)) {
        showError(key, '数据格式错误');
        return;
    }

    const items = data.data;
    container.innerHTML = items.map((item, index) => `
        <div class="hot-item rss">
            <div class="hot-rank ${index < 3 ? 'top3' : ''}">${index + 1}</div>
            <div class="hot-content">
                <a href="${item.link}" target="_blank" class="hot-title">${item.title}</a>
                ${item.description ? `<div class="hot-desc">${item.description.substring(0, 100)}...</div>` : ''}
                ${item.pubDate ? `<div class="hot-date">${formatDate(item.pubDate)}</div>` : ''}
            </div>
        </div>
    `).join('');
}

// 渲染60秒新闻
function render60sNews(data) {
    const newsMain = document.getElementById('newsMain');
    const newsList = document.getElementById('newsList');

    if (!data || !data.news) {
        showError('news60s', '数据格式错误');
        return;
    }

    // 主要新闻 - 截取前50个字符
    const mainNews = data.news[0];
    const shortMainNews = mainNews.length > 50 ? mainNews.substring(0, 50) + '...' : mainNews;
    newsMain.innerHTML = `
        <h3 title="${mainNews}">${shortMainNews}</h3>
        <div class="news-meta">
            📅 ${data.date} | ${data.day_of_week}
        </div>
    `;

    // 新闻列表 - 每条新闻限制长度
    const otherNews = data.news.slice(1, 15); // 显示前14条其他新闻
    newsList.innerHTML = `
        <ul>
            ${otherNews.map(news => {
                const shortNews = news.length > 40 ? news.substring(0, 40) + '...' : news;
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
            <div class="hot-rank ${index < 3 ? 'top3' : ''}">${index + 1}</div>
            <div class="hot-content">
                <a href="${item.link}" target="_blank" class="hot-title">${item.title}</a>
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
            <div class="hot-rank ${index < 3 ? 'top3' : ''}">${index + 1}</div>
            <div class="hot-content">
                <a href="${item.link}" target="_blank" class="hot-title">${item.title}</a>
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
            <div class="hot-rank ${index < 3 ? 'top3' : ''}">${index + 1}</div>
            <div class="hot-content">
                <a href="${item.link}" target="_blank" class="hot-title">${item.title}</a>
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
            <div class="hot-rank ${index < 3 ? 'top3' : ''}">${index + 1}</div>
            <div class="hot-content">
                <a href="${item.link}" target="_blank" class="hot-title">${item.title}</a>
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
            <div class="hot-rank ${index < 3 ? 'top3' : ''}">${index + 1}</div>
            <div class="hot-content">
                <a href="${item.link}" target="_blank" class="hot-title">${item.title}</a>
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
            <div class="hot-rank ${index < 3 ? 'top3' : ''}">${index + 1}</div>
            <div class="hot-content">
                <a href="${item.link}" target="_blank" class="hot-title">${item.title}</a>
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
            <div class="hot-rank ${index < 3 ? 'top3' : ''}">${index + 1}</div>
            <div class="hot-content">
                <a href="${item.link}" target="_blank" class="hot-title">${item.title}</a>
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
            <div class="hot-rank ${index < 3 ? 'top3' : ''}">${index + 1}</div>
            <div class="hot-content">
                <a href="${item.link}" target="_blank" class="hot-title">${item.title}</a>
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
            <div class="hot-rank ${index < 3 ? 'top3' : ''}">${index + 1}</div>
            <div class="hot-content">
                <a href="${item.link}" target="_blank" class="hot-title">${item.title}</a>
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
            <div class="hot-rank ${index < 3 ? 'top3' : ''}">${index + 1}</div>
            <div class="hot-content">
                <a href="${item.link}" target="_blank" class="hot-title">${item.title}</a>
            </div>
        </div>
    `).join('');
}

// 显示错误信息
function showError(section, message) {
    const container = document.getElementById(section + 'List') ||
                     document.getElementById(section === 'news60s' ? 'newsMain' : section);

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

// 格式化RSS日期
function formatDate(dateStr) {
    if (!dateStr) return '';

    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

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

// 更新最后更新时间
function updateLastUpdateTime() {
    const now = new Date();
    elements.updateTime.textContent = now.toLocaleString('zh-CN');
    CACHE.lastUpdate = now.getTime();
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

    // 搜索所有热榜区域
    Object.keys(API_ENDPOINTS).forEach(key => {
        const section = document.getElementById(key);
        if (!section) return;

        const items = section.querySelectorAll('.hot-item');
        let sectionHasResults = false;

        items.forEach(item => {
            const title = item.querySelector('.hot-title');
            const titleText = title ? title.textContent.toLowerCase() : '';

            if (titleText.includes(searchTerm)) {
                item.classList.remove('search-hidden');
                sectionHasResults = true;
                totalResults++;

                // 高亮搜索词
                if (title) {
                    const originalText = title.textContent;
                    const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
                    title.innerHTML = originalText.replace(regex, '<span class="search-highlight">$1</span>');
                }
            } else {
                item.classList.add('search-hidden');
                // 移除高亮
                if (title) {
                    title.innerHTML = title.textContent;
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