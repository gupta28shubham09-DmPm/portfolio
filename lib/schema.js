// Describes every editable field. Used by the admin panel (to build the forms)
// and by the server (to clean and validate whatever gets saved).
const T = (label, extra = {}) => ({ t: "text", label, ...extra });
const A = (label, extra = {}) => ({ t: "textarea", label, ...extra });
const N = (label, extra = {}) => ({ t: "num", label, ...extra });
const B = (label, extra = {}) => ({ t: "toggle", label, ...extra });
const G = (fields, extra = {}) => ({ t: "group", fields, ...extra });
const L = (label, of, extra = {}) => ({ t: "list", label, of, max: 60, ...extra });

const FMT = "Formatting: *yellow* · ~blue~ · **bold** · numbers: {years} {experience} {budget} {leads} or any key number";
const NAV_HELP = "Leave empty to keep this section out of the top menu.";
const { PRESETS, HEADING_FONTS, BODY_FONTS } = require("./theme");
const opt = (o) => Object.keys(o).map((k) => [k, k]);

const SECTIONS = [
  ["stats", "Top numbers"], ["marquee", "Moving skills strip"], ["about", "About"], ["services", "Services"],
  ["process", "How I work"], ["logoStrip", "Tools logo strip"], ["results", "Results"], ["ticker", "Yellow results strip"],
  ["saveCard", "“Save my number” card"], ["experience", "Experience"], ["hire", "Hire me"], ["skills", "Tools, skills & education"],
  ["custom", "Your own sections"], ["contact", "Contact & form"],
];
const number = (label) =>
  G({ prefix: T("Before the number", { max: 20 }), value: N("Number or {tag} (leave empty to show text only)"), suffix: T("After the number", { max: 20 }), label: T(label) }, { title: "label" });

const ICONS = [
  ["meta", "∞ Meta / loop"], ["google", "▲ Google / mountain"], ["seo", "🔍 Search"], ["funnel", "⏷ Funnel"],
  ["social", "◎ Social / camera"], ["creative", "✎ Creative / pen"], ["ai", "✦ AI sparkle"], ["chart", "📈 Chart"],
  ["video", "▶ Video"], ["mail", "✉ Email"], ["star", "★ Star"], ["target", "◎ Target"],
];

