import { isNil } from 'lodash';
import BIP32Factory, { BIP32Interface } from 'bip32';
import * as ecc from '@bitcoin-js/tiny-secp256k1-asmjs';
import bs58check from 'bs58check';
import * as BitcoinJS from 'bitcoinjs-lib';
import coinSelect, { Target, UTXO } from 'coinselect';
import BigNumber from 'bignumber.js';
import {
  getHDPath,
  getScriptType,
  getOutputScriptType,
} from '@onekeyfe/hd-core';
import type { KnownDevice, RefTransaction } from '@onekeyfe/hd-core';
import type { Messages } from '@onekeyfe/hd-transport';
import { AddressEncodings, Decimals, NETWORK } from '../constants';
import { BitcoinNetwork, INetwork } from '../types';
import { getFromLocalStorage } from '../utils';
import { blockbook } from './Blockbook';
import { serviceHardware } from './ServiceHardware';
// You must wrap a tiny-secp256k1 compatible implementation
const bip32 = BIP32Factory(ecc);

const mainnet = {
  ...BitcoinJS.networks.bitcoin,
  segwitVersionBytes: {
    [AddressEncodings.P2SH_P2WPKH]: {
      public: 0x049d7cb2,
      private: 0x049d7878,
    },
    [AddressEncodings.P2WPKH]: {
      public: 0x04b24746,
      private: 0x04b2430c,
    },
    [AddressEncodings.P2WSH]: {
      public: 0x04b24746,
      private: 0x04b2430c,
    },
    [AddressEncodings.P2TR]: {
      public: 0x0488b21e,
      private: 0x0488ade4,
    },
  },
} as INetwork;

const testnet = {
  ...BitcoinJS.networks.testnet,
  segwitVersionBytes: {
    [AddressEncodings.P2SH_P2WPKH]: {
      public: 0x044a5262,
      private: 0x044a4e28,
    },
    [AddressEncodings.P2WPKH]: {
      public: 0x045f1cf6,
      private: 0x045f18bc,
    },
    [AddressEncodings.P2WSH]: {
      public: 0x045f1cf6,
      private: 0x045f18bc,
    },
    [AddressEncodings.P2TR]: {
      public: 0x043587cf,
      private: 0x04358394,
    },
  },
} as INetwork;

export default class BitcoinProvider {
  network: INetwork;

  networkType: BitcoinNetwork;

  constructor() {
    this.networkType = getFromLocalStorage(NETWORK, 'mainnet');
    this.network = this.networkType === 'mainnet' ? mainnet : testnet;
  }

  private _versionBytesToEncodings?: {
    public: Record<number, AddressEncodings[]>;
    private: Record<number, AddressEncodings[]>;
  };

  get versionBytesToEncodings(): {
    public: Record<number, Array<AddressEncodings>>;
    private: Record<number, Array<AddressEncodings>>;
  } {
    if (typeof this._versionBytesToEncodings === 'undefined') {
      const { network } = this;
      const tmp = {
        public: { [network.bip32.public]: [AddressEncodings.P2PKH] },
        private: { [network.bip32.private]: [AddressEncodings.P2PKH] },
      };
      Object.entries(network.segwitVersionBytes || {}).forEach(
        ([
          encoding,
          { public: publicVersionBytes, private: privateVersionBytes },
        ]) => {
          tmp.public[publicVersionBytes] = [
            ...(tmp.public[publicVersionBytes] || []),
            encoding as AddressEncodings,
          ];
          tmp.private[privateVersionBytes] = [
            ...(tmp.private[privateVersionBytes] || []),
            encoding as AddressEncodings,
          ];
        }
      );
      this._versionBytesToEncodings = tmp;
    }
    return this._versionBytesToEncodings;
  }

  networkWithSegwit(addressEncodings: AddressEncodings): BitcoinJS.Network {
    return {
      ...this.network,
      bip32:
        addressEncodings === 'P2PKH'
          ? this.network.bip32
          : {
              ...this.network.bip32,
              public: this.network.segwitVersionBytes[addressEncodings].public,
              private:
                this.network.segwitVersionBytes[addressEncodings].private,
            },
    };
  }

  xpubToAddresses(
    xpub: string,
    relativePaths: string[]
  ): Record<string, string> {
    const decodedXpub = Buffer.from(bs58check.decode(xpub));
    const versionBytes = parseInt(decodedXpub.slice(0, 4).toString('hex'), 16);
    const encoding = this.versionBytesToEncodings.public[versionBytes][0];

    const ret: Record<string, string> = {};

    const startExtendedKey = bip32.fromBase58(
      xpub,
      this.networkWithSegwit(encoding)
    );

    for (const relativePath of relativePaths) {
      const pubkey = startExtendedKey.derivePath(relativePath);
      const { address } = this.pubkeyToPayment(pubkey.publicKey, encoding);
      if (typeof address === 'string' && address.length) {
        ret[relativePath] = address;
      }
    }
    console.log(ret);
    return ret;
  }

