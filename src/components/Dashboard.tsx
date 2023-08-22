import { useMemo, useState, useCallback } from 'react';
import {
  Box,
  Container,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Stack,
  StackDivider,
  FormControl,
  FormLabel,
  Flex,
  FormHelperText,
  Select,
  InputGroup,
  Input,
  InputRightAddon,
  NumberInput,
  NumberInputField,
  Button,
  HStack,
  Center,
  Code,
  useToast,
  useClipboard,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { useLocalStorage, useEffectOnce } from 'react-use';
import {
  ACCOUNT_INDEX,
  NETWORK,
  PURPOSE,
  UI_REQUEST_CLOSE_UI_WINDOW,
  UI_REQUEST_REQUEST_BUTTON,
  UI_REQUEST_REQUEST_PASSPHRASE,
  UI_REQUEST_REQUEST_PIN,
} from '../constants';
import { useHardware } from './useHardware';
import { bitcoinProvider } from '../service/BitcoinProvider';
import eventBus from '../utils/event-bus';

function Dashboard() {
  const toast = useToast();
  const { onCopy, setValue, hasCopied } = useClipboard('');
  const [network, setNetwork] = useLocalStorage(NETWORK, 'mainnet');
  const isTestnet = network === 'testnet';
  const [purpose, setPurpose] = useLocalStorage(PURPOSE, '84');
  const [accountIndex, setAccountIndex] = useLocalStorage(ACCOUNT_INDEX, '0');
  const derivePath = useMemo(
    () => `m/${purpose ?? ''}'/${isTestnet ? 1 : 0}'/${accountIndex ?? ''}'/`,
    [purpose, isTestnet, accountIndex]
  );
  const { device, getDevice, isConnecting, isLoading, accountAddress, signTx } =
    useHardware();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [eventContent, setEventContent] = useState('');
  useEffectOnce(() => {
    eventBus.subscribe(UI_REQUEST_REQUEST_PIN, () => {
      setEventContent('Please enter pin code');
      onOpen();
    });
    eventBus.subscribe(UI_REQUEST_REQUEST_PASSPHRASE, () => {
      setEventContent('Please enter passphrase');
      onOpen();
    });
    eventBus.subscribe(UI_REQUEST_REQUEST_BUTTON, () => {
      setEventContent('Please confirm on device');
      onOpen();
    });
    eventBus.subscribe(UI_REQUEST_CLOSE_UI_WINDOW, () => {
      onClose();
    });
    return () => {
      eventBus.remove(UI_REQUEST_REQUEST_PIN);
      eventBus.remove(UI_REQUEST_REQUEST_PASSPHRASE);
      eventBus.remove(UI_REQUEST_REQUEST_BUTTON);
      eventBus.remove(UI_REQUEST_CLOSE_UI_WINDOW);
    };
  });

  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [unsignedPsbtCode, setUnSignedPsbtCode] = useState('');
  const [finalPsbtCode, setFinalPsbtCode] = useState('');
  const onSignPsbt = useCallback(async () => {
    if (!address || !address.length) {
      toast({
        title: 'Error',
        description: 'Please enter address',
        status: 'error',
      });
      return;
    }
    try {
      const validAddress = bitcoinProvider.verifyAddress(address);
      if (!validAddress.isValid) {
        throw new Error('Invalid address');
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Invalid Address',
        status: 'error',
      });
      return;
    }
    // valid amount is a valid number
    if (!amount || Number.isNaN(Number(amount))) {
      toast({
        title: 'Error',
        description: 'Please enter valid amount',
        status: 'error',
      });
      return;
    }

    const signedResult = await signTx(derivePath, address, amount);
    if (signedResult) {
      setUnSignedPsbtCode(signedResult.unsignedPsbt);
      setFinalPsbtCode(signedResult.finalPsbt);
      setValue(
        `unsigned psbt: \n${signedResult.unsignedPsbt}\n\nfinal psbt: \n${signedResult.finalPsbt}\n`
      );
    }
    console.log('signedResult ===> : ', signedResult);
  }, [toast, derivePath, address, amount, signTx, setValue]);
  return (
    <Container p={6}>
      <Heading>Lightning network psbt sign</Heading>
      <Card mt={6} colorScheme="whatsapp" variant="outline">
        <CardHeader pb={0}>
          <Heading p={0} size="md" textAlign="center">
            Device info
          </Heading>
        </CardHeader>
        <CardBody py={3}>
          <Stack spacing={1}>
            <Text>Device name: {device?.name || device?.label || '-'} </Text>
            <Text>Bitcoin address: {accountAddress || '-'}</Text>
          </Stack>
        </CardBody>
      </Card>

      <Stack my={6} spacing={3}>
        <FormControl>
          <FormLabel>Network</FormLabel>
          <Select
            size="sm"
            defaultValue={isTestnet ? 'testnet' : 'mainnet'}
            onChange={(ev) => setNetwork(ev.target.value)}
          >
            <option value="mainnet">mainnet</option>
            <option value="testnet">testnet</option>
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>Path</FormLabel>
          <Flex direction="row" align="center">
            <Text>m/</Text>
            <Select
              size="sm"
              maxW={20}
              mx={2}
              defaultValue={purpose}
              onChange={(ev) => setPurpose(ev.target.value)}
            >
              <option value="84">84</option>
              <option value="49">49</option>
              <option value="44">44</option>
            </Select>
            <Text>'/1'/</Text>
            <NumberInput
              size="sm"
              maxW={10}
              mx={2}
              defaultValue={accountIndex}
              onChange={(ev) => setAccountIndex(ev)}
            >
              <NumberInputField p={1} textAlign="center" />
            </NumberInput>
            <Text>'</Text>
          </Flex>
          <FormHelperText textAlign="center">
            Derive path: {derivePath}0/0
          </FormHelperText>
        </FormControl>
        <FormControl>
          <FormLabel>Address</FormLabel>
          <Input size="sm" onChange={(ev) => setAddress(ev.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel>Amount</FormLabel>
          <InputGroup size="sm">
            <Input
              placeholder="enter amount"
              onChange={(ev) => setAmount(ev.target.value)}
            />
            {/* eslint-disable-next-line react/no-children-prop */}
            <InputRightAddon children="BTC" />
          </InputGroup>
        </FormControl>
        <Center>
          <HStack spacing={4}>
            <Button
              colorScheme="whatsapp"
              onClick={getDevice}
              isLoading={isConnecting}
            >
              Connect OneKey
            </Button>
            <Button
              colorScheme="whatsapp"
              isDisabled={!device}
              isLoading={isLoading}
              onClick={() => onSignPsbt()}
            >
              Sign PSBT
            </Button>
          </HStack>
        </Center>
      </Stack>
      <Card>
        <CardHeader py={2}>
          <HStack justifyContent="space-between">
            <Heading size="md">Sign Result</Heading>
            <Button
              size="xs"
              onClick={() => {
                setValue(
                  `unsigned psbt: \n${unsignedPsbtCode}\n\nfinal psbt: \n${finalPsbtCode}\n`
                );
                onCopy();
              }}
            >
              {hasCopied ? 'Copied!' : 'Copy'}
            </Button>
          </HStack>
        </CardHeader>
        <CardBody py={2}>
          <Stack divider={<StackDivider />} spacing="4">
            <Box>
              <Heading size="xs">Unsigned PSBT</Heading>
              <Code my={2} w="full" fontSize="sm">
                {unsignedPsbtCode}
              </Code>
            </Box>
            <Box>
              <Heading size="xs">Signed PSBT</Heading>
              <Code my={2} w="full" fontSize="sm">
                {finalPsbtCode}
              </Code>
            </Box>
          </Stack>
        </CardBody>
      </Card>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Action</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>{eventContent}</Text>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}

export default Dashboard;
