import { ChakraProvider } from '@chakra-ui/react';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <ChakraProvider>
      <div className="App">
        <Dashboard />
      </div>
    </ChakraProvider>
  );
}

export default App;
