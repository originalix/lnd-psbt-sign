import * as ecc from '@bitcoin-js/tiny-secp256k1-asmjs';
import ECPairFactory from 'ecpair';

const ECPair = ECPairFactory(ecc);
export function getFromLocalStorage<T>(key: string, defaultValue: T): T {
  const value = localStorage.getItem(key);
  if (value !== null) {
    return JSON.parse(value) as T;
  }
  return defaultValue;
}

type ErrorType = undefined | string | Error;
const check = (statement: any, orError?: ErrorType) => {
  let error;
  if (!statement) {
    error = orError || 'Invalid statement';
    error = orError instanceof Error ? orError : new Error(orError);

    throw error;
  }
};

export const checkIsDefined = <T>(something?: T, orError?: ErrorType): T => {
  check(
    typeof something !== 'undefined',
    orError || 'Expect defined but actually undefined'
  );
  return something as T;
};

export const validator = (
  pubkey: Buffer,
  msghash: Buffer,
  signature: Buffer
): boolean => ECPair.fromPublicKey(pubkey).verify(msghash, signature);
