/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: 'https://tcf.swiftcoanalytics.com',
    generateRobotsTxt: true,
    robotsTxtOptions: {
      additionalSitemaps: [
        'https://tcf.swiftcoanalytics.com/server-sitemap.xml', // for dynamic pages if needed
      ],
      policies: [
        {
          userAgent: '*',
          allow: '/',
          disallow: [
            '/admin/*',
            '/404',
            '/_*',
            '/api/*',
          ],
        },
      ],
    },
    exclude: [
      '/admin/*',
      '/404',
      '/api/*',
    ],
    changefreq: 'daily',
    priority: 0.7,
    transform: async (config, path) => {
      // Custom priority for specific pages
      const priorities = {
        '/': 1.0,
        '/admin/*': 0.8,
        '/privacy': 0.5,
        '/terms': 0.5,
        '/about': 0.8,
      }
  
      return {
        loc: path,
        changefreq: config.changefreq,
        priority: priorities[path] || config.priority,
        lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      }
    },
  } 