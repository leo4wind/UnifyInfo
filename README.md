# 多网站热榜 🔥

一个聚合多个平台热榜的静态网站，实时展示各平台的热门内容。

## 功能特性

- 📊 **多平台热榜聚合**：整合11个热门平台的热榜内容 + RSS订阅源
- 🔄 **自动刷新**：每5分钟自动更新数据
- 🔍 **实时搜索**：支持全文搜索和高亮显示
- 📱 **响应式设计**：完美适配手机、平板和桌面设备
- ⚡ **性能优化**：本地缓存，减少API请求
- 🎨 **简洁美观**：现代化设计，布局紧凑

## 支持的热榜平台

| 平台 | 说明 |
|------|------|
| 📰 60秒新闻 | 每日新闻简讯 |
| 🎵 抖音热榜 | 抖音热门话题 |
| 📺 B站热榜 | 哔哩哔哩热门 |
| 📱 微博热榜 | 微博热搜榜 |
| 📕 小红书热榜 | 小红书热门 |
| 📝 百度贴吧 | 贴吧热帖 |
| 📰 今日头条 | 头条热榜 |
| 🤔 知乎热榜 | 知乎热门问题 |
| 💻 Hacker News | 英文技术新闻最佳 |
| 🔥 Hacker News Top | 英文技术新闻热门 |
| 🆕 Hacker News New | 英文技术新闻最新 |
| 🔬 Ars Technica | 科技新闻和评测 (RSS) |

## 快速开始

### 本地运行

1. 克隆或下载项目文件
2. 使用任意HTTP服务器运行（因为涉及跨域请求）

```bash
# 使用Python内置服务器
python -m http.server 8000

# 或使用Node.js的http-server
npx http-server

# 或使用PHP内置服务器
php -S localhost:8000
```

3. 在浏览器中访问 `http://localhost:8000`

### RSS 数据抓取

项目支持自动抓取 RSS 源并转换为 JSON 数据：

```bash
# 手动抓取 RSS 数据
npm run fetch-rss

# 或者直接运行
node scripts/fetch-rss.js
```

**RSS 配置**：
在 `scripts/fetch-rss.js` 中的 `RSS_SOURCES` 数组配置 RSS 源：

```javascript
const RSS_SOURCES = [
    {
        url: 'https://arstechnica.com/feed/',
        filename: 'arstechnica.json',
        name: 'Ars Technica',
        description: '科技新闻和评测'
    }
];
```

### 部署到GitHub Pages

1. 将项目上传到GitHub仓库
2. 在仓库设置中启用GitHub Pages
3. 选择主分支作为源
4. 访问 `https://username.github.io/repository-name`

**GitHub Actions 自动化**：
项目配置了 GitHub Actions，每天北京时间早上8点自动抓取 RSS 数据并更新到仓库。

## 文件结构

```
├── index.html          # 主页面
├── style.css           # 样式文件
├── script.js           # JavaScript逻辑
├── README.md          # 说明文档
├── package.json       # Node.js 项目配置
├── scripts/           # 脚本目录
│   └── fetch-rss.js   # RSS 抓取脚本
├── .github/workflows/ # GitHub Actions 配置
│   └── rss-fetch.yml  # 自动抓取工作流
└── data/              # RSS 数据存储目录
    └── arstechnica.json # RSS 数据文件
```

## 主要功能

### 搜索功能
- 实时搜索所有热榜内容
- 搜索结果高亮显示
- 显示匹配结果数量
- 一键清除搜索

### 数据缓存
- 5分钟本地缓存
- 减少API请求次数
- 提升页面加载速度

### 错误处理
- 网络错误友好提示
- API异常自动重试
- 数据格式验证

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 数据来源

所有数据来源于 [60s.viki.moe](https://60s.viki.moe) API接口，感谢开源项目的支持。

## 技术栈

- **HTML5**：语义化标签
- **CSS3**：Grid布局、Flexbox、动画
- **JavaScript ES6+**：现代JavaScript特性
- **Fetch API**：数据请求

## 自定义配置

### 修改API端点
在 `script.js` 中修改 `API_ENDPOINTS` 对象：

```javascript
const API_ENDPOINTS = {
    // 添加或修改API地址
    custom: 'https://your-api-url.com/v1/data'
};
```

### 调整缓存时间
修改 `CACHE_DURATION` 值（毫秒）：

```javascript
CACHE_DURATION: 5 * 60 * 1000 // 5分钟
```

### 自定义样式
在 `style.css` 中修改CSS变量和样式规则。

## 注意事项

1. **跨域问题**：由于API接口可能存在CORS限制，建议通过反向代理或使用支持CORS的服务器运行。
2. **API限制**：请遵守API服务方的使用条款，避免频繁请求。
3. **数据准确性**：热榜数据来源于第三方，仅供参考。

## 贡献

欢迎提交Issue和Pull Request来改进这个项目！

## 许可证

MIT License

---

🌟 如果这个项目对你有帮助，请给个星标支持一下！