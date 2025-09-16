(function() {
    const RATE_LIMITS = {
        requests: { max: 100, window: 60000 },
        clicks: { max: 50, window: 10000 },
        forms: { max: 5, window: 60000 }
    };
    
    
    const userActivity = {
        requests: [],
        clicks: [],
        forms: [],
        suspicious: 0
    };
    
    
    function cleanOldRecords(records, windowMs) {
        const now = Date.now();
        return records.filter(timestamp => now - timestamp < windowMs);
    }
    
    
    function checkRateLimit(type) {
        const now = Date.now();
        const config = RATE_LIMITS[type];
        
        if (!config) return true;
        
        
        userActivity[type] = cleanOldRecords(userActivity[type], config.window);
        
        
        if (userActivity[type].length >= config.max) {
            userActivity.suspicious++;
            return false;
        }
        
        
        userActivity[type].push(now);
        return true;
    }
    
    
    function detectSuspiciousBehavior() {
        const now = Date.now();
        
        
        const recentClicks = userActivity.clicks.filter(time => now - time < 1000);
        if (recentClicks.length > 10) {
            userActivity.suspicious += 2;
            return true;
        }
        
        
        if (userActivity.clicks.length > 20) {
            const intervals = [];
            for (let i = 1; i < userActivity.clicks.length; i++) {
                intervals.push(userActivity.clicks[i] - userActivity.clicks[i-1]);
            }
            
            
            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const similarIntervals = intervals.filter(interval => 
                Math.abs(interval - avgInterval) < 50
            ).length;
            
            if (similarIntervals / intervals.length > 0.8) {
                userActivity.suspicious += 3;
                return true;
            }
        }
        
        return false;
    }
    
    
    function blockSuspiciousUser() {
        
        const blockMessage = document.createElement('div');
        blockMessage.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.9);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99999;
                font-family: Arial, sans-serif;
            ">
                <div style="text-align: center; padding: 20px;">
                    <h2>Acceso Temporalmente Restringido</h2>
                    <p>Se ha detectado actividad sospechosa. Por favor, espera unos minutos antes de continuar.</p>
                    <p>Si eres un usuario legítimo, disculpa las molestias.</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(blockMessage);
        
        
        document.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
        }, true);
        
        document.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
        }, true);
        
        
        setTimeout(() => {
            if (blockMessage.parentNode) {
                blockMessage.parentNode.removeChild(blockMessage);
            }
            userActivity.suspicious = 0;
            userActivity.requests = [];
            userActivity.clicks = [];
            userActivity.forms = [];
        }, 300000);
    }
    
    
    function interceptRequests() {
        
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            if (!checkRateLimit('requests')) {
                console.warn('Rate limit exceeded for requests');
                return Promise.reject(new Error('Rate limit exceeded'));
            }
            return originalFetch.apply(this, args);
        };
        
        
        const originalXHR = window.XMLHttpRequest;
        window.XMLHttpRequest = function() {
            const xhr = new originalXHR();
            const originalSend = xhr.send;
            
            xhr.send = function(...args) {
                if (!checkRateLimit('requests')) {
                    console.warn('Rate limit exceeded for XHR requests');
                    throw new Error('Rate limit exceeded');
                }
                return originalSend.apply(this, args);
            };
            
            return xhr;
        };
    }
    
    
    document.addEventListener('DOMContentLoaded', function() {
        
        interceptRequests();
        
        
        document.addEventListener('click', function(e) {
            if (!checkRateLimit('clicks')) {
                e.preventDefault();
                e.stopPropagation();
                console.warn('Rate limit exceeded for clicks');
                return false;
            }
            
            
            if (detectSuspiciousBehavior()) {
                console.warn('Suspicious behavior detected');
            }
            
            
            if (userActivity.suspicious >= 10) {
                blockSuspiciousUser();
            }
        }, true);
        
        
        document.addEventListener('submit', function(e) {
            if (!checkRateLimit('forms')) {
                e.preventDefault();
                e.stopPropagation();
                alert('Demasiados envíos de formulario. Por favor, espera un momento.');
                return false;
            }
        }, true);
        
        
        if (window.navigator.webdriver || 
            window.phantom || 
            window.callPhantom || 
            window._phantom ||
            window.Buffer ||
            window.emit ||
            window.spawn) {
            userActivity.suspicious += 5;
            console.warn('Automation tool detected');
        }
        
        
        if (navigator.plugins.length === 0 || 
            navigator.languages.length === 0 ||
            !navigator.cookieEnabled) {
            userActivity.suspicious += 2;
            console.warn('Possible headless browser detected');
        }
        
        
        setInterval(() => {
            const now = Date.now();
            userActivity.requests = cleanOldRecords(userActivity.requests, RATE_LIMITS.requests.window);
            userActivity.clicks = cleanOldRecords(userActivity.clicks, RATE_LIMITS.clicks.window);
            userActivity.forms = cleanOldRecords(userActivity.forms, RATE_LIMITS.forms.window);
            
            
            if (userActivity.suspicious > 0) {
                userActivity.suspicious = Math.max(0, userActivity.suspicious - 1);
            }
        }, 30000);
    });
    
    
    window.getDDoSProtectionStatus = function() {
        return {
            activity: userActivity,
            limits: RATE_LIMITS
        };
    };
})();