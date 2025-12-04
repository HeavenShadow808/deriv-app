import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useCreateWallet, useIsEuRegion, useLandingCompany, useWalletAccountsList } from '@deriv/api-v2';
import { LabelPairedCheckMdFillIcon, LabelPairedPlusMdFillIcon } from '@deriv/quill-icons';
import { Localize, useTranslations } from '@deriv-com/translations';
import { Button, useDevice } from '@deriv-com/ui';
import { DEFAULT_AFFILIATE_TOKEN, DEFAULT_UTM_CAMPAIGN } from '@deriv/shared';
import { redirectToOutSystems } from '../../helpers/urls';
import useSyncLocalStorageClientAccounts from '../../hooks/useSyncLocalStorageClientAccounts';
import useWalletAccountSwitcher from '../../hooks/useWalletAccountSwitcher';
import { TWalletCarouselItem } from '../../types';
import { useModal } from '../ModalProvider';
import { WalletAddedSuccess } from '../WalletAddedSuccess';
import { WalletCurrencyIcon } from '../WalletCurrencyIcon';
import { WalletError } from '../WalletError';

const WalletsAddMoreCardBanner: React.FC<TWalletCarouselItem> = ({
    currency,
    is_added: isAdded,
    is_crypto: isCrypto,
}) => {
    const switchWalletAccount = useWalletAccountSwitcher();

    const { data, error, isLoading: isWalletCreationLoading, mutateAsync, status } = useCreateWallet();
    const { isDesktop } = useDevice();
    const history = useHistory();
    const modal = useModal();
    const { addWalletAccountToLocalStorage } = useSyncLocalStorageClientAccounts();
    const { localize } = useTranslations();
    const { data: isEuRegion } = useIsEuRegion();
    const { data: landingCompany } = useLandingCompany();
    const { data: wallets } = useWalletAccountsList();
    const hasAnyActiveRealWallets = wallets?.some(wallet => !wallet.is_virtual && !wallet.is_disabled);
    const shortcode = landingCompany?.financial_company?.shortcode ?? landingCompany?.gaming_company?.shortcode;

    useEffect(
        () => {
            if (status === 'error') {
                modal.show(
                    <WalletError
                        buttonText={localize('Close')}
                        errorMessage={error.error.message}
                        onClick={() => modal.hide()}
                    />
                );
            } else if (status === 'success') {
                modal.show(
                    <WalletAddedSuccess
                        currency={data?.currency}
                        displayBalance={data?.display_balance ?? `0.00 ${data?.currency}`}
                        onPrimaryButtonClick={() => {
                            history.push('/wallet/deposit');
                            modal.hide();
                        }}
                        onSecondaryButtonClick={() => modal.hide()}
                    />
                );
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [
            data?.currency,
            data?.display_balance,
            data?.landing_company_shortcode,
            error?.error.message,
            isDesktop,
            status,
        ]
    );

    return (
        <div className='wallets-add-more__banner'>
            <div className='wallets-add-more__banner-header'>
                <WalletCurrencyIcon currency={currency ?? 'USD'} size={isDesktop ? 'sm' : 'xs'} />
            </div>
            <Button
                color='white'
                disabled={isAdded || isWalletCreationLoading}
                icon={
                    // TODO: Replace hex colors with values from Deriv UI
                    isAdded ? (
                        <LabelPairedCheckMdFillIcon fill='#333333' />
                    ) : (
                        <LabelPairedPlusMdFillIcon fill='#333333' />
                    )
                }
                onClick={async e => {
                    e.stopPropagation();

                    if (!currency) return;

                    if (isEuRegion || !hasAnyActiveRealWallets) {
                        return redirectToOutSystems(shortcode, currency);
                    }

                    // Add affiliate_token and utm_campaign for affiliate tracking (as per Deriv API documentation)
                    // Documentation: https://developers.deriv.com/docs/create-account-using-api
                    // Documentation: https://developers.deriv.com/docs/affiliates
                    const url_params = new URLSearchParams(window.location.search);
                    const url_affiliate_token =
                        url_params.get('affiliate_token') || url_params.get('sidc') || url_params.get('sidi');
                    const url_utm_campaign = url_params.get('utm_campaign');
                    // Use URL parameter if provided, otherwise use default from config
                    const affiliate_token =
                        url_affiliate_token ||
                        (DEFAULT_AFFILIATE_TOKEN && DEFAULT_AFFILIATE_TOKEN.trim().length > 0
                            ? DEFAULT_AFFILIATE_TOKEN
                            : null);
                    const utm_campaign =
                        url_utm_campaign ||
                        (DEFAULT_UTM_CAMPAIGN && DEFAULT_UTM_CAMPAIGN.trim().length > 0 ? DEFAULT_UTM_CAMPAIGN : null);

                    const createAccountPayload: Parameters<typeof mutateAsync>[0] & {
                        affiliate_token?: string;
                        utm_campaign?: string;
                    } = {
                        account_type: isCrypto ? 'crypto' : 'doughflow',
                        currency,
                    };

                    // Add affiliate tracking to API request (as per Deriv API documentation)
                    // Documentation: https://developers.deriv.com/docs/create-account-using-api
                    // Documentation: https://developers.deriv.com/docs/affiliates
                    if (affiliate_token) {
                        createAccountPayload.affiliate_token = affiliate_token;
                    }
                    if (utm_campaign) {
                        createAccountPayload.utm_campaign = utm_campaign;
                    }

                    const createAccountResponse = await mutateAsync(createAccountPayload);

                    const newAccountWallet = createAccountResponse?.new_account_wallet;

                    if (!newAccountWallet) return;

                    await addWalletAccountToLocalStorage({ ...newAccountWallet, display_balance: `0.00 ${currency}` });
                    switchWalletAccount(newAccountWallet.client_id);
                }}
                size={isDesktop ? 'lg' : 'sm'}
                textSize='sm'
            >
                {isAdded ? <Localize i18n_default_text='Added' /> : <Localize i18n_default_text='Add' />}
            </Button>
        </div>
    );
};

export default WalletsAddMoreCardBanner;
