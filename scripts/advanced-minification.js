(function() {
    'use strict';

    
    const config = {
        minifyCSS: true,
        minifyJS: true,
        removeComments: true,
        removeWhitespace: true,
        optimizeSelectors: true,
        removeUnusedCSS: true,
        compressVariables: true,
        enableSourceMaps: false,
        preserveCriticalCSS: true
    };

    
    const metrics = {
        originalCSSSize: 0,
        minifiedCSSSize: 0,
        originalJSSize: 0,
        minifiedJSSize: 0,
        processingTime: 0
    };

    
    class CSSMinifier {
        constructor() {
            this.usedSelectors = new Set();
            this.criticalCSS = new Set();
        }

        
        removeComments(css) {
            return css.replace(/\/\*[\s\S]*?\*\//g, '');
        }

        
        removeWhitespace(css) {
            return css
                .replace(/\s+/g, ' ')
                .replace(/;\s*}/g, '}')
                .replace(/\s*{\s*/g, '{')
                .replace(/;\s*/g, ';')
                .replace(/,\s*/g, ',')
                .replace(/:\s*/g, ':')
                .replace(/}\s*/g, '}')
                .trim();
        }

        
        optimizeSelectors(css) {
            
            css = css.replace(/([^{}]+)\{([^{}]*)\}\s*\1\{([^{}]*)\}/g, '$1{$2$3}');
            
            
            const rules = new Map();
            css.replace(/([^{}]+)\{([^{}]*)\}/g, (match, selector, declarations) => {
                const key = declarations.trim();
                if (rules.has(key)) {
                    rules.set(key, rules.get(key) + ',' + selector.trim());
                } else {
                    rules.set(key, selector.trim());
                }
                return '';
            });
            
            let optimized = '';
            rules.forEach((selectors, declarations) => {
                optimized += `${selectors}{${declarations}}`;
            });
            
            return optimized;
        }

        
        removeUnusedCSS(css) {
            if (!config.removeUnusedCSS) return css;
            
            
            this.collectUsedSelectors();
            
            
            return css.replace(/([^{}]+)\{[^{}]*\}/g, (match, selector) => {
                const cleanSelector = selector.trim().split(',')[0].trim();
                
                
                if (this.isCriticalSelector(cleanSelector)) {
                    return match;
                }
                
                
                if (this.isSelectorUsed(cleanSelector)) {
                    return match;
                }
                
                return '';
            });
        }

        
        collectUsedSelectors() {
            const elements = document.querySelectorAll('*');
            elements.forEach(el => {
                
                if (el.className) {
                    el.className.split(' ').forEach(cls => {
                        if (cls.trim()) this.usedSelectors.add(`.${cls.trim()}`);
                    });
                }
                
                
                if (el.id) {
                    this.usedSelectors.add(`#${el.id}`);
                }
                
                
                this.usedSelectors.add(el.tagName.toLowerCase());
            });
        }

        
        isCriticalSelector(selector) {
            const critical = [
                ':root', 'html', 'body', '*',
                ':hover', ':focus', ':active', ':visited',
                '@media', '@keyframes', '@supports'
            ];
            
            return critical.some(crit => selector.includes(crit));
        }

        
        isSelectorUsed(selector) {
            
            if (this.usedSelectors.has(selector)) return true;
            
            
            try {
                return document.querySelector(selector) !== null;
            } catch (e) {
                return true;
            }
        }

        
        compressValues(css) {
            if (!config.compressVariables) return css;
            
            
            css = css.replace(/#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3/gi, '#$1$2$3');
            css = css.replace(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/g, (match, r, g, b) => {
                const hex = ((1 << 24) + (parseInt(r) << 16) + (parseInt(g) << 8) + parseInt(b)).toString(16).slice(1);
                return `#${hex}`;
            });
            
            
            css = css.replace(/\b0px\b/g, '0');
            css = css.replace(/\b0em\b/g, '0');
            css = css.replace(/\b0rem\b/g, '0');
            css = css.replace(/\b0%\b/g, '0');
            
            
            css = css.replace(/;}/g, '}');
            
            return css;
        }

        
        minify(css) {
            const startTime = performance.now();
            metrics.originalCSSSize += css.length;
            
            let minified = css;
            
            if (config.removeComments) {
                minified = this.removeComments(minified);
            }
            
            if (config.removeWhitespace) {
                minified = this.removeWhitespace(minified);
            }
            
            if (config.optimizeSelectors) {
                minified = this.optimizeSelectors(minified);
            }
            
            if (config.removeUnusedCSS) {
                minified = this.removeUnusedCSS(minified);
            }
            
            if (config.compressVariables) {
                minified = this.compressValues(minified);
            }
            
            metrics.minifiedCSSSize += minified.length;
            metrics.processingTime += performance.now() - startTime;
            
            return minified;
        }
    }

    
    class JSMinifier {
        constructor() {
            this.variableMap = new Map();
            this.functionMap = new Map();
        }

        
        removeComments(js) {
            
            js = js.replace(/\/\/.*$/gm, '');
            
            
            js = js.replace(/\/\*[\s\S]*?\*\//g, '');
            
            return js;
        }

        
        removeWhitespace(js) {
            return js
                .replace(/\s+/g, ' ')
                .replace(/;\s*}/g, '}')
                .replace(/\s*{\s*/g, '{')
                .replace(/;\s*/g, ';')
                .replace(/,\s*/g, ',')
                .replace(/\s*\+\s*/g, '+')
                .replace(/\s*-\s*/g, '-')
                .replace(/\s*\*\s*/g, '*')
                .replace(/\s*\/\s*/g, '/')
                .replace(/\s*=\s*/g, '=')
                .replace(/\s*<\s*/g, '<')
                .replace(/\s*>\s*/g, '>')
                .replace(/}\s*/g, '}')
                .trim();
        }

        
        compressVariables(js) {
            if (!config.compressVariables) return js;
            
            
            const varPattern = /\b(var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
            let match;
            let counter = 0;
            
            while ((match = varPattern.exec(js)) !== null) {
                const originalName = match[2];
                
                
                if (originalName.length <= 2 || this.isReservedWord(originalName)) {
                    continue;
                }
                
                const shortName = this.generateShortName(counter++);
                this.variableMap.set(originalName, shortName);
            }
            
            
            this.variableMap.forEach((shortName, originalName) => {
                const regex = new RegExp(`\\b${originalName}\\b`, 'g');
                js = js.replace(regex, shortName);
            });
            
            return js;
        }

        
        generateShortName(index) {
            const chars = 'abcdefghijklmnopqrstuvwxyz';
            let result = '';
            let num = index;
            
            do {
                result = chars[num % 26] + result;
                num = Math.floor(num / 26);
            } while (num > 0);
            
            return result;
        }

        
        isReservedWord(word) {
            const reserved = [
                'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
                'default', 'delete', 'do', 'else', 'export', 'extends', 'finally',
                'for', 'function', 'if', 'import', 'in', 'instanceof', 'new',
                'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof',
                'var', 'void', 'while', 'with', 'yield', 'let', 'static',
                'enum', 'implements', 'interface', 'package', 'private',
                'protected', 'public', 'await', 'async'
            ];
            
            return reserved.includes(word);
        }

        
        minify(js) {
            const startTime = performance.now();
            metrics.originalJSSize += js.length;
            
            let minified = js;
            
            if (config.removeComments) {
                minified = this.removeComments(minified);
            }
            
            if (config.removeWhitespace) {
                minified = this.removeWhitespace(minified);
            }
            
            if (config.compressVariables) {
                minified = this.compressVariables(minified);
            }
            
            metrics.minifiedJSSize += minified.length;
            metrics.processingTime += performance.now() - startTime;
            
            return minified;
        }
    }

    
    class AdvancedMinifier {
        constructor() {
            this.cssMinifier = new CSSMinifier();
            this.jsMinifier = new JSMinifier();
        }

        
        minifyAllCSS() {
            if (!config.minifyCSS) return;
            
            
            const styleElements = document.querySelectorAll('style');
            styleElements.forEach(style => {
                if (style.textContent) {
                    style.textContent = this.cssMinifier.minify(style.textContent);
                }
            });
            
            
            const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
            linkElements.forEach(async (link) => {
                try {
                    const response = await fetch(link.href);
                    const css = await response.text();
                    const minified = this.cssMinifier.minify(css);
                    
                    
                    const style = document.createElement('style');
                    style.textContent = minified;
                    document.head.appendChild(style);
                    
                    
                    link.remove();
                } catch (e) {
                    console.warn('Could not minify external CSS:', link.href, e);
                }
            });
        }

        
        minifyAllJS() {
            if (!config.minifyJS) return;
            
            
            const scriptElements = document.querySelectorAll('script:not([src])');
            scriptElements.forEach(script => {
                if (script.textContent && !script.textContent.includes('minified')) {
                    script.textContent = this.jsMinifier.minify(script.textContent);
                }
            });
        }

        
        getStats() {
            const cssReduction = metrics.originalCSSSize > 0 ? 
                ((metrics.originalCSSSize - metrics.minifiedCSSSize) / metrics.originalCSSSize * 100).toFixed(2) : 0;
            
            const jsReduction = metrics.originalJSSize > 0 ? 
                ((metrics.originalJSSize - metrics.minifiedJSSize) / metrics.originalJSSize * 100).toFixed(2) : 0;
            
            return {
                css: {
                    original: metrics.originalCSSSize,
                    minified: metrics.minifiedCSSSize,
                    reduction: cssReduction + '%'
                },
                js: {
                    original: metrics.originalJSSize,
                    minified: metrics.minifiedJSSize,
                    reduction: jsReduction + '%'
                },
                processingTime: metrics.processingTime.toFixed(2) + 'ms'
            };
        }

        
        init() {
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.performMinification();
                });
            } else {
                this.performMinification();
            }
        }

        
        performMinification() {
            const startTime = performance.now();
            
            this.minifyAllCSS();
            this.minifyAllJS();
            
            const totalTime = performance.now() - startTime;
            
            if (config.enableSourceMaps) {
                console.group('🗜️ Advanced Minification Results');
                console.log('Statistics:', this.getStats());
                console.log(`Total processing time: ${totalTime.toFixed(2)}ms`);
                console.groupEnd();
            }
        }
    }

    
    window.AdvancedMinifier = {
        init: () => new AdvancedMinifier().init(),
        config: config,
        getStats: () => new AdvancedMinifier().getStats()
    };

    
    const minifier = new AdvancedMinifier();
    minifier.init();

})();