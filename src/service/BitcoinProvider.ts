import BIP32Factory, { BIP32Interface } from 'bip32';
import * as ecc from '@bitcoin-js/tiny-secp256k1-asmjs';
import bs58check from 'bs58check';
import * as BitcoinJS from 'bitcoinjs-lib';
import { AddressEncodings } from '../constants';
// You must wrap a tiny-secp256k1 compatible implementation
const bip32 = BIP32Factory(ecc);

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
    [AddressEncodings.P2WSH]: {
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
}

const bitcoinProvider = new BitcoinProvider();

export { bitcoinProvider };
