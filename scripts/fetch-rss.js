const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// RSS 源配置
const RSS_SOURCES = [
    {
        url: 'https://arstechnica.com/feed/',
        filename: 'arstechnica.json',
        name: 'Ars Technica',
        description: '科技新闻和评测'
    },
    {
        url: 'https://rss.aishort.top/?type=wasi',
        filename: 'wasi.json',
        name: '瓦斯阅读',
        description: '微信热门文章聚合'
    }
];

// API 数据源配置
const API_SOURCES = [
    {
        url: 'https://60s.viki.moe/v2/60s',
        filename: 'news60s.json',
        name: '60秒新闻',
        description: '每日新闻简讯'
    },
    {
        url: 'https://60s.viki.moe/v2/douyin',
        filename: 'douyin.json',
        name: '抖音热榜',
        description: '抖音热门话题'
    },
    {
        url: 'https://60s.viki.moe/v2/bili',
        filename: 'bili.json',
        name: 'B站热榜',
        description: '哔哩哔哩热门'
    },
    {
        url: 'https://60s.viki.moe/v2/weibo',
        filename: 'weibo.json',
        name: '微博热榜',
        description: '微博热搜榜'
    },
    {
        url: 'https://60s.viki.moe/v2/rednote',
        filename: 'rednote.json',
        name: '小红书热榜',
        description: '小红书热门'
    },
    {
        url: 'https://60s.viki.moe/v2/baidu/tieba',
        filename: 'tieba.json',
        name: '百度贴吧',
        description: '贴吧热帖'
    },
    {
        url: 'https://60s.viki.moe/v2/toutiao',
        filename: 'toutiao.json',
        name: '今日头条',
        description: '头条热榜'
    },
    {
        url: 'https://60s.viki.moe/v2/zhihu',
        filename: 'zhihu.json',
        name: '知乎热榜',
        description: '知乎热门问题'
    },
    {
        url: 'https://60s.viki.moe/v2/hacker-news/best',
        filename: 'hackernews.json',
        name: 'Hacker News',
        description: '英文技术新闻最佳'
    },
    {
        url: 'https://60s.viki.moe/v2/hacker-news/top',
        filename: 'hackernews_top.json',
        name: 'Hacker News Top',
        description: '英文技术新闻热门'
    },
    {
        url: 'https://60s.viki.moe/v2/hacker-news/new',
        filename: 'hackernews_new.json',
        name: 'Hacker News New',
        description: '英文技术新闻最新'
    },
    {
        url: 'https://api.biyingapi.com/hslt/new/biyinglicence',
        filename: 'newshares.json',
        name: '新股信息',
        description: '新股申购日历信息'
    }
];

// 所有数据源
const ALL_SOURCES = [
    ...RSS_SOURCES,
    ...API_SOURCES
];

// 确保 data 目录存在
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// RSS 解析器（使用 Node.js 内置模块）
function fetchRSS(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; RSS-Fetcher/1.0)'
            }
        };

        protocol.get(url, options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const items = parseRSS(data);
                    resolve(items);
                } catch (error) {
                    console.error(`解析 RSS 失败 ${url}:`, error.message);
                    resolve([]);
                }
            });
        }).on('error', (error) => {
            console.error(`获取 RSS 失败 ${url}:`, error.message);
            resolve([]);
        });
    });
}

// API 数据抓取
function fetchAPI(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; RSS-Fetcher/1.0)'
            }
        };

        protocol.get(url, options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (error) {
                    console.error(`解析 API 失败 ${url}:`, error.message);
                    resolve(null);
                }
            });
        }).on('error', (error) => {
            console.error(`获取 API 失败 ${url}:`, error.message);
            resolve(null);
        });
    });
}

// 新股信息过滤函数（提前一周和往后一周的申购日期）
function filterNewSharesByDate(data) {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return data.filter(item => {
        if (!item.sgrq) return false; // 没有申购日期的过滤掉

        const purchaseDate = new Date(item.sgrq);

        // 检查申购日期是否在提前一周到往后一周的范围内
        return purchaseDate >= oneWeekAgo && purchaseDate <= oneWeekLater;
    }).sort((a, b) => {
        // 按申购日期排序（最近的在前）
        return new Date(b.sgrq) - new Date(a.sgrq);
    });
}

