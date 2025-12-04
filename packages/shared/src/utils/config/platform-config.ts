import React from 'react';
import { getInitialLanguage } from '@deriv/translations';
import i18n from 'i18next';
import { setLocale, initMoment } from '../date';
import { routes } from '../routes';
import { getDomainUrl } from '../url';

type TPlatform = {
    icon_text?: string;
    is_hard_redirect: boolean;
    platform_name: string;
    route_to_path: string;
    url?: string;
};

type TPlatforms = Record<'p2p' | 'p2p_v2' | 'derivgo' | 'tradershub_os', TPlatform>;

// TEMPORARY FALLBACK: Until external apps are deployed to custom subdomains,
// we'll use deriv.com as fallback. Set to true when ready to use custom domain.
const USE_CUSTOM_DOMAIN_FOR_EXTERNAL_APPS = false; // TODO: Set to true when apps are deployed
const getExternalAppsDomain = () => {
    const currentDomain = getDomainUrl();
    const isCustomDomain = !['deriv.com', 'deriv.me', 'deriv.be'].includes(currentDomain);
    return isCustomDomain && USE_CUSTOM_DOMAIN_FOR_EXTERNAL_APPS ? currentDomain : 'deriv.com';
};

export const tradershub_os_url =
    process.env.NODE_ENV === 'production'
        ? `https://hub.${getExternalAppsDomain()}/tradershub`
        : `https://staging-hub.${getExternalAppsDomain()}/tradershub`;

// TODO: This should be moved to PlatformContext
export const platforms: TPlatforms = {
    p2p: {
        icon_text: undefined,
        is_hard_redirect: true,
        platform_name: 'Deriv P2P',
        route_to_path: routes.cashier_p2p,
        url: `https://app.${getDomainUrl()}/cashier/p2p`,
    },
    derivgo: {
        icon_text: undefined,
        is_hard_redirect: true,
        platform_name: 'Deriv GO',
        route_to_path: '',
        url: `https://app.${getDomainUrl()}/redirect/derivgo`,
    },
    p2p_v2: {
        icon_text: undefined,
        is_hard_redirect: true,
        platform_name: 'Deriv P2P',
        route_to_path: '',
        url:
            process.env.NODE_ENV === 'production'
                ? `https://p2p.${getExternalAppsDomain()}`
                : `https://staging-p2p.${getExternalAppsDomain()}`,
    },
    tradershub_os: {
        icon_text: undefined,
        is_hard_redirect: true,
        platform_name: 'TradersHub',
        route_to_path: '',
        url: tradershub_os_url,
    },
};

export const useOnLoadTranslation = () => {
    const [is_loaded, setLoaded] = React.useState(false);

    React.useEffect(() => {
        if (!i18n.language) {
            i18n.language = getInitialLanguage();
        }
        (async () => {
            await initMoment(i18n.language);
            await setLocale(i18n.language);
        })();
        const is_english = i18n.language === 'EN';
        if (is_english) {
            setLoaded(true);
        } else {
            i18n.store.on('added', () => {
                setLoaded(true);
            });
        }
        return () => i18n.store.off('added');
    }, []);

    return [is_loaded, setLoaded];
};
