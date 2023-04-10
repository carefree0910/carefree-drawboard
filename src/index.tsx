import ReactDOM from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";

import "./index.scss";
import App from "./App";
import { initializeLang } from "@/lang";
import { setupInceptors } from "@/requests/interceptors";

initializeLang();
setupInceptors();
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <>
    <ChakraProvider>
      <App />
    </ChakraProvider>
  </>,
);
