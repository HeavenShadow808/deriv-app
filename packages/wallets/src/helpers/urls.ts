import Cookies from 'js-cookie';
import { getAccountsFromLocalStorage } from '@deriv/utils';
import { LocalStorageUtils, URLConstants, URLUtils } from '@deriv-com/utils';
import { LANDING_COMPANIES } from '../constants/constants';

const isBrowser = () => typeof window !== 'undefined';

const derivComUrl = 'deriv.com';
const derivMeUrl = 'deriv.me';
const derivBeUrl = 'deriv.be';

const supportedDomains = [derivComUrl, derivMeUrl, derivBeUrl];
const domainUrlInitial = (isBrowser() && window.location.hostname.split('app.')[1]) || '';
// For custom domains (like deriv.now), use the current domain instead of falling back to deriv.com
const hostname = isBrowser() ? window.location.hostname : '';
const isCustomDomain =
    isBrowser() &&
    !/^(app|staging-app|smarttrader|staging-smarttrader|hub|staging-hub|p2p|staging-p2p|dbot|staging-dbot|eu|staging)\.deriv\.(com|me|be)$/i.test(
        hostname
    ) &&
    !hostname.includes('localhost') &&
    !hostname.includes('binary.sx') &&
    !hostname.includes('deriv.dev') &&
    !supportedDomains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));

const domainUrl = isCustomDomain
    ? isBrowser()
        ? hostname.replace(/^(app|staging-app)\./, '')
        : derivComUrl
    : supportedDomains.includes(domainUrlInitial)
      ? domainUrlInitial
      : derivComUrl;

// TEMPORARY FALLBACK: Until external apps are deployed to custom subdomains,
// we'll use deriv.com as fallback. Set to true when ready to use custom domain.
const USE_CUSTOM_DOMAIN_FOR_EXTERNAL_APPS = false; // TODO: Set to true when apps are deployed
const getExternalAppsDomain = () => {
    return isCustomDomain && USE_CUSTOM_DOMAIN_FOR_EXTERNAL_APPS ? domainUrl : derivComUrl;
};
const externalAppsDomain = getExternalAppsDomain();

export const derivUrls = Object.freeze({
    BOT_PRODUCTION: `https://dbot.${externalAppsDomain}`,
    BOT_STAGING: `https://staging-dbot.${externalAppsDomain}`,
    DERIV_APP_PRODUCTION: `https://app.${domainUrl}`,
    DERIV_APP_STAGING: `https://staging-app.${domainUrl}`,
    DERIV_COM_PRODUCTION: `https://${domainUrl}`,
    DERIV_COM_PRODUCTION_EU: `https://eu.${domainUrl}`,
    DERIV_COM_STAGING: `https://staging.${domainUrl}`,
    DERIV_HOST_NAME: domainUrl,
    SMARTTRADER_PRODUCTION: `https://smarttrader.${externalAppsDomain}`,
    SMARTTRADER_STAGING: `https://staging-smarttrader.${externalAppsDomain}`,
});

/**
 * @deprecated Please use 'URLConstants.whatsApp' from '@deriv-com/utils' instead of this.
 */
export const whatsappUrl = 'https://wa.me/35699578341';

let defaultLanguage: string;

export const setUrlLanguage = (lang: string) => {
    defaultLanguage = lang;
};

/**
 * @deprecated Please use 'URLUtils.normalizePath' from '@deriv-com/utils' instead of this.
 */
