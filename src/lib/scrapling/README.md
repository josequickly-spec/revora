# Scrapling Integration Guide

Complete web scraping integration for the Revora platform using the Scrapling framework.

## Overview

This integration provides **6 core scraping functions** across the entire platform:

1. **Business Discovery** - Find businesses from web directories
2. **Funnel Analysis** - Analyze landing pages and conversion strategies
3. **Competitor Monitoring** - Track competitor pricing, features, and positioning
4. **Data Enrichment** - Enrich business data with web-scraped information
5. **Proposal Generation** - Personalize proposals using scraped business data
6. **Contact Extraction** - Extract and verify contact information

## Architecture

```
ScraplingOrchestrator (Main Coordinator)
├── BusinessDiscoveryScraper
├── FunnelAnalyzer
├── CompetitorMonitor
├── DataEnricher (planned)
├── ProposalPersonalizer (planned)
└── ContactExtractor (planned)
```

## Features

### 🔍 Business Discovery
```typescript
const orchestrator = getOrchestrator();
const job = await orchestrator.createJob("business-discovery", {
  keyword: "ecommerce",
  location: "Miami, FL",
  limit: 50
});
```

**Scrapes from:**
- Google Maps
- Yelp
- Better Business Bureau (BBB)
- Industry-specific directories

**Extracts:**
- Business name, type, industry
- Contact emails and phone numbers
- Address and location
- Social media links
- Website information

### 📊 Funnel Analysis
```typescript
const job = await orchestrator.createJob("funnel-analysis", {
  url: "https://example.com/funnel"
});
```

**Analyzes:**
- Headlines and subheadlines
- CTA buttons and offer badges
- Hero images and layout
- Page structure and performance
- Conversion elements

**Comparisons:**
- Identify common patterns across funnels
- Find differentiators
- Recommend best practices
- Track funnel changes over time

### 👥 Competitor Monitoring
```typescript
const job = await orchestrator.createJob("competitor-monitoring", {
  competitors: ["competitor1.com", "competitor2.com"]
});
```

**Monitors:**
- Pricing strategies
- Features and capabilities
- Market positioning
- Marketing channels
- Recent changes
- Strengths and weaknesses

**Provides:**
- Market gap analysis
- Competitive opportunities
- Threat assessment
- Market leader identification

### 💾 Data Enrichment
```typescript
const job = await orchestrator.createJob("data-enrichment", {
  domain: "example.com",
  businessId: 123
});
```

**Enriches with:**
- Company size and founding year
- Revenue estimates
- Technology stack
- Social media presence
- Customer reviews
- Employee information

### 📝 Proposal Generation
```typescript
const job = await orchestrator.createJob("proposal-generation", {
  domain: "example.com",
  businessId: 123
});
```

**Personalizes proposals using:**
- Business website content
- Industry-specific data
- Competitor analysis
- Customer testimonials
- Technology signals

### 👤 Contact Extraction
```typescript
const job = await orchestrator.createJob("contact-extraction", {
  domain: "example.com",
  businessId: 123
});
```

**Extracts:**
- Employee information
- Decision-maker details
- Social media profiles
- Email addresses
- Phone numbers

## API Endpoints

### Execute Scraping Job
```bash
POST /api/scrapling/execute
Content-Type: application/json

{
  "type": "business-discovery",
  "params": {
    "keyword": "restaurant",
    "location": "New York",
    "limit": 50
  }
}

# Response
{
  "success": true,
  "job": {
    "id": "job_1234567890",
    "type": "business-discovery",
    "status": "running",
    "progress": 10,
    "createdAt": "2026-08-08T12:00:00Z"
  }
}
```

### Get Job Status
```bash
GET /api/scrapling/execute?jobId=job_1234567890
```

### List All Jobs
```bash
GET /api/scrapling/jobs
```

### Create Bulk Jobs
```bash
POST /api/scrapling/jobs
Content-Type: application/json

{
  "jobs": [
    { "type": "funnel-analysis", "params": { "url": "..." } },
    { "type": "competitor-monitoring", "params": { "competitors": [...] } }
  ]
}
```

### Cancel Job
```bash
DELETE /api/scrapling/jobs?jobId=job_1234567890
```

## Configuration

### Production Configuration
```typescript
import { defaultScrapingConfig } from "@/lib/scrapling/scraper-config";

const orchestrator = getOrchestrator(defaultScrapingConfig);
// Uses proxies, handles anti-bot protection, adaptive scraping enabled
```

