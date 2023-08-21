import BIP32Factory, { BIP32Interface } from 'bip32';
// import * as ecc from 'tiny-secp256k1';
import bs58check from 'bs58check';
import * as BitcoinJS from 'bitcoinjs-lib';
import { AddressEncodings } from '../constants';
// You must wrap a tiny-secp256k1 compatible implementation
// const bip32 = BIP32Factory(ecc);

const network = {
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
    [AddressEncodings.P2TR]: {
      public: 0x0488b21e,
      private: 0x0488ade4,
    },
  },
};

export default class BitcoinProvider {
  readonly network = network;

  private _versionBytesToEncodings?: {
    public: Record<number, AddressEncodings[]>;
    private: Record<number, AddressEncodings[]>;
  };

  get versionBytesToEncodings(): {
    public: Record<number, Array<AddressEncodings>>;
    private: Record<number, Array<AddressEncodings>>;
  } {
    if (typeof this._versionBytesToEncodings === 'undefined') {
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

  xpubToAddresses(
    xpub: string,
    relativePaths: string[],
    addressEncoding?: AddressEncodings
  ): Record<string, string> {
    const decodedXpub = Buffer.from(bs58check.decode(xpub));
    const versionBytes = parseInt(decodedXpub.slice(0, 4).toString('hex'), 16);
    const encoding = this.versionBytesToEncodings.public[versionBytes][0];

    const ret: Record<string, string> = {};
    // @ts-expect-error
    const bip32 = BIP32Factory({});

    // const startExtendedKey = {
    //   chainCode: Buffer.from(decodedXpub.slice(13, 45)),
    //   key: Buffer.from(decodedXpub.slice(45, 78)),
    // };
    const startExtendedKey = bip32.fromBase58(xpub, this.network);

    const cache = new Map();

    const pubkey = startExtendedKey.derivePath(`m/84'/0'/0'/0/0`);

    // for (const path of relativePaths) {
    //   let extendedKey = startExtendedKey;
    //   let relPath = '';

    //   const parts = path.split('/');
    //   for (const part of parts) {
    //     relPath += relPath === '' ? part : `/${part}`;
    //     if (cache.has(relPath)) {
    //       // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    //       extendedKey = cache.get(relPath);
    //       // eslint-disable-next-line no-continue
    //       continue;
    //     }

    //     const index = part.endsWith("'")
    //       ? parseInt(part.slice(0, -1)) + 2 ** 31
    //       : parseInt(part);
    //     // const node = bip32.fromPublicKey(
    //     //   extendedKey.publicKey,
    //     //   extendedKey.chainCode,
    //     //   this.network
    //     // );
    //     extendedKey = node.derivePath(`${index}`);
    //     cache.set(relPath, extendedKey);
    //   }

    // const pubkey = taproot && inscribe ? fixedPublickey : extendedKey.key;
    const { address } = this.pubkeyToPayment(pubkey.publicKey, encoding);
    console.log(address);
    return { address: address ?? '' };
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
}

const bitcoinProvider = new BitcoinProvider();

export { bitcoinProvider };
