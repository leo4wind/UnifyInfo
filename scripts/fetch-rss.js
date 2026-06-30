const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const zlib = require('zlib');

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
    },
    {
        url: 'https://news.google.com/rss/search?q=site:reuters.com&hl=en-US&gl=US&ceid=US:en',
        fallbackUrls: [
            'https://feeds.feedburner.com/reuters/businessNews'
        ],
        filename: 'reuters.json',
        name: 'Reuters',
        description: '路透社新闻',
        requireItems: true
    },
    {
        url: 'https://feeds.bloomberg.com/markets/news.rss',
        fallbackUrls: [
            'https://news.google.com/rss/search?q=site:bloomberg.com&hl=en-US&gl=US&ceid=US:en'
        ],
        filename: 'bloomberg.json',
        name: 'Bloomberg',
        description: '彭博社新闻',
        requireItems: true
    },
    {
        url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml',
        fallbackUrls: [
            'https://feeds.a.dj.com/rss/RSSWorldNews.xml',
            'https://news.google.com/rss/search?q=site:wsj.com&hl=en-US&gl=US&ceid=US:en'
        ],
        filename: 'wsj.json',
        name: 'Wall Street Journal',
        description: '华尔街日报新闻',
        requireItems: true
    },
    {
        url: 'https://www.ft.com/rss/home',
        fallbackUrls: [
            'https://www.ft.com/?format=rss',
            'https://news.google.com/rss/search?q=site:ft.com&hl=en-US&gl=US&ceid=US:en'
        ],
        filename: 'ft.json',
        name: 'Financial Times',
        description: '金融时报新闻',
        requireItems: true
    },
    {
        url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
        fallbackUrls: [
            'https://news.google.com/rss/search?q=site:cnbc.com&hl=en-US&gl=US&ceid=US:en'
        ],
        filename: 'cnbc.json',
        name: 'CNBC',
        description: 'CNBC 财经新闻',
        requireItems: true
    },
    {
        url: 'https://www.scmp.com/rss/92/feed',
        fallbackUrls: [
            'https://www.scmp.com/rss/2/feed',
            'https://news.google.com/rss/search?q=site:scmp.com&hl=en-US&gl=US&ceid=US:en'
        ],
        filename: 'scmp.json',
        name: 'South China Morning Post',
        description: '南华早报新闻',
        requireItems: true
    },
    {
        url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories',
        fallbackUrls: [
            'https://news.google.com/rss/search?q=site:marketwatch.com&hl=en-US&gl=US&ceid=US:en'
        ],
        filename: 'marketwatch.json',
        name: 'MarketWatch',
        description: 'MarketWatch 财经新闻',
        requireItems: true
    },
    {
        url: 'https://finance.yahoo.com/news/rssindex',
        fallbackUrls: [
            'https://news.google.com/rss/search?q=site:finance.yahoo.com&hl=en-US&gl=US&ceid=US:en'
        ],
        filename: 'yahoofinance.json',
        name: 'Yahoo Finance',
        description: '雅虎财经新闻',
        requireItems: true
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
    },
    {
        url: 'https://60s.viki.moe/v2/quark',
        filename: 'quark.json',
        name: '夸克热榜',
        description: '夸克热门资讯'
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

const REQUEST_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Connection': 'close'
};

function decodeResponseBody(buffer, encoding) {
    if (encoding === 'gzip') return zlib.gunzipSync(buffer);
    if (encoding === 'deflate') return zlib.inflateSync(buffer);
    if (encoding === 'br') return zlib.brotliDecompressSync(buffer);
    return buffer;
}

