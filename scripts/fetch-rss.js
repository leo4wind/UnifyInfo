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
    // 以后可以添加更多 RSS 源
    // {
    //     url: 'https://example.com/feed',
    //     filename: 'example.json',
    //     name: 'Example',
    //     description: '示例网站'
    // }
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
    console.log('🔄 开始抓取 RSS 源...');

    for (const source of RSS_SOURCES) {
        console.log(`📡 正在抓取: ${source.name}`);

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

    console.log('🎉 RSS 抓取完成!');
}

// 运行主函数
main().catch(console.error);