// 简单的 RSS XML 解析
function parseRSS(xmlText) {
    const items = [];

    // 使用正则表达式解析 RSS XML
    const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/g);

    if (!itemMatches) return items;

    itemMatches.forEach(itemText => {
        const titleMatch = itemText.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
                          itemText.match(/<title>(.*?)<\/title>/);
        const linkMatch = itemText.match(/<link>(.*?)<\/link>/);
        const descMatch = itemText.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ||
                         itemText.match(/<description>(.*?)<\/description>/);
        const pubDateMatch = itemText.match(/<pubDate>(.*?)<\/pubDate>/);

        if (titleMatch && linkMatch) {
            const title = titleMatch[1].replace(/<[^>]*>/g, '').trim();
            const link = linkMatch[1].trim();
            const description = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim().substring(0, 200) : '';
            const pubDate = pubDateMatch ? pubDateMatch[1] : '';

            if (title && link) {
                items.push({
                    title,
                    link,
                    description,
                    pubDate,
                    timestamp: new Date(pubDate).getTime() || Date.now()
                });
            }
        }
    });

    // 按时间排序（最新的在前）
    items.sort((a, b) => b.timestamp - a.timestamp);

    // 只保留前20条
    return items.slice(0, 20);
}

// 主函数
async function main() {
    console.log('🔄 开始抓取所有数据源...');

    // 抓取 RSS 源
    console.log('📡 开始抓取 RSS 源...');
    for (const source of RSS_SOURCES) {
        console.log(`📡 正在抓取 RSS: ${source.name}`);

        try {
            const items = await fetchRSS(source.url);

            if (items && items.length > 0) {
                const jsonData = {
                    source: {
                        name: source.name,
                        description: source.description,
                        url: source.url,
                        lastUpdate: new Date().toISOString()
                    },
                    items: items,
                    total: items.length
                };

                const filePath = path.join(dataDir, source.filename);
                fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf8');

                console.log(`✅ 成功抓取 ${source.name}: ${items.length} 条数据`);
            } else {
                console.log(`❌ ${source.name} 抓取失败或无数据`);
            }
        } catch (error) {
            console.error(`❌ ${source.name} 处理失败:`, error.message);
        }
    }

    // 抓取 API 源
    console.log('🌐 开始抓取 API 源...');
    for (const source of API_SOURCES) {
        console.log(`📡 正在抓取 API: ${source.name}`);

        try {
            const data = await fetchAPI(source.url);

            // 新股信息特殊处理
            if (source.name === '新股信息') {
                if (Array.isArray(data) && data.length > 0) {
                    // 过滤当前时间提前一周和往后一周的申购日期数据
                    const filteredData = filterNewSharesByDate(data);

                    const jsonData = {
                        source: {
                            name: source.name,
                            description: source.description,
                            url: source.url,
                            lastUpdate: new Date().toISOString()
                        },
                        data: filteredData,
                        total: filteredData.length
                    };

                    const filePath = path.join(dataDir, source.filename);
                    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf8');

                    console.log(`✅ 成功抓取 ${source.name}: ${filteredData.length} 条数据（过滤后）`);
                } else {
                    console.log(`❌ ${source.name} 抓取失败或无数据`);
                }
            } else {
                // 其他API源的正常处理
                if (data && data.code === 200) {
                    const jsonData = {
                        source: {
                            name: source.name,
                            description: source.description,
                            url: source.url,
                            lastUpdate: new Date().toISOString()
                        },
                        data: data.data,
                        code: data.code,
                        message: data.message
                    };

                    const filePath = path.join(dataDir, source.filename);
                    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf8');

                    console.log(`✅ 成功抓取 ${source.name}: ${Array.isArray(data.data) ? data.data.length : 'N/A'} 条数据`);
                } else {
                    console.log(`❌ ${source.name} 抓取失败或无数据`);
                }
            }
        } catch (error) {
            console.error(`❌ ${source.name} 处理失败:`, error.message);
        }
    }

    console.log('🎉 所有数据源抓取完成!');
}

// 运行主函数
main().catch(console.error);