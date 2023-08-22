import { UI_EVENT, UI_REQUEST, UI_RESPONSE } from '@onekeyfe/hd-core';
import type {
  BTCPublicKey,
  BTCSignTransactionParams,
  CoreMessage,
  KnownDevice,
} from '@onekeyfe/hd-core';
import { getHardwareSDKInstance } from './hardwareInstance';
import { BitcoinNetwork } from '../types';
import { getFromLocalStorage } from '../utils';
import {
  NETWORK,
  UI_REQUEST_REQUEST_BUTTON,
  UI_REQUEST_REQUEST_PASSPHRASE,
  UI_REQUEST_REQUEST_PIN,
  UI_REQUEST_CLOSE_UI_WINDOW,
} from '../constants';
import eventBus from '../utils/event-bus';

export default class ServiceHardware {
  device: KnownDevice | null = null;

  network: BitcoinNetwork;

  isRegistred = false;

  constructor() {
    this.network = getFromLocalStorage(NETWORK, 'mainnet');
  }

  getSDKInstance() {
    return getHardwareSDKInstance().then((instance) => {
      if (this.isRegistred) return instance;
      this.isRegistred = true;
      instance.on(UI_EVENT, (message: CoreMessage) => {
        if (message.type === UI_REQUEST.REQUEST_PIN) {
          // enter pin code on the device
          instance.uiResponse({
            type: UI_RESPONSE.RECEIVE_PIN,
            payload: '@@ONEKEY_INPUT_PIN_IN_DEVICE',
          });
          eventBus.publish(UI_REQUEST_REQUEST_PIN, message);
        }
        if (message.type === UI_REQUEST.REQUEST_PASSPHRASE) {
          instance.uiResponse({
            type: UI_RESPONSE.RECEIVE_PASSPHRASE,
            payload: {
              value: '',
              passphraseOnDevice: true,
              save: false,
            },
          });
          eventBus.publish(UI_REQUEST_REQUEST_PASSPHRASE, message);
        }
        if (message.type === UI_REQUEST.REQUEST_BUTTON) {
          eventBus.publish(UI_REQUEST_REQUEST_BUTTON, message);
        }
        if (message.type === UI_REQUEST.CLOSE_UI_WINDOW) {
          eventBus.publish(UI_REQUEST_CLOSE_UI_WINDOW, message);
        }
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
    const response = await hardwareSDK.btcSignTransaction(
      connectId,
      deviceId,
      params
    );

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
