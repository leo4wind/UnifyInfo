# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UnifyInfo is a static multi-platform hot news aggregator that displays trending content from 14 different sources (Chinese platforms + international tech news). The site uses vanilla JavaScript/HTML/CSS with a Node.js data fetching backend and GitHub Pages deployment.

## Common Development Commands

### Local Development
```bash
# Start local server (required due to CORS)
python -m http.server 8000
# or
npx http-server
# or
php -S localhost:8000
```

### Data Management
```bash
# Manual data fetching from all sources (API + RSS)
npm run fetch-rss
# or
node scripts/fetch-rss.js

# Test data fetching (same as fetch-rss)
npm test
```

## Architecture Overview

### Data Flow Architecture
1. **Data Sources**: 60s.viki.moe API (Chinese platforms) + RSS feeds (international sources)
2. **Collection Layer**: `scripts/fetch-rss.js` aggregates data via GitHub Actions every 4 hours
3. **Storage Layer**: JSON files in `/data/` directory with metadata (update_time, source attribution)
4. **Frontend Layer**: `script.js` loads **only local JSON files** (no direct API calls) with 5-minute client-side caching
5. **Presentation Layer**: Responsive CSS Grid with real-time search functionality

**Important**: The frontend exclusively reads from local JSON files in `/data/`. The `API_ENDPOINTS` object in `script.js` is legacy configuration - all data is fetched via `LOCAL_DATA_SOURCES`.

### Key Files and Their Purposes

**Core Frontend**:
- `index.html` - Main application structure and DOM layout
- `script.js` - Core application logic, API configuration, caching, search functionality
- `style.css` - Responsive design, CSS Grid layout, animations

**Data Pipeline**:
- `scripts/fetch-rss.js` - Node.js script that fetches from APIs + RSS sources. Uses Node.js built-in `https`/`http` modules (no external dependencies required for fetching)
- `/data/*.json` - Static data files (14 sources) with standardized metadata format

**Automation**:
- `.github/workflows/rss-fetch.yml` - GitHub Actions workflow for automated data fetching every 4 hours (cron: `0 */4 * * *`)

### Data Source Configuration

**API Sources** (via 60s.viki.moe):
- Chinese platforms: 抖音, B站, 微博, 小红书, 百度贴吧, 今日头条, 知乎, 60秒新闻
- Financial data: 新股信息 (via api.biyingapi.com) - **Special handling**: filters to show only stocks with purchase dates within ±7 days from current date

**RSS Sources** (configured in `fetch-rss.js`):
- Hacker News (best/top/new variants) - via 60s.viki.moe API proxy
- Ars Technica (tech news) - direct RSS feed
- 瓦斯阅读 (WeChat articles aggregation) - direct RSS feed

### Data Format Standardization

The fetch script (`fetch-rss.js`) normalizes different data formats:

**RSS Data Structure** (Ars Technica, 瓦斯阅读):
```json
{
  "source": { "name": "...", "description": "...", "lastUpdate": "ISO timestamp" },
  "items": [ {"title": "...", "link": "...", "description": "...", "pubDate": "..."} ],
  "total": 20
}
```

**API Data Structure** (60s.viki.moe sources):
```json
{
  "source": { "name": "...", "description": "...", "lastUpdate": "ISO timestamp" },
  "data": [ ...platform-specific format... ],
  "code": 200,
  "message": "..."
}
```

The frontend (`script.js`) converts both formats to a standardized structure during rendering.

### Frontend Architecture Patterns

**Caching Strategy**: 5-minute client-side cache using in-memory `CACHE` object (not localStorage) with timestamp validation
- Cache constant: `CACHE_DURATION = 5 * 60 * 1000` (script.js:96)
- Cache invalidation: `isCacheValid()` function checks timestamp

**Search Implementation**: Real-time text search across all platforms with query highlighting and match counting
- Debounced search: 300ms delay on input (script.js:192)
- Searches both title and description fields for RSS items
- Highlights matching terms with `<span class="search-highlight">` wrapper

**Update Time Display**: Each section header shows last update time
- Converts UTC timestamps to China time zone (Asia/Shanghai)
- Special case: 60秒新闻 displays update time in dedicated `newsDate` element, not in header

**Error Handling**: Graceful fallbacks for failed API calls, network timeouts, and malformed data
- Individual section error messages preserve other sections
- Global error handlers for unhandled promises and JS errors

**Responsive Design**: Mobile-first CSS Grid with breakpoints for tablet (768px) and desktop (1024px)

### Page Layout Structure

**Header** (index.html:12-24):
- Title with current date display
- Centered search bar with clear button
- 励志tip container (displays daily motivational text from 60秒新闻)

**Main Content Grid** (index.html:28-142):
- CSS Grid container (`#hotLists`) with responsive columns
- 14 hot list sections in specific order:
  1. 60秒新闻 (special card layout)
  2. 新股信息 (complex card with financial data)
  3. 瓦斯阅读 (RSS)
  4. 知乎热榜
  5. Ars Technica (RSS)
  6. 抖音热榜
  7. B站热榜
  8. 微博热榜
  9. 小红书热榜
  10. 百度贴吧
  11. 今日头条
  12. Hacker News best
  13. Hacker News top
  14. Hacker News new