const schema = G({
  switches: G({
    loader: B("Opening loading animation"),
    bookCall: B("“Book a Call” buttons"),
    callFloat: B("Floating “Call Now” button"),
    whatsappFloat: B("Floating WhatsApp button"),
    heroSocial: B("Round contact icons under the main buttons"),
    saveContact: B("“Save my number” buttons"),
    toasts: B("Result pop-ups (bottom-left)"),
    marquee: B("Moving skills strip (top)"),
    logoStrip: B("Moving tools logo strip"),
    ticker: B("Moving yellow results strip"),
    availability: B("“Available for new projects” badge"),
    cursorGlow: B("Glow following the mouse"),
    scrollHint: B("Scroll-down arrow on the top section"),
    photo: B("Your photo on the top section"),
  }, { label: "On / off switches" }),

  numbers: L("Key numbers", G({
    key: T("Tag name (letters/numbers, e.g. cpl)", { max: 31, pattern: "key" }),
    label: T("What it is"),
    value: T("Number, or a formula starting with = (e.g. ={clicks}/{impressions}*100)", { max: 200, pattern: "numformula" }),
    decimals: { t: "select", label: "Decimals shown", options: [["auto", "Auto"], ["0", "0 (e.g. 506)"], ["1", "1 (e.g. 13.1)"], ["2", "2 (e.g. 97.71)"]] },
  }, { title: "key" }), { max: 60, label: "Key numbers" }),

  theme: G({
    preset: { t: "select", label: "Colour theme", options: [...Object.entries(PRESETS).map(([k, v]) => [k, v.label]), ["custom", "Custom (use my colours below)"]],
      help: "Pick a ready-made theme, or change any colour below to make your own." },
    bg: { t: "color", label: "Background" },
    bg2: { t: "color", label: "Second background (cards, menu)" },
    accent: { t: "color", label: "Main accent (buttons, highlights)" },
    accent2: { t: "color", label: "Second accent (icons, glows)" },
    text: { t: "color", label: "Text" },
    muted: { t: "color", label: "Soft text (descriptions)" },
    iconColor: { t: "select", label: "Icon colour (LinkedIn, WhatsApp, email, call icons and the tools strip)", options: [
      ["auto", "Automatic (same as text)"], ["black", "Black"], ["white", "White"], ["accent", "Main accent colour"], ["accent2", "Second accent colour"], ["custom", "My own colour (pick below)"]] },
    iconCustom: { t: "color", label: "My own icon colour", help: "Used when Icon colour is set to “My own colour”." },
    iconBg: { t: "select", label: "Circle behind the icons", options: [
      ["soft", "See-through (original)"], ["white", "White"], ["black", "Black"], ["accent", "Main accent colour"], ["none", "No circle"]] },
    headingFont: { t: "select", label: "Heading font", options: opt(HEADING_FONTS) },
    bodyFont: { t: "select", label: "Body text font", options: opt(BODY_FONTS) },
    corners: { t: "select", label: "Corner style", options: [["rounded", "Rounded (original)"], ["soft", "Soft"], ["sharp", "Sharp / square"]] },
    buttons: { t: "select", label: "Button shape", options: [["pill", "Pill (original)"], ["rounded", "Rounded"], ["square", "Square"]] },
    spacing: { t: "select", label: "Space between sections", options: [["normal", "Normal"], ["compact", "Compact"], ["spacious", "Spacious"]] },
    textSize: { t: "select", label: "Text size", options: [["normal", "Normal"], ["small", "Small"], ["large", "Large"]] },
    animation: { t: "select", label: "Animations", options: [["full", "Full (all effects)"], ["calm", "Calm (no tilt, magnet or mouse glow)"], ["off", "Off (no movement)"]] },
  }, { label: "Colours & style" }),

  siteMode: { t: "select", label: "Website mode", options: [
    ["business", "Business — for clients", "“Book a Call” everywhere. The Hire me section and buttons are hidden."],
    ["portfolio", "Portfolio — for jobs", "“Hire Me” becomes the main button. Your job-search status shows at the top."],
    ["both", "Both", "Clients can book a call and companies can hire you."]] },

  hire: G({
    show: B("Show the Hire me section"),
    navLabel: T("Menu name", { max: 20, help: NAV_HELP }),
    status: { t: "select", label: "Job-search status", options: [["open", "Open to work — actively looking"], ["selective", "Open to the right offer"], ["freelance", "Freelance / contract only"], ["closed", "Not looking right now"]] },
    statusText: T("Status badge text", { max: 60, help: "Shown at the top of your website in Portfolio mode, e.g. “Open to work · Pune / Remote”." }),
    headerButton: B("Show a “Hire Me” button in the top menu"),
    heroButton: B("Show a “Hire Me” button in the top section"),
    buttonText: T("Hire button text", { max: 30 }),
    eyebrow: T("Small label above the heading", { max: 60 }),
    title: T("Heading", { help: FMT }),
    intro: A("Intro text", { help: FMT }),
    roles: L("Roles I'm looking for", T("Role", { max: 60 }), { max: 10 }),
    facts: L("Quick facts", G({ label: T("Label", { max: 30 }), value: T("Value", { max: 80, help: FMT }) }, { title: "label" }), { max: 8 }),
    why: L("Why hire me", G({ title: T("Point", { max: 80, help: FMT }), text: T("Detail", { max: 200, help: FMT }) }, { title: "title" }), { max: 6 }),
    resumeButton: T("Resume button text (empty = hide)", { max: 40 }),
    resumeLink: { t: "url", label: "Resume link (optional)", help: "Google Drive / Dropbox link. Leave empty to use the PDF you upload below." },
    linkedinButton: B("Show a LinkedIn button"),
    formTitle: T("Form heading", { max: 80 }),
    jobTypes: L("Job types in the form", T("Job type", { max: 40 }), { max: 10 }),
    submitText: T("Form button text", { max: 40 }),
    successText: T("Message after sending", { max: 160 }),
    pageTitle: T("Browser tab title in Portfolio mode (optional)", { max: 160 }),
    ringText: T("Spinning text around your photo in Portfolio mode (optional)", { max: 70 }),
  }, { label: "Hire me" }),

  layout: G({
    order: { t: "order", label: "Section order (top to bottom, after the top section)", options: SECTIONS },
    photoSide: { t: "select", label: "Photo position on desktop", options: [["right", "Right (original)"], ["left", "Left"]] },
    navButton: T("Top-right menu button text", { max: 30 }),
  }, { label: "Layout" }),

  site: G({
    title: T("Browser tab title", { max: 160 }),
    description: A("Google search description", { max: 320 }),
    ogTitle: T("Title when the link is shared (WhatsApp, LinkedIn)", { max: 160 }),
    ogDescription: A("Description when the link is shared", { max: 320 }),
  }, { label: "Google & sharing" }),

  brand: G({ first: T("Logo first word (white)", { max: 30 }), second: T("Logo second word (yellow)", { max: 30 }) }, { label: "Logo" }),

  contact: G({
    name: T("Your name"),
    phone: T("Phone for calling (with country code, e.g. +917692058084)", { max: 20, pattern: "phone" }),
    phoneDisplay: T("Phone as shown on the site"),
    whatsapp: T("WhatsApp number (digits only, e.g. 917692058084)", { max: 20, pattern: "digits" }),
    whatsappMessage: A("Ready-made WhatsApp message", { max: 300 }),
    email: T("Email", { pattern: "email" }),
    linkedin: { t: "url", label: "LinkedIn link" },
    linkedinLabel: T("LinkedIn name shown"),
    company: T("Company (saved in their contacts)"),
    jobTitle: T("Job title (saved in their contacts)"),
  }, { label: "Contact details", help: "Changes here update every button, link and the “Save my number” card." }),

  hero: G({
    badge: T("Availability badge"),
    line1: T("Headline first line"),
    words: L("Rotating words in the headline", T("Word or phrase", { max: 40 }), { max: 12 }),
    sub: A("Intro line under the headline", { help: FMT }),
    ctaPrimary: T("Yellow button text", { max: 40 }),
    ctaSecondary: T("Second button text", { max: 40 }),
    trust: L("Short words under the buttons", T("Word", { max: 30 }), { max: 14 }),
    ringText: T("Spinning text around your photo", { max: 70 }),
    chips: L("Floating chips on your photo", G({ icon: T("Icon / emoji", { max: 4 }), items: L("Texts it cycles through", T("Text", { max: 30 }), { max: 6 }) }, { title: "icon" }), { max: 4 }),
  }, { label: "Top section (hero)" }),

  stats: G({ show: B("Show this section"), items: L("Number boxes", number("Label under the number"), { max: 8 }) }, { label: "Top numbers" }),

  marquee: G({ items: L("Words in the moving strip", T("Word", { max: 40 }), { max: 30 }) }, { label: "Moving skills strip" }),

  about: G({
    show: B("Show this section"), navLabel: T("Menu name", { max: 20, help: NAV_HELP }),
    title: T("Heading", { help: FMT }),
    paragraphs: L("Paragraphs", A("Paragraph", { help: FMT }), { max: 8 }),
    pills: L("Small tags", T("Tag", { max: 30 }), { max: 14 }),
  }, { label: "About" }),

  services: G({
    show: B("Show this section"), navLabel: T("Menu name", { max: 20, help: NAV_HELP }),
    title: T("Heading", { help: FMT }),
    items: L("Service cards", G({
      icon: { t: "select", label: "Icon", options: ICONS },
      title: T("Title"), text: A("Description"), tag: T("Small line at the bottom"),
      featured: B("Big highlighted card (full width)"), badge: T("Corner badge (e.g. New · 2026)", { max: 30 }),
      points: L("Points (only on big cards)", G({ title: T("Point title"), text: T("Point text") }, { title: "title" }), { max: 8 }),
    }, { title: "title" }), { max: 16 }),
  }, { label: "Services" }),

  process: G({
    show: B("Show this section"), navLabel: T("Menu name", { max: 20, help: NAV_HELP }), title: T("Heading", { help: FMT }),
    steps: L("Steps", G({ title: T("Step name"), text: A("Step text") }, { title: "title" }), { max: 8 }),
  }, { label: "How I work" }),

  logos: G({
    items: L("Tools in the logo strip", G({
      name: T("Tool name"), slug: { t: "slug", label: "Logo code from simpleicons.org (e.g. googleads)" },
      initials: T("Badge letters if no logo", { max: 4 }), color: { t: "color", label: "Badge colour" },
    }, { title: "name" }), { max: 30 }),
  }, { label: "Tools logo strip" }),

  results: G({
    show: B("Show this section"), navLabel: T("Menu name", { max: 20, help: NAV_HELP }),
    title: T("Heading", { help: FMT }), subtitle: T("Line under the heading"),
    totalLabel: T("Total budget label (the total is added up automatically)"),
    industries: L("Industry tabs", G({
      tab: T("Tab name (emoji allowed)"),
      budgetLakh: N("Budget managed, in lakhs (e.g. 9) — the total and the bar are calculated from this"),
      leads: N("Leads generated (number or {tag}) — added into {leads}"),
      budgetNote: T("Note under the budget"),
      kpis: L("Number boxes", number("Label"), { max: 9 }),
      rightTitle: T("Right side heading"),
      funnel: L("Funnel rows (top to bottom) — the % between rows is calculated for you", G({ label: T("Row name"), value: N("Number or {tag}"), rateLabel: T("Words after the % to the next row (e.g. CTR, became leads)") }, { title: "label" }), { max: 8 }),
      bars: L("Bars (widths are calculated automatically)", G({ label: T("Bar name"), value: T("Value (e.g. ₹0.76)") }, { title: "label" }), { max: 10 }),
      points: L("Highlight points", G({ title: T("Bold title"), text: A("Text") }, { title: "title" }), { max: 8 }),
      ctaText: T("Button text (leave empty for no button)"),
    }, { title: "tab" }), { max: 8 }),
    industriesList: L("“Industries:” tags", T("Industry", { max: 30 }), { max: 16 }),
  }, { label: "Results" }),

  ticker: G({ items: L("Items in the yellow strip", G({ bold: T("Big number", { max: 20 }), text: T("Text", { max: 50 }) }, { title: "bold" }), { max: 20 }) }, { label: "Yellow results strip" }),

  saveCard: G({ show: B("Show this card"), title: T("Title"), text: A("Text"), button: T("Button text", { max: 40 }) }, { label: "“Save my number” card" }),

  customSections: L("Your own sections (shown before Contact)", G({
    show: B("Show this section"),
    inNav: B("Add to the top menu"), navLabel: T("Menu name", { max: 20, help: NAV_HELP }),
    title: T("Heading", { help: FMT }), text: A("Text under the heading", { help: FMT }),
    cards: L("Boxes", G({ icon: T("Emoji / icon", { max: 4 }), title: T("Title"), text: A("Text", { help: FMT }) }, { title: "title" }), { max: 12 }),
    buttonText: T("Button text (leave empty for none)", { max: 40 }),
    buttonLink: T("Button link (e.g. #contact or https://…)", { max: 300, pattern: "link" }),
  }, { title: "title" }), { max: 10, label: "Your own sections" }),

  experience: G({
    show: B("Show this section"), navLabel: T("Menu name", { max: 20, help: NAV_HELP }),
    title: T("Heading", { help: FMT }),
    display: G({
      dateStyle: { t: "select", label: "How job dates show on the website", options: [
        ["monthYear", "Month & year"], ["years", "Years only"], ["duration", "Duration only"],
        ["datesDuration", "Dates + duration"], ["yearsDuration", "Years + duration"],
        ["since", "Since …", "Current job shows “Since Mar 2023”, others show years"],
        ["durationSince", "Since … + duration", "Current job “Since Mar 2023 · 11 mos”, others years + duration"],
        ["asTyped", "My own text", "Each job's “Custom date text” (More options)"],
        ["hidden", "Hide dates", "Only role, company and work are shown"],
      ] },
      durationStyle: { t: "select", label: "Duration style (job durations and {experience})", options: [
        ["short", "2 yrs 11 mos"], ["long", "2 years 11 months"], ["compact", "2y 11m"],
        ["decimal", "2.9 yrs"], ["decimalLong", "2.9 years"], ["rounded", "3 yrs (rounded)"], ["roundedLong", "3 years (rounded)"], ["plus", "2+ years"],
      ] },
      countMode: { t: "select", label: "How your years of experience are counted", options: [
        ["worked", "Only the time I worked", "Gaps are skipped, overlapping jobs counted once"],
        ["span", "From my first job until today", "Includes any gaps"],
      ] },
      yearsRounding: { t: "select", label: "{years} number on the website", options: [
        ["floor", "Rounded down", "4 yrs 11 mos → 4"], ["nearest", "Nearest whole year", "4 yrs 7 mos → 5"],
        ["half", "Half years", "4 yrs 7 mos → 4.5"], ["one", "One decimal", "4 yrs 11 mos → 4.9"],
      ] },
      presentWord: T("Word for a current job", { max: 20, help: "e.g. Present, Now, Till date" }),
      currentBadge: B("Show a “Current” badge on your current job"),
      totalBadge: B("Show total experience under the heading"),
      totalLabel: T("Total experience label", { max: 40, help: "Shown before the total, e.g. Total experience" }),
      sort: { t: "select", label: "Job order", options: [["asListed", "As I listed them", "Use ↑ ↓ on the jobs to change it"], ["newest", "Newest first", "Sorted by date"], ["oldest", "Oldest first", "Sorted by date"]] },
    }, { label: "How experience is shown" }),
    items: L("Jobs", G({
      role: T("Role / job title"), company: T("Company & city"),
      start: { t: "month", label: "Started" }, end: { t: "month", label: "Ended" },
      current: B("I currently work here"),
      text: A("What you did"),
      date: T("Custom date text (optional)", { max: 60, help: "Only used when dates are set to “My own text”. Also used for counting if no months are picked above." }),
      dateStyle: { t: "select", label: "Date style for this job only", options: [["main", "Same as the main setting"], ["monthYear", "Month & year"], ["years", "Years only"], ["duration", "Duration only"], ["datesDuration", "Dates + duration"], ["yearsDuration", "Years + duration"], ["since", "Since …"], ["asTyped", "My own text"], ["hidden", "Hide dates"]] },
      skip: B("Don't count this in my years of experience (e.g. a course or internship)"),
      hide: B("Hide this job on the website (still counted unless the switch above is on)"),
    }, { title: "role", layout: "job" }), { max: 20 }),
  }, { label: "Experience" }),

  skills: G({
    show: B("Show this section"), navLabel: T("Menu name", { max: 20, help: NAV_HELP }),
    toolsTitle: T("Tools heading", { help: FMT }), tools: L("Tools", T("Tool", { max: 50 }), { max: 40 }),
    skillsTitle: T("Skills heading", { help: FMT }), skills: L("Skills", G({ icon: T("Emoji", { max: 4 }), name: T("Skill", { max: 50 }) }, { title: "name" }), { max: 40 }),
    certTitle: T("Certifications heading"), certs: L("Certifications", T("Certification", { help: FMT }), { max: 20 }),
    eduTitle: T("Education heading"), education: L("Education", T("Degree / course", { help: FMT }), { max: 10 }),
  }, { label: "Tools, skills & education" }),

  contactSection: G({
    show: B("Show this section"), navLabel: T("Menu name", { max: 20, help: NAV_HELP }),
    title: T("Heading", { help: FMT }), text: A("Text"),
    formTitle: T("Form title"), hintTitle: T("Pop-up hint title"), hintText: T("Pop-up hint text"),
    services: L("“I need help with” options", T("Option", { max: 60 }), { max: 20 }),
    budgets: L("Budget options", T("Option", { max: 60 }), { max: 12 }),
    submitText: T("Submit button text", { max: 40 }), successText: T("Message after sending"),
  }, { label: "Contact & form" }),

  toasts: G({ items: L("Pop-up messages", G({ tag: T("Industry tag", { max: 30 }), title: T("Big text", { max: 60 }), text: T("Small text", { max: 90 }) }, { title: "title" }), { max: 20 }) }, { label: "Result pop-ups" }),

  footer: G({ text: T("Footer text"), saveText: T("Footer “save number” button text") }, { label: "Footer" }),
});