### Development Configuration
```typescript
import { devScrapingConfig } from "@/lib/scrapling/scraper-config";

const orchestrator = getOrchestrator(devScrapingConfig);
// Faster scraping, no proxy rotation, useful for testing
```

### Custom Configuration
```typescript
orchestrator.updateConfig({
  useProxy: true,
  proxyRotation: true,
  handleCloudflare: true,
  requestsPerSecond: 2,
  delayBetweenRequests: 500,
});
```

## Integration Points

### 1. Lead Discovery
**From:** `/leads` page
**Action:** Click "Scrape Directories" button
**Executes:** `business-discovery` job
**Results:** Populate business list with scraped data

### 2. FunnelSpy Analysis
**From:** `/funnelspy` page
**Action:** Analyze URL with deep scraping
**Executes:** `funnel-analysis` job
**Results:** Enhanced funnel element extraction

### 3. Competitor Insights
**From:** `/businesses/{id}` page
**Action:** Analyze competitors
**Executes:** `competitor-monitoring` job
**Results:** Show competitive landscape

### 4. Business Enrichment
**From:** `/businesses/{id}` page
**Action:** Enrich business data
**Executes:** `data-enrichment` job
**Results:** Add company details, tech stack, employees

### 5. Proposal Personalization
**From:** `/proposals/new` page
**Action:** Generate proposal
**Executes:** `proposal-generation` job
**Results:** Personalized proposal content

### 6. Contact Discovery
**From:** `/contacts` section
**Action:** Extract decision makers
**Executes:** `contact-extraction` job
**Results:** Auto-populated contact database

## Job Status Flow

```
pending → running → completed
                 ↘ failed
```

**Progress tracking:**
- 0-20%: Initialization
- 20-50%: Main scraping
- 50-80%: Data processing
- 80-100%: Results compilation

## Performance Metrics

Get statistics:
```typescript
const orchestrator = getOrchestrator();
const stats = orchestrator.getStatistics();

console.log(stats);
// {
//   totalJobs: 42,
//   completed: 35,
//   failed: 2,
//   running: 5,
//   successRate: 83.33,
//   averageProgress: 65.2
// }
```

## Rate Limiting & Anti-Bot

### Default Protection
- Proxy rotation every 10 requests
- Random delays between requests (500-1000ms)
- Stealth headers enabled
- Cloudflare Turnstile handling
- Browser fingerprint spoofing

### Custom Rate Limiting
```typescript
orchestrator.updateConfig({
  requestsPerSecond: 1,
  delayBetweenRequests: 1000,
  randomDelay: true,
});
```

## Database Storage

Jobs and results are stored in memory with optional persistence:

```typescript
// Cleanup old jobs (older than 7 days)
const removed = orchestrator.cleanupOldJobs(7);
console.log(`Removed ${removed} old jobs`);
```

## Error Handling

### Common Errors
- **"Invalid URL"**: Check domain format
- **"Cloudflare blocked"**: Enable Cloudflare handling
- **"Timeout"**: Increase timeout values
- **"Rate limited"**: Reduce requests per second

### Retry Policy
```typescript
// Automatic retries with exponential backoff
maxRetries: 3
retryDelay: 2000 // 2s, 4s, 8s
```

## Best Practices

1. **Use appropriate delays** - Don't hammer servers
2. **Rotate proxies** - Avoid IP-based blocking
3. **Set user agents** - Appear as a browser
4. **Handle errors gracefully** - Implement retry logic
5. **Cache results** - Reduce duplicate scrapes
6. **Monitor jobs** - Track scraping success rates
7. **Respect robots.txt** - Follow website rules

## Future Enhancements

- [ ] WebSocket real-time progress updates
- [ ] Advanced ML-based element detection
- [ ] Multi-language support
- [ ] Video content analysis
- [ ] Dynamic JavaScript rendering
- [ ] CAPTCHA bypass automation
- [ ] Cloud-based distributed scraping
- [ ] Custom selector learning

## Troubleshooting

**Jobs stuck in "running" state:**
```typescript
orchestrator.cancelJob(jobId);
```

**Reset orchestrator:**
```typescript
import { resetOrchestrator } from "@/lib/scrapling/orchestrator";
resetOrchestrator();
```

**Enable debug logging:**
```typescript
orchestrator.updateConfig({ debugLogging: true });
```

## Dependencies

- `scrapling` - Main web scraping framework
- `node:stream` - Stream processing
- `node:events` - Event handling
- Browser automation (Playwright/Puppeteer)
- Proxy management libraries

## License

Part of Revora platform - Commercial use restricted
