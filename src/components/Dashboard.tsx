import { useMemo, useState } from 'react';
import {
  Container,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Stack,
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
} from '@chakra-ui/react';
import { useLocalStorage } from 'react-use';
import { ACCOUNT_INDEX, NETWORK, PURPOSE } from '../constants';
import { useHardware } from './useHardware';

function Dashboard() {
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
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  return (
    <Container p={6}>
      <Heading>Lightning network psbt sign</Heading>
      <Card mt={6} colorScheme="whatsapp" variant="outline">
        <CardHeader pb={0}>
          <Heading p={0} size="md">
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
          <FormHelperText>Derive path: {derivePath}0/0</FormHelperText>
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
              onClick={() => signTx(derivePath, address, amount)}
            >
              Sign PSBT
            </Button>
          </HStack>
        </Center>
      </Stack>
    </Container>
  );
}

export default Dashboard;