  private pubkeyToPayment(
    pubkey: Buffer,
    encoding: AddressEncodings
  ): BitcoinJS.Payment {
    let payment: BitcoinJS.Payment = {
      pubkey,
      network: this.network,
    };

    switch (encoding) {
      case AddressEncodings.P2PKH:
        payment = BitcoinJS.payments.p2pkh(payment);
        break;

      case AddressEncodings.P2WPKH:
        payment = BitcoinJS.payments.p2wpkh(payment);
        break;

      case AddressEncodings.P2SH_P2WPKH:
        payment = BitcoinJS.payments.p2sh({
          redeem: BitcoinJS.payments.p2wpkh(payment),
          network: this.network,
        });
        break;
      case AddressEncodings.P2TR:
        payment = BitcoinJS.payments.p2tr({
          internalPubkey: pubkey.slice(1, 33),
          network: this.network,
        });
        break;

      default:
        throw new Error(`Invalid encoding: ${encoding as string}`);
    }

    return payment;
  }

  async buildTransaction({
    to,
    amount,
    xpub,
    derivePath,
    device,
  }: {
    to: string;
    amount: string;
    xpub: string;
    derivePath: string;
    device: KnownDevice;
  }) {
    const encodingXpub = this.getOutputDescriptor(xpub);
    const originUtxos = await blockbook.getUtxos(encodingXpub);
    const recommendFee = await blockbook.getRecommendedFee();
    const feeRate = recommendFee.fastestFee;
    const utxos: UTXO[] = originUtxos.map(
      ({ txid, vout, value, address, path }) => ({
        txid,
        vout,
        value: parseInt(value),
        address,
        path,
      })
    );
    const targets = [
      {
        address: to,
        value: parseInt(BigNumber(amount).shiftedBy(Decimals).toFixed()),
      },
    ];

    const { inputs, outputs, fee } = coinSelect(utxos, targets, feeRate);
    if (!inputs || !outputs || isNil(fee)) {
      throw new Error('Failed to select UTXOs');
    }

    const prevTxids = Array.from(new Set(inputs.map((i) => i.txid as string)));
    const pathMap: Record<string, string> = {};
    const addresses = inputs.map((input) => input.address);
    for (const utxo of inputs) {
      const { address, path } = utxo;
      if (addresses.includes(address)) {
        pathMap[address] = path;
      }
    }
    const prevTxs = await this.collectTxs(prevTxids);
    const response = await serviceHardware.btcSignTransaction(
      device.connectId ?? '',
      device.deviceId ?? '',
      {
        coin: this.networkType === 'mainnet' ? 'btc' : 'test',
        inputs: inputs.map((i) =>
          this.buildHardwareInput(i, pathMap[i.address])
        ),
        outputs: outputs.map((o) => this.buildHardwareOutput(o, derivePath)),
        refTxs: Object.values(prevTxs).map((i) => this.buildPrevTx(i)),
      }
    );

    console.log('response ====>>>: ', response);
  }

  getOutputDescriptor(xpub: string) {
    if (!xpub) {
      throw new Error('xpub is required');
    }
    const decodedXpub = Buffer.from(bs58check.decode(xpub));
    const versionBytes = parseInt(decodedXpub.slice(0, 4).toString('hex'), 16);
    const encoding = this.versionBytesToEncodings.public[versionBytes][0];
    switch (encoding) {
      case AddressEncodings.P2PKH:
        return `pkh(${xpub})`;
      case AddressEncodings.P2SH_P2WPKH:
        return `sh(wpkh(${xpub}))`;
      case AddressEncodings.P2WPKH:
        return `wpkh(${xpub})`;
      case AddressEncodings.P2TR:
        return `tr(${xpub})`;
      default:
        return xpub;
    }
  }

  async collectTxs(txids: string[]): Promise<Record<string, string>> {
    const lookup: Record<string, string> = {};

    for (let i = 0, batchSize = 5; i < txids.length; i += batchSize) {
      const batchTxids = txids.slice(i, i + batchSize);
      const txs = await Promise.all(
        batchTxids.map((txid) => blockbook.getRawTransaction(txid))
      );
      batchTxids.forEach((txid, index) => (lookup[txid] = txs[index]));
    }
    return lookup;
  }

  buildHardwareInput(input: UTXO, path: string): Messages.TxInputType {
    const addressN = getHDPath(path);
    const scriptType = getScriptType(addressN);
    // @ts-expect-error
    return {
      prev_index: input.vout,
      prev_hash: input.txid as string,
      amount: `${input.value}`,
      address_n: addressN,
      script_type: scriptType,
    };
  }

  buildHardwareOutput(
    output: Target,
    changePath: string
  ): Messages.TxOutputType {
    if (!output.address) {
      const addressN = getHDPath(changePath);
      const scriptType = getOutputScriptType(addressN);
      return {
        script_type: scriptType,
        address_n: addressN,
        amount: `${output.value ?? 0}`,
      };
    }
    return {
      script_type: 'PAYTOADDRESS',
      address: output.address,
      amount: `${output.value ?? 0}`,
    };
  }

  private buildPrevTx(rawTx: string): RefTransaction {
    const tx = BitcoinJS.Transaction.fromHex(rawTx);

    return {
      hash: tx.getId(),
      version: tx.version,
      inputs: tx.ins.map((i) => ({
        prev_hash: i.hash.reverse().toString('hex'),
        prev_index: i.index,
        script_sig: i.script.toString('hex'),
        sequence: i.sequence,
      })),
      bin_outputs: tx.outs.map((o) => ({
        amount: o.value,
        script_pubkey: o.script.toString('hex'),
      })),
      lock_time: tx.locktime,
    };
  }
}

const bitcoinProvider = new BitcoinProvider();

export { bitcoinProvider };
