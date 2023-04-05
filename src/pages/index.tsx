import ReactDOM from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";

import "./index.scss";
import App from "@/pages/App";
import { initializeLang } from "@/utils/lang";
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
