import { useState, useEffect, useRef } from 'react';
import './App.css';
import { useLocalStorage } from 'react-use';
import { BTCPublicKey } from '@onekeyfe/hd-core';
import { serviceHardware } from './service/ServiceHardware';
import { bitcoinProvider } from './service/BitcoinProvider';
import { blockbook } from './service/Blockbook';
import { NETWORK } from './constants';

function App() {
  const [network, setNetwork] = useLocalStorage(NETWORK, 'mainnet');
  const isTestnet = network === 'testnet';
  const path = `m/84'/${isTestnet ? 1 : 0}'/2'`;
  const [address, setAddress] = useState('');
  const [device, setDevice] = useState<typeof serviceHardware.device>(
    serviceHardware.device
  );
  const xpubRef = useRef<BTCPublicKey>();

  useEffect(() => {
    blockbook.getRecommendedFee();
  }, []);

  const getDevice = async () => {
    const deviceResult = await serviceHardware.setDevice();
    setDevice(deviceResult);
  };

  const getXpub = () => {
    serviceHardware.getPublicKey([path]).then((res) => {
      const pubkey = res[0];
      console.log(pubkey);
      const relativePath = '0/0';
      const result = bitcoinProvider.xpubToAddresses(pubkey.xpub, ['0/0']);
      setAddress(result[relativePath]);
      xpubRef.current = pubkey;
    });
  };

  const buildTx = () => {
    if (!device) {
      alert('Please connect device first');
      return;
    }

    bitcoinProvider.buildTransaction({
      to: '2N1n8YcwYgf3ng171pLsUyzR7AGqrBSN9Kj',
      amount: '0.003',
      xpub: xpubRef.current?.xpubSegwit ?? '',
      derivePath: `${path}/0/0`,
      currentAddress: address,
      device,
    });
  };

  return (
    <div className="App">
      <h2>Lightning network psbt sign</h2>
      <div>
        <p>Device name: {device?.name ?? '-'}</p>
        <p>Device label: {device?.label ?? '-'}</p>
      </div>
      <div>
        <p>Account address: {address}</p>
        <p>Network: {isTestnet ? 'testnet' : 'mainnet'}</p>
      </div>
      <button type="button" onClick={getDevice}>
        get device
      </button>
      <button type="button" onClick={getXpub}>
        get xpub
      </button>
      <button
        type="button"
        onClick={() => {
          setNetwork(isTestnet ? 'mainnet' : 'testnet');
          setTimeout(() => {
            window.location.reload();
          });
        }}
      >
        Switch Network
      </button>
      <button type="button" onClick={buildTx}>
        build transaction
      </button>
      <button
        type="button"
        onClick={() => {
          bitcoinProvider.comparePsbt(
            'cHNidP8BAHICAAAAAfERlVhBehCyubLgATvGWVgVRYweog0eQv1oh+ZK/3LZAAAAAAD/////AuCTBAAAAAAAF6kUXZlbocogvyW8doarGvQGot+qq/yHXgwDAAAAAAAWABSDWFb9d8MvTa3QYLmKa5c/jVZFWQAAAAAAAQDfAQAAAAABAWRWeUm6+Ip6uMLTDAfL6Qk8sBstSYie1tFHMzdccoATBQAAAAD/////AiChBwAAAAAAFgAUg1hW/XfDL02t0GC5imuXP41WRVn7rBUAAAAAABYAFKEuSda2AvijGbkp+H88VyChZOWIAkgwRQIhAIFpUv3umyy3U0rbUnDsqVbtmyOHEoIPxe4MKMV2CFhjAiBJ06dFeZCgIYXeGAJFxknoSRy+F90U//g8ZA1DU6zvlwEhA+moiCgqlic0Y6zSU3wjY+0e3sUov7s1Wgcy+4FNWOwIAAAAAAEBHyChBwAAAAAAFgAUg1hW/XfDL02t0GC5imuXP41WRVkiAgOcytS5ey+xakf+R9M+U8UvE6oNd1CcJx7eTs2LfVRAUkcwRAIgZIzY+5LtIDQBC1YLYoCwd4amF1n1vv+pXGBlLn8/SngCIFdCOPfHDWWHIISEtk6Ilo88czaZ75wFKuVDXzYnpPjcASIGA5zK1Ll7L7FqR/5H0z5TxS8Tqg13UJwnHt5OzYt9VEBSGND69yNUAACAAQAAgAIAAIAAAAAAAAAAAAAAIgIDnMrUuXsvsWpH/kfTPlPFLxOqDXdQnCce3k7Ni31UQFIY0Pr3I1QAAIABAACAAgAAgAAAAAAAAAAAAA=='
          );
        }}
      >
        compare psbt
      </button>
    </div>
  );
}

export default App;
