// One-time upgrade for content saved before "Key numbers" existed.
// A text that is still exactly the old original is switched to its new auto-calculated version
// (e.g. "15" → "{budget}"). Anything you had edited yourself is left as it is.
const MAP = {
 "site.ogDescription": [
  "₹15L+ ad budget managed · 500+ creatives · 4+ years. Let's grow your leads.",
  "₹{budget}L+ ad budget managed · {creatives}+ creatives · {years}+ years. Let's grow your leads."
 ],
 "hero.chips.0.items.0": [
  "CTR 1.41%",
  "CTR {ctr}%"
 ],
 "hero.chips.0.items.1": [
  "CPM ₹2.49",
  "CPM ₹{cpm}"
 ],
 "hero.chips.1.items.0": [
  "CPL ₹97.71",
  "CPL ₹{cpl}"
 ],
 "hero.chips.1.items.1": [
  "900+ leads",
  "{leadsRounded}+ leads"
 ],
 "hero.chips.1.items.2": [
  "13.1% conversion",
  "{clickToLead}% conversion"
 ],
 "hero.chips.2.items.0": [
  "500+ creatives",
  "{creatives}+ creatives"
 ],
 "stats.items.0.value": [
  "15",
  "{budget}"
 ],
 "stats.items.1.value": [
  "500",
  "{creatives}"
 ],
 "stats.items.2.value": [
  "4",
  "{years}"
 ],
 "stats.items.3.value": [
  "900",
  "{leadsRounded}"
 ],
 "about.paragraphs.0": [
  "For 4+ years I've helped businesses across **real estate, EdTech, D2C, B2B and local retail** in India and the US turn their marketing budget into real enquiries. I've managed **₹15 lakh+ in ad spend**, designed **500+ creatives** and worked on **10+ freelance projects**.",
  "For {years}+ years I've helped businesses across **real estate, EdTech, D2C, B2B and local retail** in India and the US turn their marketing budget into real enquiries. I've managed **₹{budget} lakh+ in ad spend**, designed **{creatives}+ creatives** and worked on **{projects}+ freelance projects**."
 ],
 "results.industries.0.kpis.0.value": [
  "506",
  "{reLeads}"
 ],
 "results.industries.0.kpis.1.value": [
  "97.71",
  "{cpl}"
 ],
 "results.industries.0.kpis.2.value": [
  "1.41",
  "{ctr}"
 ],
 "results.industries.0.kpis.5.value": [
  "19.4",
  "{socialViews}"
 ],
 "results.industries.0.funnel.0.value": [
  "2,02,258",
  "{impressions}"
 ],
 "results.industries.0.funnel.1.value": [
  "2,856",
  "{clicks}"
 ],
 "results.industries.0.funnel.2.value": [
  "375",
  "{funnelLeads}"
 ],
 "results.industries.0.funnel.3.value": [
  "96",
  "{qualified}"
 ],
 "results.industries.0.funnel.4.value": [
  "28",
  "{visits}"
 ],
 "results.industries.0.points.0.title": [
  "13.1% click-to-lead rate.",
  "{clickToLead}% click-to-lead rate."
 ],
 "results.industries.0.points.0.text": [
  "Roughly 1 in every 8 visitors who clicked became a lead.",
  "Roughly 1 in every {oneIn} visitors who clicked became a lead."
 ],
 "results.industries.0.points.1.title": [
  "Nearly 1 in 3 qualified buyers visited the site.",
  "{visitRate}% of qualified buyers visited the site."
 ],
 "results.industries.0.points.1.text": [
  "96 qualified buyers and 28 site visits booked in just 3 weeks.",
  "{qualified} qualified buyers and {visits} site visits booked in just 3 weeks."
 ],
 "results.industries.0.points.2.text": [
  "Retargeting warm custom audiences cut cost per lead to ₹97.71.",
  "Retargeting warm custom audiences cut cost per lead to ₹{cpl}."
 ],
 "results.industries.1.kpis.0.value": [
  "435",
  "{edLeads}"
 ],
 "results.industries.1.kpis.1.value": [
  "1.75",
  "{hiringCpl}"
 ],
 "results.industries.1.kpis.2.value": [
  "2.49",
  "{cpm}"
 ],
 "results.industries.1.kpis.4.value": [
  "0.11",
  "{thruplay}"
 ],
 "results.industries.1.bars.0.value": [
  "₹0.11",
  "₹{thruplay}"
 ],
 "results.industries.1.bars.2.value": [
  "₹1.75",
  "₹{hiringCpl}"
 ],
 "results.industries.2.kpis.0.value": [
  "10",
  "{projects}"
 ],
 "results.industries.2.kpis.2.value": [
  "500",
  "{creatives}"
 ],
 "ticker.items.0.bold": [
  "506+",
  "{reLeads}+"
 ],
 "ticker.items.1.bold": [
  "1.41%",
  "{ctr}%"
 ],
 "ticker.items.2.bold": [
  "₹97.71",
  "₹{cpl}"
 ],
 "ticker.items.3.bold": [
  "13.1%",
  "{clickToLead}%"
 ],
 "ticker.items.4.bold": [
  "28",
  "{visits}"
 ],
 "ticker.items.5.bold": [
  "₹2.49",
  "₹{cpm}"
 ],
 "ticker.items.6.bold": [
  "435+",
  "{edLeads}+"
 ],
 "ticker.items.7.bold": [
  "₹0.11",
  "₹{thruplay}"
 ],
 "ticker.items.8.bold": [
  "19.4L",
  "{socialViews}L"
 ],
 "experience.title": [
  "4+ years, ~5 companies,~ one focus: results.",
  "{years}+ years, ~{companies} companies,~ one focus: results."
 ],
 "toasts.items.0.title": [
  "28 site visits booked",
  "{visits} site visits booked"
 ],
 "toasts.items.0.text": [
  "Nearly 1 in 3 qualified buyers visited in 3 weeks",
  "{visitRate}% of qualified buyers visited in 3 weeks"
 ],
 "toasts.items.1.title": [
  "13.1% click-to-lead rate",
  "{clickToLead}% click-to-lead rate"
 ],
 "toasts.items.1.text": [
  "2,856 clicks turned into 375 leads",
  "{clicks} clicks turned into {funnelLeads} leads"
 ],
 "toasts.items.2.title": [
  "Lead at ₹1.75",
  "Lead at ₹{hiringCpl}"
 ],
 "toasts.items.3.title": [
  "Cost per lead ₹97.71",
  "Cost per lead ₹{cpl}"
 ],
 "toasts.items.4.title": [
  "CPM just ₹2.49",
  "CPM just ₹{cpm}"
 ],
 "toasts.items.5.title": [
  "96 qualified buyers",
  "{qualified} qualified buyers"
 ],
 "toasts.items.5.text": [
  "From 2L+ impressions at 1.41% CTR",
  "From {impressions} impressions at {ctr}% CTR"
 ],
 "toasts.items.6.title": [
  "₹0.11 per video view",
  "₹{thruplay} per video view"
 ],
 "toasts.items.7.title": [
  "₹15L+ budget managed",
  "₹{budget}L+ budget managed"
 ],
 "toasts.items.7.text": [
  "900+ leads generated so far",
  "{leadsRounded}+ leads generated so far"
 ]
};

function upgrade(saved) {
  if (!saved || typeof saved !== "object" || Array.isArray(saved.numbers)) return saved;
  const c = JSON.parse(JSON.stringify(saved));
  for (const path in MAP) {
    const keys = path.split(".");
    let o = c;
    for (let i = 0; i < keys.length - 1 && o; i++) o = o[keys[i]];
    const last = keys[keys.length - 1];
    if (o && typeof o === "object" && o[last] === MAP[path][0]) o[last] = MAP[path][1];
  }
  return c;
}
module.exports = { upgrade };
