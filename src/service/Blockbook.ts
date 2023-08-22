import axios, { AxiosInstance } from 'axios';
import memoizee from 'memoizee';
import { BitcoinNetwork, MempoolRecommendedFee, UTXO } from '../types';
import { getFromLocalStorage } from '../utils';
import { NETWORK } from '../constants';

export default class Blockbook {
  readonly request: AxiosInstance;

  network: BitcoinNetwork;

  constructor() {
    this.request = axios.create({
      url: 'https://node.onekey.so/btc',
      timeout: 20000,
    });
    this.network = getFromLocalStorage(NETWORK, 'mainnet');
  }

  getUtxos: (xpub: string) => Promise<UTXO[]> = memoizee(
    (xpub: string) =>
      this.request.get<UTXO[]>(`/api/v2/utxo/${xpub}`).then((res) => res.data),
    {
      promise: true,
      maxAge: 60 * 1000,
    }
  );

  getRecommendedFee: () => Promise<MempoolRecommendedFee> = memoizee(
    () =>
      axios
        .get<MempoolRecommendedFee>(
          'https://mempool.space/api/v1/fees/recommended'
        )
        .then((res) => res.data),
    {
      promise: true,
      maxAge: 60 * 1000,
    }
  );
}

const blockbook = new Blockbook();
export { blockbook };
