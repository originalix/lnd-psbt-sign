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