function fetchText(url, redirectCount = 0) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const requestUrl = new URL(url);

        const options = {
            protocol: requestUrl.protocol,
            hostname: requestUrl.hostname,
            port: requestUrl.port,
            path: `${requestUrl.pathname}${requestUrl.search}`,
            headers: REQUEST_HEADERS,
            family: 4
        };

        const req = protocol.get(options, (res) => {
            if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
                const location = res.headers.location;
                res.resume();

                if (!location) {
                    reject(new Error(`HTTP ${res.statusCode} without Location`));
                    return;
                }

                if (redirectCount >= 5) {
                    reject(new Error(`Too many redirects for ${url}`));
                    return;
                }

                const redirectedUrl = new URL(location, url).toString();
                fetchText(redirectedUrl, redirectCount + 1).then(resolve).catch(reject);
                return;
            }

            const chunks = [];

            res.on('data', (chunk) => {
                chunks.push(chunk);
            });

            res.on('end', () => {
                const rawBody = Buffer.concat(chunks);
                let bodyBuffer;

                try {
                    bodyBuffer = decodeResponseBody(rawBody, res.headers['content-encoding']);
                } catch (error) {
                    reject(new Error(`解压响应失败: ${error.message}`));
                    return;
                }

                const body = bodyBuffer.toString('utf8');

                if (res.statusCode < 200 || res.statusCode >= 300) {
                    reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 120).replace(/\s+/g, ' ')}`));
                    return;
                }

                resolve(body);
            });
        }).on('error', (error) => {
            reject(error);
        });

        req.setTimeout(30000, () => {
            req.destroy(new Error(`请求超时 ${url}`));
        });
    });
}

// RSS 解析器（使用 Node.js 内置模块）
async function fetchRSS(source) {
    const urls = [source.url, ...(source.fallbackUrls || [])];
    let lastError = null;

    for (const url of urls) {
        try {
            const data = await fetchText(url);
            const items = parseRSS(data);

            if (items.length > 0) {
                if (url !== source.url) {
                    console.log(`↪️ ${source.name} 使用备用源: ${url}`);
                }
                return { items, url };
            }

            lastError = new Error(`RSS 中未解析到 item: ${data.slice(0, 120).replace(/\s+/g, ' ')}`);
            console.error(`⚠️ ${source.name} RSS 无有效条目 ${url}: ${lastError.message}`);
        } catch (error) {
            lastError = error;
            console.error(`⚠️ ${source.name} RSS 抓取失败 ${url}: ${error.message}`);
        }
    }

    return { items: [], url: source.url, error: lastError };
}

// API 数据抓取
async function fetchAPI(url) {
    try {
        const data = await fetchText(url);
        return JSON.parse(data);
    } catch (error) {
        console.error(`获取或解析 API 失败 ${url}:`, error.message);
        return null;
    }
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

function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getXmlTagValue(xmlText, tagName) {
    const escapedTag = escapeRegExp(tagName);
    const match = xmlText.match(new RegExp(`<${escapedTag}\\b[^>]*>([\\s\\S]*?)<\\/${escapedTag}>`, 'i'));
    return match ? match[1] : '';
}

function decodeXmlEntities(text) {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function cleanXmlText(text) {
    return decodeXmlEntities(
        text
            .replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/i, '$1')
            .replace(/<[^>]*>/g, '')
    ).trim();
}

function readExistingRSSData(filePath) {
    if (!fs.existsSync(filePath)) return null;

    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        console.error(`读取现有数据失败 ${filePath}:`, error.message);
        return null;
    }
}

// 简单的 RSS XML 解析
function parseRSS(xmlText) {
    const items = [];

    // 使用正则表达式解析 RSS XML
    const itemMatches = xmlText.match(/<item\b[\s\S]*?<\/item>/gi);

    if (!itemMatches) return items;

    itemMatches.forEach(itemText => {
        const titleValue = getXmlTagValue(itemText, 'title');
        const linkValue = getXmlTagValue(itemText, 'link');

        if (titleValue && linkValue) {
            const descriptionValue = getXmlTagValue(itemText, 'description') || getXmlTagValue(itemText, 'content:encoded') || '';
            const pubDate = getXmlTagValue(itemText, 'pubDate') || getXmlTagValue(itemText, 'dc:date') || '';
            const title = cleanXmlText(titleValue);
            const link = cleanXmlText(linkValue);
            const description = cleanXmlText(descriptionValue).substring(0, 200);

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
    let hasRequiredRSSFailure = false;

    // 抓取 RSS 源
    console.log('📡 开始抓取 RSS 源...');
    for (const source of RSS_SOURCES) {
        console.log(`📡 正在抓取 RSS: ${source.name}`);

        try {
            const result = await fetchRSS(source);
            const items = result.items || [];

            const jsonData = {
                source: {
                    name: source.name,
                    description: source.description,
                    url: result.url || source.url,
                    lastUpdate: new Date().toISOString()
                },
                items,
                total: items.length
            };

            const filePath = path.join(dataDir, source.filename);

            if (items.length > 0) {
                fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
                console.log(`✅ 成功抓取 ${source.name}: ${items.length} 条数据`);
            } else {
                const existingData = readExistingRSSData(filePath);
                if (existingData && existingData.items && existingData.items.length > 0) {
                    console.log(`⚠️ ${source.name} 抓取失败，保留现有 ${existingData.items.length} 条数据`);
                } else if (source.requireItems) {
                    hasRequiredRSSFailure = true;
                    console.error(`❌ ${source.name} 是必需 RSS 源，但没有抓到有效数据`);
                } else {
                    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
                    console.log(`⚠️ ${source.name} 抓取失败或无数据，已写入空数据文件`);
                }
            }
        } catch (error) {
            console.error(`❌ ${source.name} 处理失败:`, error.message);
            if (source.requireItems) {
                hasRequiredRSSFailure = true;
            }
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

    if (hasRequiredRSSFailure) {
        throw new Error('必需 RSS 源抓取失败，已阻止写入空数据。');
    }
}

// 运行主函数
main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
