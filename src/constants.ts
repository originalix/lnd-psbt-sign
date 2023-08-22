export enum AddressEncodings {
  P2PKH = 'P2PKH', // Legacy BIP-44
  P2SH_P2WPKH = 'P2SH_P2WPKH', // BIP-49 P2WPKH nested in P2SH
  P2WPKH = 'P2WPKH', // BIP-84 P2WPKH
  P2WSH = 'P2WSH', // BIP-84 P2WSH
  P2TR = 'P2TR', // BIP-86 P2TR
}

export const NETWORK = 'NETWORK';
export const PREV_XPUB = 'PREV_XPUB';
export const PURPOSE = 'PURPOSE';
export const ACCOUNT_INDEX = 'ACCOUNT_INDEX';
export const Decimals = 8;

export const UI_REQUEST_REQUEST_PIN = 'UI_REQUEST_REQUEST_PIN';
export const UI_REQUEST_REQUEST_PASSPHRASE = 'UI_REQUEST.REQUEST_PASSPHRASE';
export const UI_REQUEST_REQUEST_BUTTON = 'UI_REQUEST_REQUEST_BUTTON';
export const UI_REQUEST_CLOSE_UI_WINDOW = 'UI_REQUEST_CLOSE_UI_WINDOW';
