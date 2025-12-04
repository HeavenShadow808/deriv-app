import { website_name } from '../config/app-config';
import { domain_app_ids, getAppId, DEFAULT_AFFILIATE_TOKEN, DEFAULT_UTM_CAMPAIGN } from '../config/config';
import { CookieStorage, isStorageSupported, LocalStore } from '../storage/storage';
import { getHubSignupUrl, urlForCurrentDomain } from '../url';
import { deriv_urls } from '../url/constants';
import { routes } from '../routes/routes';

export const redirectToLogin = (is_logged_in: boolean, language: string, has_params = true, redirect_delay = 0) => {
    if (!is_logged_in && isStorageSupported(sessionStorage)) {
        const l = window.location;
        const redirect_url = has_params ? window.location.href : `${l.protocol}//${l.host}${l.pathname}`;
        sessionStorage.setItem('redirect_url', redirect_url);
        setTimeout(() => {
            const new_href = loginUrl({ language });
            window.location.href = new_href;
        }, redirect_delay);
    }
};

export const redirectToSignUp = () => {
    const location = window.location.href;
    const isDtraderRoute = window.location.pathname.includes(routes.trade);

    if (isDtraderRoute) {
        window.open(getHubSignupUrl(location));
    } else {
        window.open(getHubSignupUrl());
    }
};

type TLoginUrl = {
    language: string;
};

export const loginUrl = ({ language }: TLoginUrl) => {
    const server_url = LocalStore.get('config.server_url');
    const change_login_app_id = LocalStore.get('change_login_app_id');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const signup_device_cookie = new (CookieStorage as any)('signup_device');
    const signup_device = signup_device_cookie.get('signup_device');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const date_first_contact_cookie = new (CookieStorage as any)('date_first_contact');
    const date_first_contact = date_first_contact_cookie.get('date_first_contact');
    // Get affiliate_token and utm_campaign from URL parameters
    // Support both sidc (Revenue Share) and sidi (Master Partner) from affiliate links
    // Always use default values from config if not provided in URL (affiliate link will always be used)
    const url_params = new URLSearchParams(window.location.search);
    const url_affiliate_token = url_params.get('affiliate_token') || url_params.get('sidc') || url_params.get('sidi');
    const url_utm_campaign = url_params.get('utm_campaign');
    // Use URL parameter if provided, otherwise always use default from config
    const affiliate_token =
        url_affiliate_token ||
        (DEFAULT_AFFILIATE_TOKEN && DEFAULT_AFFILIATE_TOKEN.trim().length > 0 ? DEFAULT_AFFILIATE_TOKEN : null);
    const utm_campaign =
        url_utm_campaign ||
        (DEFAULT_UTM_CAMPAIGN && DEFAULT_UTM_CAMPAIGN.trim().length > 0 ? DEFAULT_UTM_CAMPAIGN : null);
    const marketing_queries = `${signup_device ? `&signup_device=${signup_device}` : ''}${
        date_first_contact ? `&date_first_contact=${date_first_contact}` : ''
    }${affiliate_token ? `&affiliate_token=${affiliate_token}` : ''}${utm_campaign ? `&utm_campaign=${utm_campaign}` : ''}`;

    const getOAuthUrl = () => {
        // Add redirect_uri to ensure redirect back to current domain (custom domain support)
        // According to Deriv API documentation: https://developers.deriv.com/docs/authentication
        // The redirect URL format should be: https://[YOUR_WEBSITE_URL]/redirect/?acct1=...&token1=...&cur1=...
        // This must match the "OAuth redirect URL" configured in the Deriv API Dashboard
        // IMPORTANT: Always use oauth.deriv.com (original Deriv OAuth server) regardless of custom domain
        // Custom domain OAuth (oauth.deriv.now) is not configured and will cause login failures
        const redirect_uri = `${window.location.origin}/redirect`;
        return `https://oauth.deriv.com/oauth2/authorize?app_id=${change_login_app_id || getAppId()}&l=${language}${marketing_queries}&brand=${website_name.toLowerCase()}&redirect_uri=${encodeURIComponent(redirect_uri)}`;
    };

    if (server_url && /qa/.test(server_url)) {
        return `https://${server_url}/oauth2/authorize?app_id=${getAppId()}&l=${language}${marketing_queries}&brand=${website_name.toLowerCase()}`;
    }

    if (getAppId() === domain_app_ids[window.location.hostname as keyof typeof domain_app_ids]) {
        return getOAuthUrl();
    }
    return urlForCurrentDomain(getOAuthUrl());
};
