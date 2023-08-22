import { UI_REQUEST } from '@onekeyfe/hd-core';
import type {
  BTCPublicKey,
  BTCSignTransactionParams,
  CoreMessage,
  KnownDevice,
} from '@onekeyfe/hd-core';
import { getHardwareSDKInstance } from './hardwareInstance';
import { BitcoinNetwork } from '../types';
import { getFromLocalStorage } from '../utils';
import { NETWORK } from '../constants';

export default class ServiceHardware {
  device: KnownDevice | null = null;

  network: BitcoinNetwork;

  constructor() {
    this.network = getFromLocalStorage(NETWORK, 'mainnet');
  }

  getSDKInstance() {
    return getHardwareSDKInstance().then((instance) => {
      instance.on(UI_REQUEST.REQUEST_PIN, (message: CoreMessage) => {
        console.log('REQUEST_PIN', message);
      });
      return instance;
    });
  }

  async searchDevice() {
    const hardwareSDK = await this.getSDKInstance();
    return hardwareSDK.searchDevices();
  }

  async setDevice() {
    const response = await this.searchDevice();
    if (response.success && response.payload.length > 0) {
      this.device = response.payload[0] as KnownDevice;
      return this.device;
    }
    return null;
  }

  async getPublicKey(path: string[]): Promise<BTCPublicKey[]> {
    if (!this.device?.connectId) {
      throw new Error('device not found');
    }
    const hardwareSDK = await this.getSDKInstance();
    const params =
      path.length <= 1
        ? {
            path: path[0],
            coin: this.getCoin(),
            showOnOneKey: false,
          }
        : {
            bundle: path.map((p) => ({
              path: p,
              coin: this.getCoin(),
              showOnOneKey: false,
            })),
          };
    const response = await hardwareSDK.btcGetPublicKey(
      this.device.connectId,
      this.device.deviceId ?? '',
      params
    );
    if (response.success) {
      if (path.length <= 1) {
        return [response.payload as unknown as BTCPublicKey];
      }
      return response.payload;
    }
    throw new Error(response.payload.error);
  }

  async btcSignTransaction(
    connectId: string,
    deviceId: string,
    params: BTCSignTransactionParams
  ) {
    const hardwareSDK = await this.getSDKInstance();
    const response = await hardwareSDK.btcSignTransaction(connectId, deviceId, {
      coin: params.coin,
      inputs: params.inputs,
      outputs: params.outputs,
      refTxs: params.refTxs,
    });

    if (response.success) {
      return response.payload;
    }

    throw new Error(response.payload.error);
  }

  private getCoin() {
    return this.network === 'mainnet' ? 'btc' : 'test';
  }
}

const serviceHardware = new ServiceHardware();
export { serviceHardware };
