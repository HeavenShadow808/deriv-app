import { useEffect } from 'react';
import { useHistory, useLocation, withRouter } from 'react-router-dom';

import { Button } from '@deriv/components';
import { useGrowthbookGetFeatureValue } from '@deriv/hooks';
import { routes } from '@deriv/shared';
import { Localize } from '@deriv/translations';
import { Callback } from '@deriv-com/auth-client';

import AccessDeniedScreen from './AccessDeniedScreen';

const CallbackPage = () => {
    const history = useHistory();
    const location = useLocation();
    const has_access_denied_error = location.search.includes('access_denied');

    const [isDuplicateLoginEnabled] = useGrowthbookGetFeatureValue({
        featureFlag: 'duplicate-login',
    });

    // Fallback handler: Process OAuth tokens directly from URL if Callback component fails
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const hasOAuthTokens = urlParams.has('acct1') && urlParams.has('token1');

        // Only process if we have OAuth tokens and no error
        if (hasOAuthTokens && !has_access_denied_error) {
            // Check if tokens are already processed (stored in localStorage)
            const storedTokens = localStorage.getItem('config.tokens');
            if (!storedTokens) {
                // Extract tokens from URL
                const tokens: Record<string, string> = {};
                let index = 1;
                while (urlParams.has(`acct${index}`) && urlParams.has(`token${index}`)) {
                    tokens[`acct${index}`] = urlParams.get(`acct${index}`) || '';
                    tokens[`token${index}`] = urlParams.get(`token${index}`) || '';
                    if (urlParams.has(`cur${index}`)) {
                        tokens[`cur${index}`] = urlParams.get(`cur${index}`) || '';
                    }
                    index++;
                }

                // Process tokens if we have at least one account
                if (tokens.acct1 && tokens.token1) {
                    try {
                        localStorage.setItem('config.tokens', JSON.stringify(tokens));
                        localStorage.setItem('config.account1', tokens.token1);
                        localStorage.setItem('active_loginid', tokens.acct1);
                        if (!sessionStorage.getItem('active_loginid') && /^(CR|MF|VRTC)\d/.test(tokens.acct1)) {
                            sessionStorage.setItem('active_loginid', tokens.acct1);
                        }
                        if (!sessionStorage.getItem('active_wallet_loginid') && /^(CRW|MFW|VRW)\d/.test(tokens.acct1)) {
                            sessionStorage.setItem('active_wallet_loginid', tokens.acct1);
                        }

                        // Redirect to traders hub
                        const redirectTo = sessionStorage.getItem('tradershub_redirect_to');
                        const postLoginRedirectUri = localStorage.getItem('config.post_login_redirect_uri');

                        if (redirectTo) {
                            sessionStorage.removeItem('tradershub_redirect_to');
                            window.location.href = redirectTo;
                        } else if (postLoginRedirectUri) {
                            window.location.href = postLoginRedirectUri;
                        } else {
                            window.location.href = routes.traders_hub;
                        }
                    } catch (error) {
                        // eslint-disable-next-line no-console
                        console.error('Failed to process OAuth tokens:', error);
                    }
                }
            }
        }
    }, [location.search, has_access_denied_error]);

    if (isDuplicateLoginEnabled && has_access_denied_error) {
        return <AccessDeniedScreen />;
    }
    return (
        <Callback
            onSignInSuccess={(tokens: Record<string, string>) => {
                localStorage.setItem('config.tokens', JSON.stringify(tokens));
                localStorage.setItem('config.account1', tokens.token1);
                localStorage.setItem('active_loginid', tokens.acct1);
                if (!sessionStorage.getItem('active_loginid') && /^(CR|MF|VRTC)\d/.test(tokens.acct1)) {
                    sessionStorage.setItem('active_loginid', tokens.acct1);
                }
                if (!sessionStorage.getItem('active_wallet_loginid') && /^(CRW|MFW|VRW)\d/.test(tokens.acct1)) {
                    sessionStorage.setItem('active_wallet_loginid', tokens.acct1);
                }
                const redirectTo = sessionStorage.getItem('tradershub_redirect_to');
                const postLoginRedirectUri = localStorage.getItem('config.post_login_redirect_uri') || '';
                const params = new URLSearchParams(postLoginRedirectUri);
                const containsAccount = params.get('account');

                //added a check for postLoginRedirectUri to basically sync account when user created a new currency from Tradershub and redirected back to DTrader
                if (redirectTo || (postLoginRedirectUri && !!containsAccount)) {
                    const params = new URLSearchParams(redirectTo || postLoginRedirectUri);
                    const queryAccount = params.get('account');
                    let matchingLoginId: string | undefined,
                        matchingToken: string | undefined,
                        matchingWalletLoginId: string | undefined;
                    if (queryAccount?.toLowerCase() !== 'demo') {
                        Object.keys(tokens).find(key => {
                            if (
                                key.startsWith('cur') &&
                                tokens[key].toLocaleLowerCase() === queryAccount?.toLocaleLowerCase()
                            ) {
                                const sequence = key.replace('cur', '');
                                const isNotCRWallet =
                                    tokens[`acct${sequence}`]?.startsWith('CR') &&
                                    !tokens[`acct${sequence}`]?.startsWith('CRW');
                                const isCRWallet = tokens[`acct${sequence}`]?.startsWith('CRW');
                                const isNotMFWallet =
                                    tokens[`acct${sequence}`]?.startsWith('MF') &&
                                    !tokens[`acct${sequence}`]?.startsWith('MFW');
                                const isMFWallet = tokens[`acct${sequence}`]?.startsWith('MFW');
                                if (isNotCRWallet || isNotMFWallet) {
                                    if (!matchingLoginId && !matchingToken) {
                                        matchingLoginId = tokens[`acct${sequence}`];
                                        matchingToken = tokens[`token${sequence}`];
                                    }
                                }
                                if (isCRWallet || isMFWallet) {
                                    matchingWalletLoginId = tokens[`acct${sequence}`];
                                }
                            }
                        });
                    } else {
                        Object.keys(tokens).find(key => {
                            if (key.startsWith('cur') && tokens[key] === 'USD') {
                                // get currency sequence number, e.g. cur1=1, cur2=2
                                const sequence = key.replace('cur', '');
                                const isDemo = tokens[`acct${sequence}`]?.startsWith('VRTC');
                                const isWalletDemo = tokens[`acct${sequence}`]?.startsWith('VRW');

                                if (isDemo) {
                                    matchingLoginId = tokens[`acct${sequence}`];
                                    matchingToken = tokens[`token${sequence}`];
                                }
                                if (isWalletDemo) {
                                    matchingWalletLoginId = tokens[`acct${sequence}`];
                                }
                            }
                        });
                    }
                    if (matchingLoginId && matchingToken) {
                        sessionStorage.setItem('active_loginid', matchingLoginId);
                        localStorage.setItem('config.account1', matchingToken);
                        localStorage.setItem('active_loginid', matchingLoginId);
                    } else if (!matchingWalletLoginId && !matchingToken && !tokens.acct1.startsWith('CRW')) {
                        if (tokens.acct1.startsWith('VR')) {
                            const url = new URL(window.location.href);
                            url.searchParams.set('account', 'demo');
                            window.history.replaceState({}, '', url.toString());
                        } else {
                            const url = new URL(window.location.href);
                            url.searchParams.set('account', tokens.cur1.toString());
                            window.history.replaceState({}, '', url.toString());
                        }
                        sessionStorage.setItem('active_loginid', tokens.acct1);
                        localStorage.setItem('config.account1', tokens.token1);
                        localStorage.setItem('active_loginid', tokens.acct1);
                    }
                    if (matchingWalletLoginId && matchingToken) {
                        sessionStorage.setItem('active_wallet_loginid', matchingWalletLoginId);
                    }

                    sessionStorage.removeItem('tradershub_redirect_to');
                    window.history.replaceState({}, '', redirectTo || postLoginRedirectUri);
                    window.location.href = redirectTo || postLoginRedirectUri;
                } else {
                    const postLoginRedirectUri = localStorage.getItem('config.post_login_redirect_uri');
                    if (postLoginRedirectUri) {
                        window.history.replaceState({}, '', postLoginRedirectUri);
                        window.location.href = postLoginRedirectUri;
                    } else {
                        window.history.replaceState({}, '', routes.traders_hub);
                        window.location.href = routes.traders_hub;
                    }
                }
            }}
            renderReturnButton={() => {
                return (
                    <Button
                        onClick={() => {
                            history.push('/');
                            window.location.reload();
                        }}
                        secondary
                        is_circular
                    >
                        <Localize i18n_default_text='Try again' />
                    </Button>
                );
            }}
        />
    );
};

export default withRouter(CallbackPage);
