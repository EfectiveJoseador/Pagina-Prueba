(function() {
    'use strict';

    
    const config = {
        baseUrl: 'https://camisetazo.com',
        sitemapPath: '/sitemap.xml',
        autoUpdate: true,
        maxUrls: 50000,
        defaultChangeFreq: 'weekly',
        defaultPriority: 0.5,
        excludePatterns: [
            /\/admin\//,
            /\/private\//,
            /\?.*$/,
            /#.*$/,
            /\/test\//
        ]
    };

    
    const urlConfig = {
        '/': { priority: 1.0, changefreq: 'daily' },
        '/catalogo': { priority: 0.9, changefreq: 'daily' },
        '/categoria/': { priority: 0.8, changefreq: 'weekly' },
        '/liga/': { priority: 0.7, changefreq: 'weekly' },
        '/producto/': { priority: 0.6, changefreq: 'monthly' },
        '/ofertas': { priority: 0.7, changefreq: 'daily' },
        '/blog/': { priority: 0.6, changefreq: 'weekly' },
        '/politica-': { priority: 0.3, changefreq: 'yearly' }
    };

    class SitemapGenerator {
        constructor() {
            this.urls = new Set();
            this.lastGenerated = null;
        }

        
        getUrlConfig(url) {
            for (const [pattern, config] of Object.entries(urlConfig)) {
                if (url.includes(pattern)) {
                    return config;
                }
            }
            return {
                priority: config.defaultPriority,
                changefreq: config.defaultChangeFreq
            };
        }

        
        shouldExclude(url) {
            return config.excludePatterns.some(pattern => pattern.test(url));
        }

        
        addUrl(url, lastmod = null, priority = null, changefreq = null) {
            if (this.shouldExclude(url)) return;

            const fullUrl = url.startsWith('http') ? url : config.baseUrl + url;
            const urlConfig = this.getUrlConfig(url);

            const urlEntry = {
                loc: fullUrl,
                lastmod: lastmod || new Date().toISOString().split('T')[0],
                priority: priority || urlConfig.priority,
                changefreq: changefreq || urlConfig.changefreq
            };

            this.urls.add(JSON.stringify(urlEntry));
        }

        
        discoverUrls() {
            
            this.addUrl('/');
            this.addUrl('/catalogo');

            
            this.discoverCategories();

            
            this.discoverProducts();

            
            this.discoverOtherPages();

            
            this.addStaticPages();
        }

        
        discoverCategories() {
            const categories = [
                'futbol', 'nba', 'nfl', 'nhl', 'mlb', 'f1'
            ];

            categories.forEach(category => {
                this.addUrl(`/categoria/${category}`);
            });

            
            const leagues = [
                'premier-league', 'la-liga', 'serie-a', 'bundesliga',
                'ligue-1', 'brasileirao', 'saf-argentina', 'liga-arabe', 'internacional'
            ];

            leagues.forEach(league => {
                this.addUrl(`/liga/${league}`);
            });
        }

        
        discoverProducts() {
            const productElements = document.querySelectorAll('.catalogo-card, .product-item');
            
            productElements.forEach((product, index) => {
                const productName = product.querySelector('h3, .product-name')?.textContent?.trim();
                if (productName) {
                    const slug = this.createSlug(productName);
                    this.addUrl(`/producto/${slug}`);
                }
            });

            
            const popularProducts = [
                'camiseta-real-madrid-2024',
                'camiseta-barcelona-2024',
                'camiseta-manchester-united-2024',
                'camiseta-liverpool-2024',
                'camiseta-psg-2024',
                'camiseta-juventus-2024',
                'camiseta-bayern-munich-2024',
                'camiseta-lakers-lebron-james',
                'camiseta-warriors-stephen-curry',
                'camiseta-bulls-michael-jordan'
            ];

            popularProducts.forEach(product => {
                this.addUrl(`/producto/${product}`);
            });
        }

        
        discoverOtherPages() {
            const links = document.querySelectorAll('a[href]');
            
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('/') && !href.startsWith('//')) {
                    this.addUrl(href);
                }
            });
        }

        
        addStaticPages() {
            const staticPages = [
                { url: '/sobre-nosotros', priority: 0.5 },
                { url: '/contacto', priority: 0.5 },
                { url: '/envios', priority: 0.5 },
                { url: '/devoluciones', priority: 0.5 },
                { url: '/guia-tallas', priority: 0.5 },
                { url: '/preguntas-frecuentes', priority: 0.5 },
                { url: '/ofertas', priority: 0.7 },
                { url: '/rebajas', priority: 0.7 },
                { url: '/novedades', priority: 0.7 },
                { url: '/blog', priority: 0.6 },
                { url: '/politica-privacidad.html', priority: 0.3, changefreq: 'yearly' },
                { url: '/politica-cookies.html', priority: 0.3, changefreq: 'yearly' },
                { url: '/terminos-condiciones', priority: 0.3, changefreq: 'yearly' }
            ];

            staticPages.forEach(page => {
                this.addUrl(page.url, null, page.priority, page.changefreq);
            });

            
            const searchPages = [
                'camisetas-retro',
                'camisetas-personalizadas',
                'camisetas-ninos'
            ];

            searchPages.forEach(search => {
                this.addUrl(`/buscar/${search}`, null, 0.5);
            });
        }

        
        createSlug(text) {
            return text
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim('-');
        }

        
        generateXML() {
            const urlsArray = Array.from(this.urls).map(url => JSON.parse(url));
            
            
            urlsArray.sort((a, b) => {
                if (b.priority !== a.priority) {
                    return b.priority - a.priority;
                }
                return a.loc.localeCompare(b.loc);
            });

            
            const limitedUrls = urlsArray.slice(0, config.maxUrls);

            let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
            xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
            xml += '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n';
            xml += '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n';
            xml += '        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n\n';

            limitedUrls.forEach(url => {
                xml += '    <url>\n';
                xml += `        <loc>${this.escapeXml(url.loc)}</loc>\n`;
                xml += `        <lastmod>${url.lastmod}</lastmod>\n`;
                xml += `        <changefreq>${url.changefreq}</changefreq>\n`;
                xml += `        <priority>${url.priority}</priority>\n`;
                xml += '    </url>\n\n';
            });

            xml += '</urlset>';

            return xml;
        }

        
        escapeXml(text) {
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');
        }

        
        generateAndDownload() {
            this.discoverUrls();
            const xml = this.generateXML();
            this.lastGenerated = new Date();

            
            const blob = new Blob([xml], { type: 'application/xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'sitemap.xml';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            return xml;
        }

        
        async uploadSitemap(xml) {
            try {
                const response = await fetch('/api/sitemap', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/xml'
                    },
                    body: xml
                });

                if (response.ok) {
                    console.log('✅ Sitemap uploaded successfully');
                } else {
                    console.warn('⚠️ Failed to upload sitemap:', response.statusText);
                }
            } catch (error) {
                console.warn('⚠️ Sitemap upload not available:', error.message);
            }
        }

        
        getStats() {
            const urlsArray = Array.from(this.urls).map(url => JSON.parse(url));
            const stats = {
                totalUrls: urlsArray.length,
                lastGenerated: this.lastGenerated,
                priorities: {},
                changeFreqs: {}
            };

            urlsArray.forEach(url => {
                stats.priorities[url.priority] = (stats.priorities[url.priority] || 0) + 1;
                stats.changeFreqs[url.changefreq] = (stats.changeFreqs[url.changefreq] || 0) + 1;
            });

            return stats;
        }

        
        autoGenerate() {
            if (!config.autoUpdate) return;

            this.discoverUrls();
            const xml = this.generateXML();
            this.uploadSitemap(xml);

            console.log('🗺️ Sitemap auto-generated:', this.getStats());
        }
    }

    
    window.SitemapGenerator = {
        create: () => new SitemapGenerator(),
        config: config
    };

    
    const generator = new SitemapGenerator();
    
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => generator.autoGenerate(), 2000);
        });
    } else {
        setTimeout(() => generator.autoGenerate(), 2000);
    }

    
    window.sitemapGenerator = generator;

})();