import axios, { AxiosInstance } from "axios";

import type { APISources } from "@/schema/requests";
import getPythonRelatedSettings from "@/utils/_pythonConstants";

export const apis: Record<APISources, AxiosInstance> = {
  nolibox: axios.create({ baseURL: "https://creator-huawei-test.nolibox.com", timeout: 3000 }),
  _python: axios.create({
    baseURL: `http://localhost:${getPythonRelatedSettings().backendPort}`,
    timeout: 300000,
  }),
};
