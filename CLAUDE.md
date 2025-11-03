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
4. **Frontend Layer**: `script.js` loads local JSON files with 5-minute client-side caching
5. **Presentation Layer**: Responsive CSS Grid with real-time search functionality

### Key Files and Their Purposes

**Core Frontend**:
- `index.html` - Main application structure and DOM layout
- `script.js` - Core application logic, API configuration, caching, search functionality
- `style.css` - Responsive design, CSS Grid layout, animations

**Data Pipeline**:
- `scripts/fetch-rss.js` - Node.js script that fetches from APIs + RSS sources
- `/data/*.json` - Static data files (14 sources) with standardized metadata format

**Automation**:
- `.github/workflows/rss-fetch.yml` - GitHub Actions workflow for automated data fetching

### Data Source Configuration

**API Sources** (via 60s.viki.moe):
- Chinese platforms: 抖音, B站, 微博, 小红书, 百度贴吧, 今日头条, 知乎, 60秒新闻, 新股信息

**RSS Sources** (configured in `fetch-rss.js`):
- Hacker News (best/top/new variants)
- Ars Technica (tech news)
- 瓦斯阅读 (WeChat articles aggregation)

### Frontend Architecture Patterns

**Caching Strategy**: 5-minute client-side cache using `localStorage` with timestamp validation

**Search Implementation**: Real-time text search across all platforms with query highlighting and match counting

**Error Handling**: Graceful fallbacks for failed API calls, network timeouts, and malformed data

**Responsive Design**: Mobile-first CSS Grid with breakpoints for tablet (768px) and desktop (1024px)

## Development Guidelines

### Modifying Data Sources
- Add new API sources: Update `fetch-rss.js` with new fetch logic and JSON output format
- Add RSS sources: Configure in `RSS_SOURCES` array in `fetch-rss.js`
- Maintain JSON structure compatibility: `{data: [...], update_time: "ISO string", source: {...}}`

### Frontend Modifications
- API endpoints: Modify `API_ENDPOINTS` object in `script.js`
- Cache duration: Adjust `CACHE_DURATION` constant (default: 5 minutes)
- Styling: Use CSS custom properties in `style.css` for consistent theming

### Testing Data Fetching
Always test data fetching locally before deploying:
```bash
node scripts/fetch-rss.js
# Check that all /data/*.json files are updated with fresh content
```

## Deployment Notes

- **Target**: GitHub Pages (static file hosting)
- **Automation**: GitHub Actions runs every 4 hours to update data
- **No Build Process**: Files are served directly (no bundling/minification)
- **CORS Requirements**: Local development requires HTTP server due to API cross-origin requests