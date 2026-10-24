const botPatterns = [
  "googlebot",
  "bingbot",
  "yandex",
  "duckduckbot",
  "baiduspider",
  "facebookexternalhit",
  "twitterbot",
  "linkedinbot"
];

function isBot(userAgent = "") {
  const ua = userAgent.toLowerCase();
  return botPatterns.some(bot => ua.includes(bot));
}

module.exports = isBot;