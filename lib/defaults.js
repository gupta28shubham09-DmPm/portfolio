// Starting content for the website. The admin panel edits a copy of this that is saved in Neon.
// Text formatting inside any text box:  *yellow highlight*   ~blue highlight~   **bold**
module.exports = {
  site: {
    title: "Digital Shubham · Performance & Digital Marketing by Shubham Gupta",
    description:
      "Shubham Gupta helps real estate, EdTech, D2C, B2B and local brands get qualified leads with Meta Ads, Google Ads, LLM ads, SEO, GEO, AEO, social media and scroll-stopping creatives.",
    ogTitle: "Digital Shubham · Performance & Digital Marketing",
    ogDescription: "₹{budget}L+ ad budget managed · {creatives}+ creatives · {years}+ years. Let's grow your leads.",
  },

  brand: { first: "Digital", second: "Shubham" },

  contact: {
    name: "Shubham Gupta",
    phone: "+917692058084",
    phoneDisplay: "+91 76920 58084",
    whatsapp: "917692058084",
    whatsappMessage: "Hi Shubham, I saw your website and want to discuss marketing for my business.",
    email: "gupta28shubham09@gmail.com",
    linkedin: "https://linkedin.com/in/shubhamgupta-dev",
    linkedinLabel: "shubhamgupta-dev",
    company: "Digital Shubham",
    jobTitle: "Performance & Digital Marketer",
  },

  // Key numbers: type a number once here and use it anywhere as {tag}.
  // Also available automatically: {years} {companies} {budget} {leads}
  numbers: [
    { key: "creatives", label: "Creatives designed", value: "500", decimals: "auto" },
    { key: "projects", label: "Freelance projects", value: "10", decimals: "auto" },
    { key: "leadsRounded", label: "Total leads rounded down (shows 900+ for 941)", value: "=floor({leads}/100)*100", decimals: "0" },
    { key: "reLeads", label: "Real estate leads (all campaigns)", value: "506", decimals: "auto" },
    { key: "edLeads", label: "EdTech leads", value: "435", decimals: "auto" },
    { key: "cpl", label: "Best cost per lead · real estate (₹)", value: "97.71", decimals: "2" },
    { key: "cpm", label: "Best CPM · EdTech result posts (₹)", value: "2.49", decimals: "2" },
    { key: "hiringCpl", label: "Best hiring lead cost · EdTech (₹)", value: "1.75", decimals: "2" },
    { key: "thruplay", label: "Cost per video view (ThruPlay, ₹)", value: "0.11", decimals: "2" },
    { key: "socialViews", label: "Social views (lakhs)", value: "19.4", decimals: "1" },
    { key: "impressions", label: "Funnel: ad impressions", value: "202258", decimals: "0" },
    { key: "clicks", label: "Funnel: clicks to site", value: "2856", decimals: "0" },
    { key: "funnelLeads", label: "Funnel: leads generated", value: "375", decimals: "0" },
    { key: "qualified", label: "Funnel: qualified buyers", value: "96", decimals: "0" },
    { key: "visits", label: "Funnel: site visits booked", value: "28", decimals: "0" },
    { key: "ctr", label: "CTR % (calculated)", value: "={clicks}/{impressions}*100", decimals: "2" },
    { key: "clickToLead", label: "Click-to-lead % (calculated)", value: "={funnelLeads}/{clicks}*100", decimals: "1" },
    { key: "oneIn", label: "“1 in every N clicks became a lead” (calculated)", value: "=round({clicks}/{funnelLeads})", decimals: "0" },
    { key: "visitRate", label: "Qualified buyers who booked a visit % (calculated)", value: "={visits}/{qualified}*100", decimals: "0" },
  ],

  switches: {
    loader: true,
    bookCall: true,
    callFloat: true,
    whatsappFloat: true,
    heroSocial: true,
    saveContact: true,
    toasts: true,
    marquee: true,
    logoStrip: true,
    ticker: true,
    availability: true,
    cursorGlow: true,
    scrollHint: true,
    photo: true,
  },

  siteMode: "both",

  hire: {
    show: true,
    navLabel: "Hire me",
    status: "open",
    statusText: "Open to work · Pune / Remote",
    headerButton: true,
    heroButton: true,
    buttonText: "Hire Me",
    eyebrow: "Open to full-time roles",
    title: "Looking for a *performance marketer* for your team?",
    intro: "I plan the strategy, run Meta & Google Ads, design the creatives and report on what matters: **qualified leads at a lower cost**. Here's what you get if you hire me.",
    roles: ["Performance Marketing Manager", "Digital Marketing Manager", "Paid Media / Growth Marketer", "Meta & Google Ads Specialist"],
    facts: [
      { label: "Experience", value: "{years}+ years" },
      { label: "Work type", value: "Full-time · On-site / Hybrid / Remote" },
      { label: "Location", value: "Pune · Open to relocate" },
      { label: "Notice period", value: "Can discuss" },
    ],
    why: [
      { title: "Ads + creatives in one person", text: "Strategy, Meta & Google Ads, {creatives}+ creatives designed, and video editing, so your team moves faster." },
      { title: "Numbers you can check", text: "₹{budget}L+ budget managed, {leadsRounded}+ leads generated and best CPL of ₹{cpl}." },
      { title: "Works with sales", text: "I follow leads to qualified buyers and site visits, not just clicks." },
    ],
    resumeButton: "Download my resume",
    resumeLink: "",
    linkedinButton: true,
    formTitle: "Tell me about the role",
    jobTypes: ["Full-time", "Contract", "Freelance / project", "Part-time", "Internship"],
    submitText: "Send job details",
    successText: "Thank you! I'll get back to you within 24 hours.",
    pageTitle: "",
    ringText: "Open to work · Hire me · Let's grow together ·",
  },

  theme: {
    preset: "gold",
    bg: "#06080F", bg2: "#0A0F1F", accent: "#FFC83D", accent2: "#2F5BFF", text: "#EEF1F8", muted: "#9AA3B8",
    iconColor: "auto", iconCustom: "#111111", iconBg: "soft",
    headingFont: "Plus Jakarta Sans",
    bodyFont: "Manrope",
    corners: "rounded",
    buttons: "pill",
    spacing: "normal",
    textSize: "normal",
    animation: "full",
  },

  layout: {
    order: ["stats", "marquee", "about", "services", "process", "logoStrip", "results", "ticker", "saveCard", "experience", "skills", "custom", "contact"],
    photoSide: "right",
    navButton: "Book a Call",
  },

  hero: {
    badge: "Available for new projects · Pune, India",
    line1: "I turn ad spend into",
    words: ["qualified leads", "real sales", "higher ROAS", "loyal customers", "brand growth"],
    sub: "I'm **Shubham Gupta**, a performance & digital marketer who plans the strategy, runs the ads and designs the creatives, so your brand grows without juggling five freelancers.",
    ctaPrimary: "Book a Free Call",
    ctaSecondary: "See My Results",
    trust: ["Meta Ads", "Google Ads", "SEO", "AEO", "LLM Ads", "GA4", "GTM", "Creatives"],
    ringText: "AVAILABLE FOR PROJECTS • LET'S GROW TOGETHER • ",
    chips: [
      { icon: "▲", items: ["CTR {ctr}%", "CPM ₹{cpm}", "ROAS up"] },
      { icon: "◎", items: ["CPL ₹{cpl}", "{leadsRounded}+ leads", "{clickToLead}% conversion"] },
      { icon: "✦", items: ["{creatives}+ creatives"] },
    ],
  },

  stats: {
    show: true,
    items: [
      { prefix: "₹", value: "{budget}", suffix: "L+", label: "Ad budget managed" },
      { prefix: "", value: "{creatives}", suffix: "+", label: "Creatives designed" },
      { prefix: "", value: "{years}", suffix: "+", label: "Years of experience" },
      { prefix: "", value: "{leadsRounded}", suffix: "+", label: "Leads generated" },
    ],
  },

  marquee: {
    items: [
      "Meta Ads", "Google Ads", "SEO · GEO · AEO", "Lead Generation", "Social Media", "Graphic Design",
      "Video Editing", "Landing Pages", "LLM Ads", "GA4 · GTM", "WhatsApp Marketing",
    ],
  },

  about: {
    show: true,
    navLabel: "About",
    title: "A marketer who *also designs* and ~understands tech.~",
    paragraphs: [
      "For {years}+ years I've helped businesses across **real estate, EdTech, D2C, B2B and local retail** in India and the US turn their marketing budget into real enquiries. I've managed **₹{budget} lakh+ in ad spend**, designed **{creatives}+ creatives** and worked on **{projects}+ freelance projects**.",
      "What makes me different: I don't stop at running ads. I write the strategy, design the creative, edit the video, fix the landing page and set up the tracking.",
      "My approach is simple: I observe the market, run a competitive analysis and plan the strategy fast. Then I execute it properly, with the right message for the right people, in the right place at the right time.",
    ],
    pills: ["Strategy", "Budget Planning", "Paid Media", "Creative", "Tracking", "Conversion"],
  },

  services: {
    show: true,
    navLabel: "Services",
    title: "Everything you need to *grow online.*",
    items: [
      { icon: "meta", title: "Meta Ads", text: "Facebook & Instagram campaigns built for leads and sales, with audience research, creative testing, retargeting and weekly optimisation.", tag: "Lead gen · Sales · Retargeting", featured: false, badge: "", points: [] },
      { icon: "google", title: "Google Ads", text: "Search, Display and YouTube campaigns, built on Keyword Planner research, that catch people at the exact moment they're looking for what you sell.", tag: "Search · Display · YouTube", featured: false, badge: "", points: [] },
      { icon: "seo", title: "SEO, GEO & AEO", text: "Rank on Google and get recommended by AI. Classic SEO, plus GEO (Generative Engine Optimisation) and AEO (Answer Engine Optimisation) so AI tools and voice search pick your brand as the answer.", tag: "SEO · GEO · AEO · Google Business Profile", featured: false, badge: "", points: [] },
      { icon: "funnel", title: "Lead Generation & Funnels", text: "Landing pages, lead forms, Meta Pixel, GA4 & GTM tracking, CRO and CRM hand-off, so every lead reaches your sales team fast and gets qualified.", tag: "Funnels · Tracking · CRO", featured: false, badge: "", points: [] },
      { icon: "social", title: "Social Media Management", text: "Monthly content calendars, posting schedules and growth plans for Instagram, YouTube and Pinterest, plus WhatsApp marketing and community management.", tag: "Instagram · YouTube · Pinterest · WhatsApp", featured: false, badge: "", points: [] },
      { icon: "creative", title: "Creatives & Video", text: "Scroll-stopping ad creatives, reels, edits and motion graphics in Canva, Figma and CorelDRAW, plus DSLR shoots.", tag: "Design · Reels · Motion", featured: false, badge: "", points: [] },
      {
        icon: "ai", title: "LLM Ads",
        text: "More and more buyers now ask AI assistants what to buy and who to hire. I put your brand in front of them with sponsored placements inside AI chats and AI-powered search answers.",
        tag: "AI chat ads · AI search ads · Early-mover advantage", featured: true, badge: "New · 2026",
        points: [
          { title: "Sponsored AI answers", text: "Ads shown right inside AI chat conversations" },
          { title: "AI search ads", text: "Visibility in AI-powered search results" },
          { title: "Conversational creatives", text: "Ad copy written for how people ask AI" },
          { title: "Tracking & optimisation", text: "Measure leads from AI platforms and scale what works" },
        ],
      },
    ],
  },

  process: {
    show: true,
    navLabel: "",
    title: "A simple process that ~keeps you in control.~",
    steps: [
      { title: "Audit", text: "I study your business, competitors, current ads and website." },
      { title: "Strategy", text: "A clear plan: channels, budget split, audiences and targets." },
      { title: "Launch", text: "Creatives, landing pages, tracking and campaigns go live." },
      { title: "Optimise", text: "Daily checks, A/B tests and weekly reports you can understand." },
      { title: "Scale", text: "Double down on what works and grow the budget profitably." },
    ],
  },

  logos: {
    items: [
      { slug: "googleads", name: "Google Ads", initials: "GA", color: "#4285F4" },
      { slug: "meta", name: "Meta Ads", initials: "M", color: "#0866FF" },
      { slug: "googletagmanager", name: "Google Tag Manager", initials: "GTM", color: "#246FDB" },
      { slug: "googleanalytics", name: "Google Analytics 4", initials: "GA4", color: "#E37400" },
      { slug: "googlesearchconsole", name: "Search Console", initials: "SC", color: "#458CF5" },
      { slug: "googlemybusiness", name: "Google Business Profile", initials: "GB", color: "#4285F4" },
      { slug: "hubspot", name: "HubSpot", initials: "HS", color: "#FF7A59" },
      { slug: "semrush", name: "Semrush", initials: "SR", color: "#FF642D" },
      { slug: "looker", name: "Looker Studio", initials: "LS", color: "#4285F4" },
      { slug: "canva", name: "Canva", initials: "C", color: "#00C4CC" },
      { slug: "microsoftexcel", name: "Excel", initials: "X", color: "#217346" },
      { slug: "googlesheets", name: "Google Sheets", initials: "GS", color: "#34A853" },
      { slug: "whatsapp", name: "WhatsApp", initials: "W", color: "#25D366" },
      { slug: "youtube", name: "YouTube", initials: "YT", color: "#FF0000" },
      { slug: "pinterest", name: "Pinterest", initials: "P", color: "#E60023" },
    ],
  },

  results: {
    show: true,
    navLabel: "Results",
    title: "Numbers that *speak for themselves.*",
    subtitle: "Real results from the ad accounts I've managed, grouped by industry.",
    totalLabel: "Total ad budget managed",
    industries: [
      {
        tab: "🏢 Real Estate", budgetLakh: "9", leads: "{reLeads}", budgetNote: "Residential projects · Pune",
        kpis: [
          { prefix: "", value: "{reLeads}", suffix: "+", label: "Home-buyer leads" },
          { prefix: "₹", value: "{cpl}", suffix: "", label: "Best cost per lead" },
          { prefix: "", value: "{ctr}", suffix: "%", label: "CTR across Meta & Google" },
          { prefix: "₹", value: "3.60", suffix: "", label: "Best CPM" },
          { prefix: "", value: "15", suffix: "L+", label: "Ad impressions" },
          { prefix: "", value: "{socialViews}", suffix: "L", label: "Social views" },
        ],
        rightTitle: "Lead funnel in just 3 weeks",
        funnel: [
          { label: "Ad impressions", value: "{impressions}", rateLabel: "CTR" },
          { label: "Clicks to site", value: "{clicks}", rateLabel: "became leads" },
          { label: "Leads generated", value: "{funnelLeads}", rateLabel: "qualified" },
          { label: "Qualified buyers", value: "{qualified}", rateLabel: "booked a visit" },
          { label: "Site visits booked", value: "{visits}", rateLabel: "" },
        ],
        bars: [],
        points: [
          { title: "{clickToLead}% click-to-lead rate.", text: "Roughly 1 in every {oneIn} visitors who clicked became a lead." },
          { title: "{visitRate}% of qualified buyers visited the site.", text: "{qualified} qualified buyers and {visits} site visits booked in just 3 weeks." },
          { title: "Smarter audiences, cheaper leads.", text: "Retargeting warm custom audiences cut cost per lead to ₹{cpl}." },
          { title: "Brand recall at scale.", text: "7L+ people reached at under ₹4 per 1,000 impressions." },
        ],
        ctaText: "",
      },
      {
        tab: "🎓 EdTech", budgetLakh: "4", leads: "{edLeads}", budgetNote: "Coaching & academies · 48+ campaigns",
        kpis: [
          { prefix: "", value: "{edLeads}", suffix: "+", label: "Leads generated" },
          { prefix: "₹", value: "{hiringCpl}", suffix: "", label: "Best cost per lead" },
          { prefix: "₹", value: "{cpm}", suffix: "", label: "CPM on result posts" },
          { prefix: "", value: "1.25", suffix: "%", label: "Link CTR on top reel" },
          { prefix: "₹", value: "{thruplay}", suffix: "", label: "Per video ThruPlay" },
          { prefix: "", value: "19.2", suffix: "L", label: "Ad impressions" },
        ],
        rightTitle: "Best cost per result",
        funnel: [],
        bars: [
          { label: "Video view (ThruPlay)", value: "₹{thruplay}" },
          { label: "Link click on reel", value: "₹0.76" },
          { label: "Hiring lead", value: "₹{hiringCpl}" },
          { label: "Avg hiring lead", value: "₹3.92" },
          { label: "Event page visit", value: "₹4.56" },
        ],
        points: [
          { title: "Hiring for pennies.", text: "373 faculty applications at ₹3.92 each, far cheaper than job portals." },
          { title: "Results that travel.", text: "Result and admission posts got a total reach of 6.77L for about ₹1,800." },
          { title: "Course enquiries.", text: "Lead and call campaigns brought 62 course enquiries at ₹66.52 each." },
        ],
        ctaText: "",
      },
      {
        tab: "🛍️ D2C, Retail & B2B", budgetLakh: "2", leads: "", budgetNote: "Local shops, D2C, hospitality & US B2B",
        kpis: [
          { prefix: "", value: "{projects}", suffix: "+", label: "Freelance projects" },
          { prefix: "🇮🇳 🇺🇸", value: "", suffix: "", label: "Clients in India & USA" },
          { prefix: "", value: "{creatives}", suffix: "+", label: "Creatives designed" },
        ],
        rightTitle: "What I delivered",
        funnel: [],
        bars: [],
        points: [
          { title: "Lower cost per lead.", text: "Meta campaigns optimised for ROAS and CPL for a US-based B2B client." },
          { title: "Footfall & WhatsApp enquiries.", text: "Offer creatives and click-to-WhatsApp ads for local shops." },
          { title: "Always-on content.", text: "Monthly content calendars, reels and posting schedules that keep brands visible." },
          { title: "Tracking you can trust.", text: "Lead tracking, automation and weekly reports with clear next steps." },
        ],
        ctaText: "Get numbers for your industry →",
      },
    ],
    industriesList: ["Real Estate", "EdTech", "D2C", "B2B", "Local Business", "Hospitality", "Recruitment"],
  },

  ticker: {
    items: [
      { bold: "{reLeads}+", text: "real estate leads" },
      { bold: "{ctr}%", text: "CTR" },
      { bold: "₹{cpl}", text: "best CPL" },
      { bold: "{clickToLead}%", text: "click-to-lead rate" },
      { bold: "{visits}", text: "site visits in 3 weeks" },
      { bold: "₹{cpm}", text: "CPM" },
      { bold: "{edLeads}+", text: "EdTech leads" },
      { bold: "₹{thruplay}", text: "per ThruPlay" },
      { bold: "{socialViews}L", text: "social views" },
    ],
  },

  saveCard: {
    show: true,
    title: "Save my number for later",
    text: "Not ready to talk yet? Add me to your contacts in one tap. My name and number fill in automatically.",
    button: "Save to Contacts",
  },

  customSections: [],

  experience: {
    show: true,
    navLabel: "Experience",
    title: "{years}+ years, ~{companies} companies,~ one focus: results.",
    display: {
      dateStyle: "monthYear", durationStyle: "short", countMode: "worked", yearsRounding: "floor",
      presentWord: "Present", currentBadge: false, totalBadge: false, totalLabel: "Total experience", sort: "asListed",
    },
    items: [
      { date: "2026 – Present", current: true, role: "Marketing Executive", company: "Runal Group, Pune", text: "I run the marketing end to end, from scratch: budget planning, strategy and funnel planning, Meta Ads (primary) and Google Ads, SEO, AEO and GEO, content and creative production, website improvements and CRO. I also work with the sales team to get leads qualified." },
      { date: "2025 – 2026", role: "Technical & Digital Media Head", company: "Cognitio Academy, Gwalior", text: "Drove admissions through lead generation on Meta and Google Ads, owning strategy, SEO, content and creatives. Shot and edited YouTube videos, podcasts and promo content on DSLR, and led a team of designers, editors and developers." },
      { date: "2025", role: "Media Manager", company: "EzyHires, USA (Remote)", text: "Performance campaigns, social media strategy, ROAS & CPL optimisation, lead tracking, automation and weekly reporting." },
      { date: "2023 – 2024", role: "Digital Marketing Executive", company: "Choice PG, Pune (Remote)", text: "Lead-acquisition campaigns, competitor research, and website & branding improvements." },
      { date: "2022 – 2024", role: "Digital Marketing Executive & Graphic Designer", company: "Chemistry Zone, Gwalior", text: "Ad campaigns, creatives in Canva, CorelDRAW & Figma, promo videos and Google Analytics tracking." },
    ],
  },

  skills: {
    show: true,
    navLabel: "",
    toolsTitle: "Tools I use *every day.*",
    tools: ["Meta Ads Manager", "Google Ads", "Google Keyword Planner", "Google Analytics (GA4)", "Google Tag Manager", "Search Console", "Looker Studio", "SEMrush / Ahrefs", "Google Business Profile", "HubSpot", "Canva", "Figma", "CorelDRAW", "MS Office / Excel"],
    skillsTitle: "Skills *I bring.*",
    skills: [
      { icon: "📈", name: "Meta Pixel Setup & Tracking" }, { icon: "🤝", name: "CRM Management" }, { icon: "✨", name: "LLM Ads" },
      { icon: "🧠", name: "AI Tools & Prompting" }, { icon: "🎯", name: "CRO" }, { icon: "▶️", name: "YouTube Marketing" },
      { icon: "📌", name: "Pinterest Marketing" }, { icon: "💬", name: "WhatsApp Marketing" }, { icon: "🎬", name: "Video Editing" },
      { icon: "📷", name: "DSLR Handling & Guidance" }, { icon: "🧩", name: "HTML" }, { icon: "📊", name: "Reporting" },
    ],
    certTitle: "Certifications",
    certs: [
      "Data Manipulation in Python (NumPy & Pandas) · Udemy",
      "TCS iON Career Edge · Young Professional",
      "Python & Django · Universal Informatics",
      "CSS Complete Course · Internet & Web Development · Udemy",
    ],
    eduTitle: "Education",
    education: [
      "**AI-Powered Performance & Digital Marketing** · WsCube Tech",
      "Bachelor of Computer Application (BCA) · Prestige Institute of Management & Research · 2020–23",
    ],
  },

  contactSection: {
    show: true,
    navLabel: "Contact",
    title: "Ready to get *more leads?*",
    text: "Tell me about your business and goals. I'll reply within 24 hours with honest ideas on what will work for you. The first call is free.",
    formTitle: "Get a free strategy call",
    hintTitle: "Book your free strategy call",
    hintText: "Fill in your details and register. I'll call you back within 24 hours.",
    services: ["Meta Ads", "Google Ads", "SEO / GEO / AEO", "Lead Generation", "Social Media Management", "Creatives & Video", "LLM Ads", "Full Digital Marketing"],
    budgets: ["Under ₹25,000", "₹25,000 – ₹1 lakh", "₹1 – 3 lakh", "₹3 lakh+", "Not sure yet"],
    submitText: "Send Message",
    successText: "Thank you! You're registered. I'll call you back within 24 hours.",
  },

  toasts: {
    items: [
      { tag: "Real Estate", title: "{visits} site visits booked", text: "{visitRate}% of qualified buyers visited in 3 weeks" },
      { tag: "Real Estate", title: "{clickToLead}% click-to-lead rate", text: "{clicks} clicks turned into {funnelLeads} leads" },
      { tag: "EdTech", title: "Lead at ₹{hiringCpl}", text: "373 hiring leads at an average of ₹3.92" },
      { tag: "Real Estate", title: "Cost per lead ₹{cpl}", text: "Retargeting warm custom audiences" },
      { tag: "EdTech", title: "CPM just ₹{cpm}", text: "6.77L total reach on result posts" },
      { tag: "Real Estate", title: "{qualified} qualified buyers", text: "From {impressions} impressions at {ctr}% CTR" },
      { tag: "EdTech", title: "₹{thruplay} per video view", text: "16.6K full video plays" },
      { tag: "All industries", title: "₹{budget}L+ budget managed", text: "{leadsRounded}+ leads generated so far" },
    ],
  },

  footer: {
    text: "Shubham Gupta · Performance & Digital Marketing",
    saveText: "Save my number directly in your contacts",
  },
};
