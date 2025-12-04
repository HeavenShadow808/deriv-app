const isBrowser = () => typeof window !== 'undefined';

const deriv_com_url = 'deriv.com';
const deriv_me_url = 'deriv.me';
const deriv_be_url = 'deriv.be';

const supported_domains = [deriv_com_url, deriv_me_url, deriv_be_url];
const domain_url_initial = (isBrowser() && window.location.hostname.split('app.')[1]) || '';
// For custom domains (like deriv.now), use the current domain instead of falling back to deriv.com
// Check if hostname is a custom domain (not deriv.com, deriv.me, deriv.be, or their subdomains)
const hostname = isBrowser() ? window.location.hostname : '';
const is_custom_domain =
    isBrowser() &&
    !/^(app|staging-app|smarttrader|staging-smarttrader|hub|staging-hub|p2p|staging-p2p|dbot|staging-dbot|eu|staging)\.deriv\.(com|me|be)$/i.test(
        hostname
    ) &&
    !hostname.includes('localhost') &&
    !hostname.includes('binary.sx') &&
    !hostname.includes('deriv.dev') &&
    !supported_domains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));

const domain_url = is_custom_domain
    ? isBrowser()
        ? hostname.replace(/^(app|staging-app)\./, '')
        : deriv_com_url
    : supported_domains.includes(domain_url_initial)
      ? domain_url_initial
      : deriv_com_url;

// For fork with custom domain and own App ID, all URLs must use custom domain
// All subdomains (SmartTrader, DBot, P2P, Hub) should use custom domain.
// Note: You need to configure these subdomains in your DNS/hosting.
//
// SmartTrader has been deployed to smarttrader.deriv.now
// Set to true to use custom domain for external apps
const USE_CUSTOM_DOMAIN_FOR_EXTERNAL_APPS = true; // SmartTrader deployed to custom domain
const external_apps_domain = is_custom_domain && USE_CUSTOM_DOMAIN_FOR_EXTERNAL_APPS ? domain_url : deriv_com_url;

export const deriv_urls = Object.freeze({
    DERIV_HOST_NAME: domain_url,
    DERIV_COM_PRODUCTION: `https://${domain_url}`,
    DERIV_COM_PRODUCTION_EU: `https://eu.${domain_url}`,
    DERIV_COM_STAGING: `https://staging.${domain_url}`,
    DERIV_APP_PRODUCTION: `https://app.${domain_url}`,
    DERIV_APP_STAGING: `https://staging-app.${domain_url}`,
    // For external apps, use custom domain only if explicitly enabled, otherwise use deriv.com
    HUB_PRODUCTION: `https://hub.${external_apps_domain}/tradershub`,
    HUB_STAGING: `https://staging-hub.${external_apps_domain}/tradershub`,
    SMARTTRADER_PRODUCTION: `https://smarttrader.${external_apps_domain}`,
    SMARTTRADER_STAGING: `https://staging-smarttrader.${external_apps_domain}`,
    P2P_PRODUCTION: `https://p2p.${external_apps_domain}`,
    P2P_STAGING: `https://staging-p2p.${external_apps_domain}`,
    BOT_PRODUCTION: `https://dbot.${external_apps_domain}`,
    BOT_STAGING: `https://staging-dbot.${external_apps_domain}`,
});
/**
 * @deprecated Please use 'URLConstants.whatsApp' from '@deriv-com/utils' instead of this.
 */
export const whatsapp_url = 'https://wa.me/35699578341';
