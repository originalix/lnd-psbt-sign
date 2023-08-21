import memoizee from 'memoizee';
import OneKeyWebSDK from '@onekeyfe/hd-web-sdk';
import type { ConnectSettings, CoreApi } from '@onekeyfe/hd-core';

const { HardwareWebSdk: HardwareSDK } = OneKeyWebSDK;

let initialized = false;

export const getHardwareSDKInstance = memoizee(
  async () =>
    // eslint-disable-next-line no-async-promise-executor
    new Promise<CoreApi>(async (resolve, reject) => {
      if (initialized) {
        resolve(HardwareSDK);
        return;
      }
      const settings: Partial<ConnectSettings> = {
        debug: true,
        connectSrc: 'https://jssdk.onekey.so/0.3.24/',
        preRelease: false,
      };

      try {
        await HardwareSDK.init(settings);
        initialized = true;
        resolve(HardwareSDK);
      } catch (e) {
        reject(e);
      }
    }),
  {
    promise: true,
    max: 1,
  }
);
