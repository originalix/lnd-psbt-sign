import { useState } from 'react';
import './App.css';
import { serviceHardware } from './service/ServiceHardware';
import { bitcoinProvider } from './service/BitcoinProvider';

function App() {
  const [device, setDevice] = useState<typeof serviceHardware.device>(
    serviceHardware.device
  );
  const getDevice = async () => {
    const deviceResult = await serviceHardware.setDevice();
    setDevice(deviceResult);
  };
  const getXpub = () => {
    serviceHardware.getPublicKey("m/84'/0'/0'").then((pubkey) => {
      console.log(pubkey);
      bitcoinProvider.xpubToAddresses(pubkey.xpub, ['0/0']);
    });
  };

  return (
    <div className="App">
      <h2>Lightning network psbt sign</h2>
      <div>
        <p>device name: {device?.name ?? '-'}</p>
        <p>device label: {device?.label ?? '-'}</p>
      </div>
      <button type="button" onClick={getDevice}>
        get device
      </button>
      <button type="button" onClick={getXpub}>
        get xpub
      </button>
    </div>
  );
}

export default App;
