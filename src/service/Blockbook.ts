/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import axios, { AxiosInstance } from 'axios';
import memoizee from 'memoizee';
import { BitcoinNetwork, MempoolRecommendedFee, IUTXO } from '../types';
import { getFromLocalStorage } from '../utils';
import { NETWORK } from '../constants';

export default class Blockbook {
  readonly request: AxiosInstance;

  network: BitcoinNetwork;

  constructor() {
    this.network = getFromLocalStorage(NETWORK, 'mainnet');
    const baseURL =
      this.network === 'mainnet'
        ? 'https://node.onekey.so/btc'
        : 'https://node.onekey.so/tbtc';
    this.request = axios.create({
      baseURL,
      timeout: 20000,
    });
  }

  getUtxos: (xpub: string) => Promise<IUTXO[]> = memoizee(
    (xpub: string) =>
      this.request.get<IUTXO[]>(`/api/v2/utxo/${xpub}`).then((res) => res.data),
    {
      promise: true,
      maxAge: 60 * 1000,
    }
  );

  getRecommendedFee: () => Promise<MempoolRecommendedFee> = memoizee(
    () =>
      axios
        .get<MempoolRecommendedFee>(
          this.network === 'mainnet'
            ? 'https://mempool.space/api/v1/fees/recommended'
            : 'https://mempool.space/testnet/api/v1/fees/recommended'
        )
        .then((res) => res.data),
    {
      promise: true,
      maxAge: 60 * 1000,
    }
  );

  async getRawTransaction(txid: string): Promise<string> {
    const resp = await this.request
      .get(`/api/v2/tx/${txid}`)
      .then((i) => i.data);

    return resp.hex as unknown as string;
  }

  async broadcastTransaction(rawTx: string): Promise<string> {
    const res = await this.request
      .post(`/api/v2/sendtx/`, rawTx, {
        headers: {
          'Content-Type': 'text/plain',
        },
      })
      .then((i) => i.data);
    return res?.result ?? '';
  }
}

const blockbook = new Blockbook();
export { blockbook };