const tabs = [
  { id: "numbers", label: "Key numbers", icon: "🔢", keys: ["numbers"] },
  { id: "switches", label: "Switches", icon: "⏻", keys: ["switches"] },
  { id: "design", label: "Design & layout", icon: "🎨", keys: ["theme", "layout"] },
  { id: "contact", label: "Contact & brand", icon: "☎", keys: ["contact", "brand", "site"] },
  { id: "hero", label: "Top section", icon: "★", keys: ["hero", "stats", "marquee"] },
  { id: "about", label: "About & services", icon: "✎", keys: ["about", "services", "process"] },
  { id: "results", label: "Results & numbers", icon: "📈", keys: ["results", "ticker", "toasts"] },
  { id: "experience", label: "Experience & skills", icon: "🎓", keys: ["experience", "skills", "logos"] },
  { id: "hire", label: "Hire me & website mode", icon: "💼", keys: ["siteMode", "hire"] },
  { id: "more", label: "Contact form & more", icon: "＋", keys: ["contactSection", "saveCard", "customSections", "footer"] },
];

// Template for a brand-new list item (used by the panel's "Add" button and by validation)
function blank(node) {
  if (node.t === "group") { const o = {}; for (const k in node.fields) o[k] = blank(node.fields[k]); return o; }
  if (node.t === "list") return [];
  if (node.t === "toggle") return node.label === "Show this section" || node.label === "Show this card";
  if (node.t === "select") return node.options[0][0];
  if (node.t === "order") return node.options.map((o) => o[0]);
  if (node.t === "color") return "#2F5BFF";
  return "";
}

module.exports = { schema, tabs, blank, SECTIONS };
