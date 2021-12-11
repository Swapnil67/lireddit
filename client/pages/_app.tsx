import "../styles/globals.css";
// 1. import `ChakraProvider` component
import { ChakraProvider } from "@chakra-ui/react";


function MyApp({ Component, pageProps }) {
  return (
      <ChakraProvider>
        <Component {...pageProps} />
      </ChakraProvider>
  );
}

export default MyApp;
