import { useState, useEffect } from 'react';
import './App.css';
import { useLocalStorage } from 'react-use';
import { serviceHardware } from './service/ServiceHardware';
import { bitcoinProvider } from './service/BitcoinProvider';
import { blockbook } from './service/Blockbook';
import { NETWORK } from './constants';

function App() {
  const [network, setNetwork] = useLocalStorage(NETWORK, 'mainnet');
  const isTestnet = network === 'testnet';
  const path = `m/84'/${isTestnet ? 1 : 0}'/0'`;
  const [address, setAddress] = useState('');
  const [device, setDevice] = useState<typeof serviceHardware.device>(
    serviceHardware.device
  );

  useEffect(() => {
    blockbook.getRecommendedFee();
  }, []);

  const getDevice = async () => {
    const deviceResult = await serviceHardware.setDevice();
    setDevice(deviceResult);
  };

  const getXpub = () => {
    serviceHardware.getPublicKey(path).then((pubkey) => {
      console.log(pubkey);
      const relativePath = '0/0';
      const result = bitcoinProvider.xpubToAddresses(pubkey.xpub, ['0/0']);
      setAddress(result[relativePath]);
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
    </div>
  );
}

export default App;
