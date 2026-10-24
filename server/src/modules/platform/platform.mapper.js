const { getClientUrl } = require('../../utils/urlConfig');

function toCollegeDto(college) {
  if (!college) return null;
  return {
    id: college.id,
    name: college.name,
    state: college.state || null,
    city: college.city || null,
    domain: college.domain || null,
  };
}

function buildSitemapXml(entries = []) {
  const baseUrl = getClientUrl();
  const urls = entries.map(
    (e) => `<url><loc>${e.loc}</loc><lastmod>${e.lastmod || new Date().toISOString()}</lastmod></url>`
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}/</loc></url>
  <url><loc>${baseUrl}/projects</loc></url>
  <url><loc>${baseUrl}/about</loc></url>
  ${urls.join('\n  ')}
</urlset>`;
}

function buildRobotsTxt() {
  const baseUrl = getClientUrl();
  return `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

Sitemap: ${baseUrl}/sitemap.xml`;
}

module.exports = {
  toCollegeDto,
  buildSitemapXml,
  buildRobotsTxt,
};
