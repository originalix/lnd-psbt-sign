declare module 'coinselect' {
  export interface UTXO {
    txid: string | Buffer;
    vout: number;
    value: number;
    nonWitnessUtxo?: Buffer;
    address: string;
    path: string;
    witnessUtxo?: {
      script: Buffer;
      value: number;
    };
  }
  export interface Target {
    address: string;
    value?: number;
    path?: string;
  }
  export interface SelectedUTXO {
    inputs?: UTXO[];
    outputs?: Target[];
    fee: number;
  }
  export default function coinSelect(
    utxos: UTXO[],
    outputs: Target[],
    feeRate: number
  ): SelectedUTXO;
}
