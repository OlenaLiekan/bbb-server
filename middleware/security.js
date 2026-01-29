const suspiciousPatterns = [
  'ismustmobile',
  'confinfo',
  'time',
  'list',
  'union',
  'select',
  'insert',
  'delete',
  'drop',
  'script',
  '<script',
  'alert(',
  'document.cookie',
  'sleep(',
  'waitfor',
  'delay',
  'benchmark',
];

const botUserAgents = [
  'okhttp',
  'curl',
  'wget',
  'python',
  'java',
  'scanner',
  'spider',
  'bot',
  'crawler',
  'sqlmap',
  'nmap',
  'nikto',
  'zap',
  'burp',
];

module.exports = function securityMiddleware(req, res, next) {
  const url = req.originalUrl.toLowerCase();
  const userAgent = (req.headers['user-agent'] || '').toLowerCase();
  const ip = req.ip || req.connection.remoteAddress;

  if (url.startsWith('/api/user/')) {
    const idParam = url.split('/')[3];
    console.log(`User API call: IP=${ip}, ID="${idParam}", UA=${userAgent.substring(0, 50)}`);
  }

  const hasSuspiciousPattern = suspiciousPatterns.some(pattern => url.includes(pattern));

  if (hasSuspiciousPattern) {
    console.log(
      `🚨 SECURITY BLOCKED (pattern): ${ip} -> ${req.method} ${req.originalUrl}, UA: ${userAgent}`
    );
    return res.status(403).json({
      success: false,
      error: 'Access denied',
    });
  }

  const isKnownBot = botUserAgents.some(botUA => userAgent.includes(botUA));

  if (isKnownBot && url.includes('/api/user/')) {
    console.log(`Bot detected: ${ip}, UA: ${userAgent}`);
    return res.status(403).json({ error: 'Bot access denied' });
  }

  const pathParts = req.path.split('/');
  if (pathParts.length >= 4) {
    const idParam = pathParts[3];
    if (idParam && isNaN(parseInt(idParam))) {
      console.log(`🚨 INVALID ID from ${ip}: "${idParam}", UA: ${userAgent}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }
  }

  next();
};
