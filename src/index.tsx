import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";

import "./index.scss";
import App from "./App";
import { initializeLang } from "@/lang";
import { setupInceptors } from "@/requests/interceptors";
import getPythonRelatedSettings from "./utils/_pythonConstants";

initializeLang();
setupInceptors();
const Wrapper = getPythonRelatedSettings().useStrictMode ? React.StrictMode : React.Fragment;
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <Wrapper>
    <ChakraProvider>
      <App />
    </ChakraProvider>
  </Wrapper>,
);
