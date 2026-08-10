export interface ApifyActorConfig {
  actorId: string;
  name: string;
  description: string;
  buildInput: (params: Record<string, any>) => Record<string, any>;
  transformResults: (items: any[]) => any;
  timeoutSecs: number;
}

export const APIFY_ACTORS: Record<string, ApifyActorConfig> = {
  "google-maps-leads": {
    actorId: "poidata~google-maps-email-extractor",
    name: "Google Maps Lead Finder",
    description:
      "Find businesses from Google Maps with emails, phones, reviews, and social links",
    timeoutSecs: 120,
    buildInput: (params) => ({
      searchStringsArray: [params.query || `${params.keyword} in ${params.location}`],
      maxCrawledPlacesPerSearch: params.limit || 20,
      language: params.language || "en",
      deeperCityScrape: false,
      scrapeEmails: true,
      scrapeSocialMedia: true,
      skipClosedPlaces: true,
    }),
    transformResults: (items) => ({
      leads: items.map((item: any) => ({
        name: item.title || item.name || "",
        address: item.address || item.street || "",
        phone: item.phone || item.phoneUnformatted || "",
        website: item.website || item.url || "",
        email: item.email || item.emails?.[0] || "",
        emails: item.emails || (item.email ? [item.email] : []),
        rating: item.totalScore || item.rating || 0,
        reviewCount: item.reviewsCount || item.reviews || 0,
        category: item.categoryName || item.category || "",
        location: {
          lat: item.location?.lat || item.latitude,
          lng: item.location?.lng || item.longitude,
        },
        socialMedia: {
          facebook: item.facebookUrl || item.facebook || "",
          instagram: item.instagramUrl || item.instagram || "",
          twitter: item.twitterUrl || item.twitter || "",
          linkedin: item.linkedinUrl || item.linkedin || "",
          youtube: item.youtubeUrl || item.youtube || "",
        },
        openingHours: item.openingHours || item.hours || null,
        imageUrl: item.imageUrl || item.mainPhoto || "",
        placeId: item.placeId || "",
      })),
      totalFound: items.length,
      source: "Google Maps via Apify",
    }),
  },

  "linkedin-companies": {
    actorId: "dev_fusion~linkedin-company-scraper",
    name: "LinkedIn Company Intelligence",
    description:
      "Extract company data from LinkedIn: industry, size, employees, website (no cookies needed)",
    timeoutSecs: 90,
    buildInput: (params) => ({
      urls: Array.isArray(params.urls)
        ? params.urls
        : params.url
          ? [params.url]
          : [`https://www.linkedin.com/company/${params.companyName}`],
      proxy: { useApifyProxy: true },
    }),
    transformResults: (items) => ({
      companies: items.map((item: any) => ({
        name: item.name || item.companyName || "",
        tagline: item.tagline || item.headline || "",
        description: item.description || item.about || "",
        industry: item.industry || "",
        companySize: item.companySize || item.size || "",
        employeeCount: item.employeeCount || item.employees || 0,
        headquarters: item.headquarters || item.location || "",
        website: item.website || item.websiteUrl || "",
        founded: item.founded || item.foundedYear || "",
        specialties: item.specialties || [],
        linkedinUrl: item.url || item.linkedinUrl || "",
        logo: item.logo || item.logoUrl || "",
      })),
      totalFound: items.length,
      source: "LinkedIn via Apify",
    }),
  },

  "facebook-ads": {
    actorId: "igolaizola~facebook-ad-library-scraper",
    name: "Facebook Ads Spy",
    description:
      "Scrape competitor ads from Facebook Ad Library: creatives, copy, targeting, spend",
    timeoutSecs: 120,
    buildInput: (params) => ({
      query: params.query || params.keyword || "",
      country: params.country || "US",
      adType: params.adType || "all",
      adActiveStatus: params.status || "active",
      maxItems: params.limit || 30,
    }),
    transformResults: (items) => ({
      ads: items.map((item: any) => ({
        id: item.id || item.adArchiveID || "",
        pageName: item.pageName || item.page_name || "",
        pageId: item.pageId || item.page_id || "",
        adText: item.adCreativeBody || item.body || item.ad_creative_bodies?.[0] || "",
        headline: item.adCreativeTitle || item.title || item.ad_creative_link_titles?.[0] || "",
        linkUrl: item.adCreativeLinkUrl || item.link || item.ad_creative_link_captions?.[0] || "",
        imageUrl: item.adCreativeImageUrl || item.imageUrl || "",
        startDate: item.startDate || item.ad_delivery_start_time || "",
        endDate: item.endDate || item.ad_delivery_stop_time || "",
        status: item.isActive ? "active" : item.status || "unknown",
        platforms: item.publisherPlatform || item.platforms || [],
        spend: item.spend || null,
        impressions: item.impressions || null,
      })),
      totalFound: items.length,
      source: "Facebook Ad Library via Apify",
    }),
  },

  "instagram-profiles": {
    actorId: "apify~instagram-profile-scraper",
    name: "Instagram Profile Intel",
    description:
      "Extract Instagram profile data: followers, bio, posts, engagement rate",
    timeoutSecs: 90,
    buildInput: (params) => ({
      usernames: Array.isArray(params.usernames)
        ? params.usernames
        : [params.username || params.handle || ""],
      resultsLimit: params.postsLimit || 12,
    }),
    transformResults: (items) => ({
      profiles: items.map((item: any) => ({
        username: item.username || "",
        fullName: item.fullName || item.full_name || "",
        biography: item.biography || item.bio || "",
        followers: item.followersCount || item.followers || 0,
        following: item.followsCount || item.following || 0,
        posts: item.postsCount || item.posts || 0,
        isVerified: item.verified || item.isVerified || false,
        isBusinessAccount: item.isBusinessAccount || false,
        businessCategory: item.businessCategoryName || item.category || "",
        externalUrl: item.externalUrl || item.website || "",
        email: item.businessEmail || item.publicEmail || "",
        phone: item.businessPhoneNumber || item.publicPhoneNumber || "",
        profilePicUrl: item.profilePicUrlHD || item.profilePicUrl || "",
        engagementRate: item.engagementRate || null,
        recentPosts: (item.latestPosts || item.posts || []).slice(0, 6).map((p: any) => ({
          caption: p.caption || p.text || "",
          likes: p.likesCount || p.likes || 0,
          comments: p.commentsCount || p.comments || 0,
          url: p.url || "",
          imageUrl: p.displayUrl || p.imageUrl || "",
        })),
      })),
      totalFound: items.length,
      source: "Instagram via Apify",
    }),
  },

  "contact-scraper": {
    actorId: "practicaltools~contact-details-scraper",
    name: "Website Contact Scraper",
    description:
      "Crawl any website to extract emails, phones, LinkedIn, Twitter, Instagram, Facebook",
    timeoutSecs: 90,
    buildInput: (params) => ({
      startUrls: [{ url: params.url || `https://${params.domain}` }],
      maxRequestsPerCrawl: params.maxPages || 20,
      maxDepth: params.depth || 3,
    }),
    transformResults: (items) => ({
      contacts: items.map((item: any) => ({
        url: item.url || "",
        domain: item.domain || "",
        emails: item.emails || [],
        phones: item.phones || item.phoneNumbers || [],
        socialMedia: {
          linkedin: item.linkedin || item.linkedinUrls?.[0] || "",
          twitter: item.twitter || item.twitterUrls?.[0] || "",
          instagram: item.instagram || item.instagramUrls?.[0] || "",
          facebook: item.facebook || item.facebookUrls?.[0] || "",
          youtube: item.youtube || item.youtubeUrls?.[0] || "",
        },
      })),
      allEmails: [...new Set(items.flatMap((i: any) => i.emails || []))],
      allPhones: [...new Set(items.flatMap((i: any) => i.phones || i.phoneNumbers || []))],
      totalPages: items.length,
      source: "Website Crawl via Apify",
    }),
  },

  "social-leads": {
    actorId: "apify~social-media-leads-analyzer",
    name: "Social Media Lead Analyzer",
    description:
      "Extract emails, phones, and social media details from any website — 8 platforms supported",
    timeoutSecs: 90,
    buildInput: (params) => ({
      startUrls: Array.isArray(params.urls)
        ? params.urls.map((u: string) => ({ url: u }))
        : [{ url: params.url || `https://${params.domain}` }],
      maxRequestsPerCrawl: params.maxPages || 30,
    }),
    transformResults: (items) => ({
      leads: items.map((item: any) => ({
        url: item.url || "",
        emails: item.emails || [],
        phones: item.phones || [],
        linkedin: item.linkedIn || item.linkedin || "",
        twitter: item.twitter || "",
        instagram: item.instagram || "",
        facebook: item.facebook || "",
        youtube: item.youtube || "",
        tiktok: item.tiktok || "",
        github: item.github || "",
      })),
      summary: {
        totalEmails: [...new Set(items.flatMap((i: any) => i.emails || []))].length,
        totalPhones: [...new Set(items.flatMap((i: any) => i.phones || []))].length,
        pagesScanned: items.length,
      },
      source: "Social Media Leads Analyzer via Apify",
    }),
  },

  "google-maps-reviews": {
    actorId: "agents~google-maps-reviews",
    name: "Google Maps Review Scraper",
    description:
      "Extract all reviews for any business on Google Maps — ratings, text, dates, replies",
    timeoutSecs: 120,
    buildInput: (params) => ({
      startUrls: params.placeUrl
        ? [{ url: params.placeUrl }]
        : undefined,
      searchStringsArray: params.query ? [params.query] : undefined,
      maxReviews: params.limit || 50,
      language: params.language || "en",
    }),
    transformResults: (items) => ({
      reviews: items.map((item: any) => ({
        author: item.name || item.author || "",
        rating: item.stars || item.rating || 0,
        text: item.text || item.reviewBody || "",
        date: item.publishedAtDate || item.date || "",
        responseText: item.responseFromOwnerText || item.ownerResponse || "",
        likes: item.likesCount || 0,
      })),
      averageRating:
        items.length > 0
          ? (
              items.reduce((sum: number, i: any) => sum + (i.stars || i.rating || 0), 0) /
              items.length
            ).toFixed(1)
          : "0",
      totalReviews: items.length,
      source: "Google Maps Reviews via Apify",
    }),
  },
  "tiktok-profiles": {
    actorId: "apidojo~tiktok-profile-scraper",
    name: "TikTok Profile Scraper",
    description: "Extract TikTok profile data: followers, bio, videos, engagement at 425/sec",
    timeoutSecs: 90,
    buildInput: (params) => ({
      profiles: Array.isArray(params.usernames)
        ? params.usernames.map((u: string) => u.replace("@", ""))
        : [params.username?.replace("@", "") || ""],
      resultsPerPage: params.postsLimit || 12,
    }),
    transformResults: (items) => ({
      profiles: items.map((item: any) => ({
        username: item.uniqueId || item.username || "",
        nickname: item.nickname || item.displayName || "",
        bio: item.signature || item.bio || "",
        followers: item.fans || item.followerCount || item.followers || 0,
        following: item.following || item.followingCount || 0,
        likes: item.heart || item.totalLikes || item.digg || 0,
        videos: item.video || item.videoCount || 0,
        isVerified: item.verified || false,
        profilePicUrl: item.avatarLarger || item.avatarMedium || "",
        externalUrl: item.bioLink?.link || "",
        recentVideos: (item.latestVideos || item.items || []).slice(0, 6).map((v: any) => ({
          description: v.desc || v.caption || "",
          views: v.playCount || v.views || 0,
          likes: v.diggCount || v.likes || 0,
          comments: v.commentCount || v.comments || 0,
          shares: v.shareCount || v.shares || 0,
          url: v.webVideoUrl || v.url || "",
        })),
      })),
      totalFound: items.length,
      source: "TikTok via Apify",
    }),
  },

  "linkedin-emails": {
    actorId: "x_guru~linkedin-email-scraper-no-cookies",
    name: "LinkedIn Email Finder",
    description: "Find work & personal emails from LinkedIn profile URLs — 300M+ database, no cookies",
    timeoutSecs: 90,
    buildInput: (params) => ({
      urls: Array.isArray(params.urls)
        ? params.urls
        : params.url
          ? [params.url]
          : [],
    }),
    transformResults: (items) => ({
      contacts: items.map((item: any) => ({
        linkedinUrl: item.url || item.linkedinUrl || "",
        fullName: item.fullName || item.name || "",
        workEmail: item.workEmail || item.email || "",
        personalEmail: item.personalEmail || "",
        allEmails: item.emails || [item.workEmail, item.personalEmail].filter(Boolean),
        title: item.title || item.headline || "",
        company: item.company || item.companyName || "",
      })),
      totalFound: items.length,
      allEmails: [...new Set(items.flatMap((i: any) => i.emails || [i.workEmail, i.personalEmail].filter(Boolean)))],
      source: "LinkedIn Email Finder via Apify",
    }),
  },

  "linkedin-people-search": {
    actorId: "prog-party~linkedin-profiles",
    name: "LinkedIn People Search",
    description: "Search LinkedIn profiles by person name — find decision-makers",
    timeoutSecs: 90,
    buildInput: (params) => ({
      names: Array.isArray(params.names) ? params.names : [params.name || ""],
      count: params.limit || 5,
    }),
    transformResults: (items) => ({
      profiles: items.map((item: any) => ({
        fullName: item.name || item.fullName || "",
        headline: item.headline || item.title || "",
        location: item.location || "",
        linkedinUrl: item.url || item.profileUrl || "",
        imageUrl: item.imageUrl || item.photo || "",
        company: item.company || "",
      })),
      totalFound: items.length,
      source: "LinkedIn People Search via Apify",
    }),
  },

  "facebook-page-details": {
    actorId: "memo23~facebook-page-contact-detail-scraper",
    name: "Facebook Page Details",
    description: "Extract email, phone, website, hours, reviews from Facebook business pages",
    timeoutSecs: 90,
    buildInput: (params) => ({
      urls: Array.isArray(params.urls)
        ? params.urls
        : [params.url || `https://facebook.com/${params.pageName || ""}`],
    }),
    transformResults: (items) => ({
      pages: items.map((item: any) => ({
        name: item.name || item.pageName || "",
        category: item.category || item.categories?.join(", ") || "",
        email: item.email || "",
        phone: item.phone || "",
        website: item.website || "",
        address: item.address || "",
        likes: item.likes || item.likesCount || 0,
        followers: item.followers || item.followersCount || 0,
        rating: item.rating || item.overallStarRating || 0,
        hours: item.hours || item.openingHours || "",
        description: item.about || item.description || "",
        socialLinks: item.socialLinks || {},
      })),
      totalFound: items.length,
      source: "Facebook Pages via Apify",
    }),
  },

  "facebook-ad-leads": {
    actorId: "igolaizola~facebook-ad-leads",
    name: "Facebook Ad Leads",
    description: "Extract business profiles from FB advertisers: email, phone, address, website, social links",
    timeoutSecs: 120,
    buildInput: (params) => ({
      query: params.query || params.keyword || "",
      country: params.country || "US",
      maxItems: params.limit || 30,
    }),
    transformResults: (items) => ({
      businesses: items.map((item: any) => ({
        pageName: item.pageName || item.page_name || item.name || "",
        email: item.email || "",
        phone: item.phone || "",
        website: item.website || "",
        address: item.address || "",
        category: item.category || "",
        facebook: item.facebookUrl || item.pageUrl || "",
        instagram: item.instagramUrl || item.instagram || "",
        twitter: item.twitterUrl || item.twitter || "",
        linkedin: item.linkedinUrl || item.linkedin || "",
      })),
      totalFound: items.length,
      source: "Facebook Ad Leads via Apify",
    }),
  },

  "all-social-emails": {
    actorId: "danny.hub~all-in-social-media-email",
    name: "All Social Media Email Scraper",
    description: "Extract emails by keyword from IG, TikTok, YouTube, LinkedIn, Twitter, Reddit, Pinterest",
    timeoutSecs: 120,
    buildInput: (params) => ({
      keyword: params.keyword || "",
      country: params.country || "us",
      platform: params.platform || "all",
      maxResults: params.limit || 50,
    }),
    transformResults: (items) => ({
      contacts: items.map((item: any) => ({
        email: item.email || "",
        username: item.username || item.name || "",
        platform: item.platform || item.source || "",
        profileUrl: item.profileUrl || item.url || "",
        followers: item.followers || item.followersCount || 0,
        bio: item.bio || item.description || "",
      })),
      allEmails: [...new Set(items.map((i: any) => i.email).filter(Boolean))],
      totalFound: items.length,
      source: "All Social Media Email Scraper via Apify",
    }),
  },

  "trustpilot-reviews": {
    actorId: "scraped~trustpilot-reviews",
    name: "Trustpilot Reviews",
    description: "Scrape Trustpilot reviews for any business — ratings, text, dates, ultra fast",
    timeoutSecs: 90,
    buildInput: (params) => ({
      urls: Array.isArray(params.urls)
        ? params.urls
        : [params.url || `https://www.trustpilot.com/review/${params.domain || ""}`],
      maxReviews: params.limit || 50,
    }),
    transformResults: (items) => ({
      reviews: items.map((item: any) => ({
        author: item.consumer?.displayName || item.author || item.name || "",
        rating: item.rating || item.stars || 0,
        title: item.title || item.heading || "",
        text: item.text || item.content || item.reviewBody || "",
        date: item.date || item.createdAt || item.publishedDate || "",
        isVerified: item.isVerified || item.verified || false,
      })),
      averageRating: items.length > 0
        ? (items.reduce((s: number, i: any) => s + (i.rating || i.stars || 0), 0) / items.length).toFixed(1)
        : "0",
      totalReviews: items.length,
      source: "Trustpilot via Apify",
    }),
  },

  "similarweb": {
    actorId: "canadesk~similarweb",
    name: "SimilarWeb Analytics",
    description: "Get website traffic analytics, ranking, engagement, and traffic sources",
    timeoutSecs: 90,
    buildInput: (params) => ({
      urls: Array.isArray(params.urls)
        ? params.urls
        : [params.url || `https://${params.domain || ""}`],
    }),
    transformResults: (items) => ({
      sites: items.map((item: any) => ({
        domain: item.domain || item.siteName || "",
        globalRank: item.globalRank || item.rank || 0,
        countryRank: item.countryRank || 0,
        categoryRank: item.categoryRank || 0,
        category: item.category || "",
        monthlyVisits: item.totalVisits || item.monthlyVisits || 0,
        avgVisitDuration: item.avgVisitDuration || "",
        pagesPerVisit: item.pagesPerVisit || 0,
        bounceRate: item.bounceRate || "",
        trafficSources: item.trafficSources || {
          direct: item.direct || 0,
          search: item.search || 0,
          social: item.social || 0,
          referral: item.referrals || 0,
          mail: item.mail || 0,
        },
        topCountries: item.topCountries || item.geography || [],
      })),
      totalFound: items.length,
      source: "SimilarWeb via Apify",
    }),
  },

  "youtube-channels": {
    actorId: "agentx~youtuber-scraper",
    name: "YouTube Channel Scraper",
    description: "Extract YouTube emails, social links, and channel stats for influencer outreach",
    timeoutSecs: 90,
    buildInput: (params) => ({
      channelUrls: Array.isArray(params.urls)
        ? params.urls
        : [params.url || ""],
      maxResults: params.limit || 10,
    }),
    transformResults: (items) => ({
      channels: items.map((item: any) => ({
        name: item.channelName || item.name || item.title || "",
        subscribers: item.subscriberCount || item.subscribers || 0,
        totalViews: item.viewCount || item.totalViews || 0,
        videos: item.videoCount || item.totalVideos || 0,
        email: item.email || item.businessEmail || "",
        description: item.description || item.about || "",
        country: item.country || "",
        channelUrl: item.channelUrl || item.url || "",
        socialLinks: {
          instagram: item.instagram || "",
          twitter: item.twitter || "",
          facebook: item.facebook || "",
          tiktok: item.tiktok || "",
          website: item.website || item.externalUrl || "",
        },
        joinedDate: item.joinedDate || item.publishedAt || "",
      })),
      totalFound: items.length,
      allEmails: [...new Set(items.map((i: any) => i.email || i.businessEmail).filter(Boolean))],
      source: "YouTube via Apify",
    }),
  },

  "twitter-profiles": {
    actorId: "apidojo~twitter-user-scraper",
    name: "Twitter/X Profile Scraper",
    description: "Extract X/Twitter user profiles: bio, followers, tweets, engagement",
    timeoutSecs: 90,
    buildInput: (params) => ({
      usernames: Array.isArray(params.usernames)
        ? params.usernames.map((u: string) => u.replace("@", ""))
        : [params.username?.replace("@", "") || ""],
      maxItems: params.limit || 10,
    }),
    transformResults: (items) => ({
      profiles: items.map((item: any) => ({
        username: item.userName || item.username || item.screen_name || "",
        displayName: item.name || item.displayName || "",
        bio: item.description || item.bio || "",
        followers: item.followers || item.followersCount || item.followers_count || 0,
        following: item.following || item.friendsCount || item.friends_count || 0,
        tweets: item.statusesCount || item.tweetsCount || item.statuses_count || 0,
        likes: item.favouritesCount || item.likesCount || 0,
        isVerified: item.verified || item.isBlueVerified || false,
        location: item.location || "",
        website: item.url || item.website || "",
        profileImageUrl: item.profileImageUrl || item.profile_image_url || "",
        bannerUrl: item.profileBannerUrl || item.profile_banner_url || "",
        joinedDate: item.createdAt || item.created_at || "",
      })),
      totalFound: items.length,
      source: "Twitter/X via Apify",
    }),
  },
};

export type ApifyActorKey = keyof typeof APIFY_ACTORS;
