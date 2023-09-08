import { useToast } from '@chakra-ui/react';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { serviceHardware } from '../service/ServiceHardware';
import BitcoinProvider from '../service/BitcoinProvider';

function useHardware(isTestnet: boolean) {
  console.log('===>Renderrrr ', isTestnet);
  const toast = useToast();
  const [device, setDevice] = useState<typeof serviceHardware.device>(
    serviceHardware.device
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const getDevice = useCallback(async () => {
    try {
      setIsConnecting(true);
      const deviceResult = await serviceHardware.setDevice();
      if (!deviceResult) {
        toast({
          title: 'Error',
          description: 'Search device failed, please try again.',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
      setDevice(deviceResult);
    } finally {
      setIsConnecting(false);
    }
  }, [toast]);

  const bitcoinProvider = useMemo(() => {
    console.log('===>useHardware new BitcoinProvider instance');
    return new BitcoinProvider(isTestnet);
  }, [isTestnet]);

  useEffect(() => {
    bitcoinProvider.blockbook.getRecommendedFee();
  }, [bitcoinProvider]);

  const [isLoading, setIsLoading] = useState(false);
  const [accountAddress, setAccountAddress] = useState('');
  const signTx = useCallback(
    async (path: string, to: string, amount: string) => {
      try {
        if (!device) {
          toast({
            title: 'Error',
            description: 'Please connect device first.',
            status: 'error',
            duration: 4000,
            isClosable: true,
          });
          return;
        }
        setIsLoading(true);
        const pubkeyRes = await serviceHardware.getPublicKey([path]);
        const pubkey = pubkeyRes[0];
        const relativePath = '0/0';
        const addressMap = bitcoinProvider.xpubToAddresses(pubkey.xpub, [
          relativePath,
        ]);
        const currentAddress = addressMap[relativePath];
        setAccountAddress(currentAddress);

        const result = await bitcoinProvider.buildTransaction({
          to,
          amount,
          xpub: pubkey.xpub,
          derivePath: `${path}0/0`,
          currentAddress,
          device,
        });
        return result;
      } catch (e) {
        console.error(e);
        toast({
          title: 'Error',
          description: (e as Error).message,
          status: 'error',
          duration: 6000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [device, toast, bitcoinProvider]
  );

  return {
    device,
    getDevice,
    isConnecting,
    accountAddress,
    signTx,
    isLoading,
  };
}

export { useHardware };