Each section follows pattern: `<section id="{key}">` → `<div id="{key}List">` for content

## Development Guidelines

### Modifying Data Sources

**Adding a new data source requires changes in 3 locations:**

1. **Backend** (`scripts/fetch-rss.js`):
   - Add to `RSS_SOURCES` array (lines 7-20) for RSS feeds
   - Add to `API_SOURCES` array (lines 23-96) for API endpoints
   - Special data processing: Add custom logic in the main loop (see 新股信息 example at lines 283-306)

2. **Frontend Configuration** (`script.js`):
   - Add entry to `LOCAL_DATA_SOURCES` object (lines 17-90) with JSON path and metadata
   - Add render case in `renderData()` switch statement (lines 321-359)
   - Create dedicated render function following pattern: `renderPlatformName(data)`

3. **HTML Structure** (`index.html`):
   - Add section with id matching the data source key
   - Include container div with id `{key}List` for content rendering

### Frontend Modifications
- **Data source config**: Modify `LOCAL_DATA_SOURCES` object in `script.js` (lines 17-90)
- **Cache duration**: Adjust `CACHE_DURATION` constant (script.js:96, default: 5 minutes)
- **Debounce timing**: Modify search debounce delay (script.js:192, default: 300ms)
- **Styling**: Use CSS custom properties in `style.css` for consistent theming

### Special Data Processing Patterns

**New Shares Filtering** (fetch-rss.js:178-195):
- Filters stocks to show only ±7 days from current date based on `sgrq` (申购日期) field
- Sorts by purchase date descending

**RSS Parsing** (fetch-rss.js:198-237):
- Uses regex to parse XML (no external XML parser dependency)
- Handles both CDATA and plain text in title/description
- Limits to 20 most recent items sorted by timestamp

**Stock Type Detection** (script.js:766-818):
- Identifies exchange and board type from 6-digit stock code prefix
- Supports: 上交所主板, 深交所主板, 科创板, 创业板, 北交所, B股
- Special handling for merged 中小板 (002xxx codes now 深交所主板)

### Rendering Patterns

The frontend uses dedicated render functions for each data source:

**Simple List Rendering** (douyin, bili, weibo, rednote, tieba, toutiao, zhihu, hackernews):
- Display: rank number + clickable title
- Top 5 items get special `.top5` styling
- Pattern: `renderPlatformName(data)` functions (script.js:447-645)

**RSS Rendering** (arstechnica, wasi):
- Uses `renderLocalData()` function (script.js:363-414)
- Includes description truncation and optional publication date
- 瓦斯阅读: title only, no description/date
- Ars Technica: title + 100-char description excerpt

**60秒新闻 Special Rendering** (script.js:417-445):
- Displays first 15 news items as bullet list
- Truncates each item to 60 characters with tooltip showing full text
- Displays date in dedicated header area (`newsDate`)
- Shows daily tip in header (`tipText`)

**新股信息 Special Rendering** (script.js:648-692):
- Complex card layout with stock code, name, type badge
- Shows purchase code and date with color coding (today/tomorrow/upcoming/past)
- Displays truncated business description (40 chars) with full text in tooltip
- Uses `getStockType()` for exchange/board identification

### Key Utility Functions

- `decodeHTML(html)` (script.js:759): Decodes HTML entities using textarea trick
- `formatUSDateToChinaTime(usDateStr)` (script.js:135): Converts UTC ISO timestamps to Asia/Shanghai timezone
- `formatPurchaseDate(dateStr)` (script.js:855): Returns date label and type for stock purchase dates
- `truncateText(text, maxLength)` (script.js:849): Truncates text with ellipsis
- `debounce(func, wait)` (script.js:1058): Debounces function execution

### Testing Data Fetching
Always test data fetching locally before deploying:
```bash
node scripts/fetch-rss.js
# Check that all /data/*.json files are updated with fresh content
```

## Deployment Notes

- **Target**: GitHub Pages (static file hosting)
- **Automation**: GitHub Actions runs every 4 hours to update data (UTC times: 0, 4, 8, 12, 16, 20)
- **No Build Process**: Files are served directly (no bundling/minification)
- **CORS Requirements**: Local development requires HTTP server due to fetch() API restrictions on file:// protocol
- **Git Automation**: Workflow automatically commits and pushes updated JSON files to `/data/` directory

### GitHub Actions Workflow Details

The workflow (`.github/workflows/rss-fetch.yml`):
1. Checks out the repository
2. Sets up Node.js 18
3. Installs npm dependencies (rss-parser and cheerio - note: actual fetch script doesn't use these, only built-in modules)
4. Runs `node scripts/fetch-rss.js`
5. Commits changes to `/data/` directory with timestamp
6. Pushes to main branch

**Manual trigger**: Workflow can be manually triggered via GitHub Actions UI (`workflow_dispatch`)