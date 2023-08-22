import * as BitcoinJS from 'bitcoinjs-lib';
import type {
  Bip32Derivation,
  NonWitnessUtxo,
  RedeemScript,
  TapInternalKey,
  WitnessUtxo,
} from 'bip174/src/lib/interfaces';
import { AddressEncodings } from '../constants';

export interface IUTXO {
  txid: string;
  vout: number;
  value: string;
  address: string;
  path: string;
}

export interface MempoolRecommendedFee {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

export type BitcoinNetwork = 'mainnet' | 'testnet';

export interface INetwork extends BitcoinJS.Network {
  // Extends the network interface to support:
  //   - segwit address version bytes
  segwitVersionBytes: Record<AddressEncodings, BitcoinJS.Network['bip32']>;
}

export type AddressValidation = {
  isValid: boolean;
  normalizedAddress?: string;
  displayAddress?: string;
  encoding?: string;
};

export type TransactionMixin = {
  nonWitnessUtxo?: NonWitnessUtxo;
  witnessUtxo?: WitnessUtxo;
  redeemScript?: RedeemScript;
  tapInternalKey?: TapInternalKey;
  bip32Derivation?: Bip32Derivation[];
};
