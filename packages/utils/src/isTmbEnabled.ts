const isTmbEnabled = async () => {
    const search = window.location.search;
    let platform;
    if (search) {
        const url_params = new URLSearchParams(search);
        platform = url_params.get('platform');
    }
    // add deriv and impersonation check
    const triggerImplicitFlow = platform === 'derivgo' || sessionStorage.getItem('is_disable_tmb') === 'true';

    if (triggerImplicitFlow) {
        sessionStorage.setItem('is_disable_tmb', 'true');
    }

    // TMB only works for Deriv official domains due to CORS restrictions
    // For custom domains, use OAuth tokens directly from URL callback
    const allowedDomains = ['deriv.com', 'deriv.dev', 'binary.sx', 'pages.dev', 'localhost', 'deriv.be', 'deriv.me'];
    const currentDomain = window.location.hostname.split('.').slice(-2).join('.');
    const isOfficialDomain =
        allowedDomains.includes(currentDomain) ||
        window.location.hostname.includes('localhost') ||
        window.location.hostname.includes('deriv.dev') ||
        window.location.hostname.includes('binary.sx') ||
        window.location.hostname.includes('pages.dev');

    // If not official domain, disable TMB to avoid CORS errors
    if (!isOfficialDomain) {
        return false;
    }

    const storedValue = localStorage.getItem('is_tmb_enabled');

    return storedValue !== null ? storedValue === 'true' : !triggerImplicitFlow && true;
};

export default isTmbEnabled;
