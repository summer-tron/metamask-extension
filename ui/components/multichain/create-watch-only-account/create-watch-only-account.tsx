import React, {
  ChangeEvent,
  KeyboardEvent,
  KeyboardEventHandler,
  useEffect,
  useState,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { InternalAccount } from '@metamask/keyring-internal-api';
import PropTypes from 'prop-types';
import { Box, ButtonPrimary, ButtonSecondary } from '../../component-library';
import { Display } from '../../../helpers/constants/design-system';
import { FormTextField } from '../../component-library/form-text-field/form-text-field';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getAccountNameErrorMessage } from '../../../helpers/utils/accounts';
import { getMetaMaskAccountsOrdered } from '../../../selectors';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import {
  addNewWatchOnlyAccount,
  getNextAvailableAccountName as getNextAvailableAccountNameFromController,
  setAccountLabel,
} from '../../../store/actions';
import { getAccountAddressErrorMessage } from './getAccountAddressErrorMessage';

export const CreateWatchOnlyAccount = ({
  onActionComplete,
}: {
  onActionComplete: (argg0: boolean) => void;
}) => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const history = useHistory();

  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);

  const accounts: InternalAccount[] = useSelector(getMetaMaskAccountsOrdered);
  console.log('summer --- accounts', accounts);

  const [loading, setLoading] = useState(false);
  const [defaultAccountName, setDefaultAccountName] = useState('');
  const [creationError, setCreationError] = useState('');

  const [newAccountName, setNewAccountName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [isValidAccountAddress, setIsValidAccountAddress] = useState(true);
  const [addressErrorMsg, setAddressErrorMsg] = useState('');

  const trimmedAccountName = newAccountName.trim();
  const trimmedAccountAddress = newAddress.trim();

  const { isValidAccountName, errorMessage: accountErrorMsg } =
    getAccountNameErrorMessage(
      accounts,
      { t },
      trimmedAccountName || defaultAccountName,
      defaultAccountName,
    );

  useEffect(() => {
    const getNextAvailableAccountName = async () => {
      return await getNextAvailableAccountNameFromController(
        'Watch Only' as any,
      );
    };
    getNextAvailableAccountName().then(setDefaultAccountName);
  }, []);

  useEffect(() => {
    if (trimmedAccountAddress === '') {
      return;
    }
    const { errorMessage } = getAccountAddressErrorMessage(
      accounts,
      trimmedAccountAddress,
    );
    setIsValidAccountAddress(!errorMessage);
    setAddressErrorMsg(errorMessage);
  }, [accounts, trimmedAccountAddress]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setCreationError('');

    try {
      const newAccount = await dispatch(
        addNewWatchOnlyAccount(
          trimmedAccountName || defaultAccountName,
          newAddress,
        ),
      );
      console.log('summer --- create-watch-only-account', newAccount);
      if (newAddress) {
        dispatch(
          setAccountLabel(
            (newAccount as any).address,
            trimmedAccountName || defaultAccountName,
          ),
        );
      }
      setLoading(false);
      onActionComplete(true);
      history.push(mostRecentOverviewPage);
    } catch (error) {
      setLoading(false);

      let message = 'An unexpected error occurred.';
      if (error instanceof Error) {
        message = (error as Error).message;
      }
      setCreationError(message);
    }
  };

  return (
    <Box as="form" onSubmit={onSubmit}>
      <FormTextField
        autoFocus
        id="account-name"
        label={t('accountName')}
        placeholder={defaultAccountName}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setNewAccountName(e.target.value)
        }
        helpText={accountErrorMsg || creationError}
        error={!isValidAccountName || Boolean(creationError)}
        onKeyPress={
          ((e: KeyboardEvent<HTMLFormElement>) => {
            if (e.key === 'Enter') {
              onSubmit(e);
            }
          }) as unknown as KeyboardEventHandler<HTMLDivElement>
        }
      />
      <FormTextField
        id="account-address"
        label={t('address')}
        onChange={(event) => setNewAddress(event.target.value)}
        helpText={addressErrorMsg || creationError}
        error={!isValidAccountAddress || Boolean(creationError)}
        onKeyPress={
          ((e: KeyboardEvent<HTMLFormElement>) => {
            if (e.key === 'Enter') {
              onSubmit(e);
            }
          }) as unknown as KeyboardEventHandler<HTMLDivElement>
        }
      />
      <Box display={Display.Flex} marginTop={6} gap={2}>
        <ButtonSecondary
          type={
            'button' /* needs to be 'button' to prevent submitting form on cancel */
          }
          onClick={async () => await onActionComplete(false)}
          block
        >
          {t('cancel')}
        </ButtonSecondary>
        <ButtonPrimary
          type="submit"
          disabled={!isValidAccountName || !isValidAccountAddress}
          loading={loading}
          block
        >
          {t('create')}
        </ButtonPrimary>
      </Box>
    </Box>
  );
};

CreateWatchOnlyAccount.propTypes = {
  /**
   * Executes when the Create button is clicked
   */
  onActionComplete: PropTypes.func.isRequired,
};
