import { isValidHexAddress } from '../../../../shared/modules/hexstring-utils';
import { InternalAccount } from '@metamask/keyring-internal-api';

export function getAccountAddressErrorMessage(
  accounts: InternalAccount[],
  newAccountAddress: string,
) {
  let errorMessage = '';
  if (
    !isValidHexAddress(newAccountAddress, {
      allowNonPrefixed: false,
      mixedCaseUseChecksum: false,
    })
  ) {
    errorMessage = 'Address Invalidate';
  }
  const isDuplicateAccountName = accounts.some(
    (item) => item.address.toLowerCase() === newAccountAddress.toLowerCase(),
  );

  if (isDuplicateAccountName) {
    errorMessage = 'Address Duplicate';
  }

  return { errorMessage };
}