export const normalizePath = (path: string) => (path ? path.replace(/(^\/|\/$|[^a-zA-Z0-9-_./()#])/g, '') : '');

/**
 * @deprecated Please use 'URLUtils.getQueryParameter' from '@deriv-com/utils' instead of this.
 */
export const getActionFromUrl = () => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const action = urlParams.get('action');
    return action;
};

export const getUrlSmartTrader = () => {
    const { isStagingDerivApp } = getPlatformFromUrl();
    const localizeLanguage = LocalStorageUtils.getValue<string>('i18n_language');
    const urlLang = URLUtils.getQueryParameter('lang');
    const i18NLanguage = localizeLanguage || urlLang || 'en';

    let baseLink = '';

    if (isStagingDerivApp) {
        baseLink = derivUrls.SMARTTRADER_STAGING;
    } else {
        baseLink = derivUrls.SMARTTRADER_PRODUCTION;
    }

    return `${baseLink}/${i18NLanguage.toLowerCase()}/trading.html`;
};

export const getUrlBot = () => {
    const { isStagingDerivApp } = getPlatformFromUrl();
    const localizeLanguage = LocalStorageUtils.getValue<string>('i18n_language');
    const urlLang = URLUtils.getQueryParameter('lang');
    const i18NLanguage = localizeLanguage || urlLang || 'en';

    let baseLink = '';

    if (isStagingDerivApp) {
        baseLink = derivUrls.BOT_STAGING;
    } else {
        baseLink = derivUrls.BOT_PRODUCTION;
    }

    return `${baseLink}?lang=${i18NLanguage.toLowerCase()}`;
};

export const getPlatformFromUrl = (domain = window.location.hostname) => {
    const resolutions = {
        isDerivApp: /^app\.deriv\.(com|me|be)$/i.test(domain),
        isStagingDerivApp: /^staging-app\.deriv\.(com|me|be)$/i.test(domain),
        isTestLink: /^(.*)\.binary\.sx$/i.test(domain),
    };

    return {
        ...resolutions,
        isStaging: resolutions.isStagingDerivApp,
    };
};

export const isStaging = (domain = window.location.hostname) => {
    const { isStagingDerivApp } = getPlatformFromUrl(domain);

    return isStagingDerivApp;
};

export const isProduction = () => {
    return process.env.NODE_ENV === 'production';
};

/**
 * @deprecated Please use 'URLUtils.getDerivStaticURL' from '@deriv-com/utils' instead of this.
 */
export const getStaticUrl = (
    path = '',
    language = defaultLanguage?.toLowerCase(),
    isDocument = false,
    isEuUrl = false
) => {
    const host = isEuUrl ? derivUrls.DERIV_COM_PRODUCTION_EU : derivUrls.DERIV_COM_PRODUCTION;
    let lang = language;

    if (lang && lang !== 'en') {
        lang = `/${lang}`;
    } else {
        lang = '';
    }

    if (isDocument) return `${host}/${normalizePath(path)}`;

    // Deriv.com supports languages separated by '-' not '_'
    if (host === derivUrls.DERIV_COM_PRODUCTION && lang.includes('_')) {
        lang = lang.replace('_', '-');
    }

    return `${host}${lang}/${normalizePath(path)}`;
};

export const OUT_SYSTEMS_TRADERSHUB = Object.freeze({
    PRODUCTION: `https://hub.${getExternalAppsDomain()}/tradershub`,
    STAGING: `https://staging-hub.${getExternalAppsDomain()}/tradershub`,
});

export const redirectToOutSystems = (landingCompany?: string, currency = '') => {
    const clientAccounts = getAccountsFromLocalStorage() ?? {};
    if (!Object.keys(clientAccounts).length) return;
    const accountsWithTokens: Record<string, unknown> = {};
    Object.keys(clientAccounts).forEach(loginid => {
        const account = clientAccounts[loginid];
        accountsWithTokens[loginid] = { token: account.token };
    });
    const expires = new Date(new Date().getTime() + 1 * 60 * 1000); // 1 minute

    Cookies.set('os_auth_tokens', JSON.stringify(accountsWithTokens), { domain: URLConstants.baseDomain, expires });

    const params = new URLSearchParams({
        action: 'real-account-signup',
        ...(currency ? { currency } : {}),
        target: landingCompany || LANDING_COMPANIES.MALTAINVEST,
    });
    const baseUrl = isProduction() ? OUT_SYSTEMS_TRADERSHUB.PRODUCTION : OUT_SYSTEMS_TRADERSHUB.STAGING;

    const redirectURL = new URL(`${baseUrl}/redirect`);
    redirectURL.search = params.toString();
    return (window.location.href = redirectURL.toString());
};
