// Use current domain for custom domains, fallback to app.deriv.com for official domains
const getWebsiteDomain = () => {
    if (typeof window === 'undefined') return 'app.deriv.com';
    const hostname = window.location.hostname;
    // For custom domains (not deriv.com/deriv.me/deriv.be), use current domain
    const is_custom_domain =
        !/^(app|staging-app)\.deriv\.(com|me|be)$/i.test(hostname) &&
        !hostname.includes('localhost') &&
        !hostname.includes('binary.sx') &&
        !hostname.includes('deriv.dev');
    return is_custom_domain ? hostname : 'app.deriv.com';
};

export const website_domain = getWebsiteDomain();
export const website_name = 'Deriv';
export const default_title = website_name;
export const TRACKING_STATUS_KEY = 'tracking_status';
