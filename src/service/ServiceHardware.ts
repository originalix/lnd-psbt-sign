import { UI_REQUEST } from '@onekeyfe/hd-core';
import type { CoreMessage, KnownDevice } from '@onekeyfe/hd-core';
import { getHardwareSDKInstance } from './hardwareInstance';

export default class ServiceHardware {
  device: KnownDevice | null = null;

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

  async getPublicKey(path: string) {
    if (!this.device?.connectId) {
      throw new Error('device not found');
    }
    const hardwareSDK = await this.getSDKInstance();
    const response = await hardwareSDK.btcGetPublicKey(
      this.device.connectId,
      this.device.deviceId ?? '',
      {
        path,
        coin: 'btc',
        showOnOneKey: false,
      }
    );
    if (response.success) {
      return response.payload;
    }
    throw new Error(response.payload.error);
  }
}

const serviceHardware = new ServiceHardware();
export { serviceHardware };
