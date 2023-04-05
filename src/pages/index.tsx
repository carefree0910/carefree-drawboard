import ReactDOM from "react-dom/client";

import "./index.scss";
import App from "@/pages/App";
import { initializeLang } from "@/utils/lang";
import { ChakraProvider } from "@chakra-ui/react";

initializeLang();
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <>
    <ChakraProvider>
      <App />
    </ChakraProvider>
  </>,
);
