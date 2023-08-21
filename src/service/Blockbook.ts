import axios, { AxiosInstance } from 'axios';
import { UTXO } from '../types';

export default class Blockbook {
  readonly request: AxiosInstance;

  constructor() {
    this.request = axios.create({
      url: 'https://node.onekey.so/btc',
      timeout: 20000,
    });
  }

  getUtxos(xpub: string) {
    return this.request
      .get<UTXO[]>(`/api/v2/utxo/${xpub}`)
      .then((res) => res.data);
  }
}

const blockbook = new Blockbook();
export { blockbook };
