import axios, { AxiosInstance } from "axios";

import type { APISources } from "@/types/requests";
import { PYTHON_RELATED_SETTINGS } from "@/utils/constants";

export const apis: Record<APISources, AxiosInstance> = {
  nolibox: axios.create({ baseURL: "https://creator-huawei-test.nolibox.com", timeout: 3000 }),
  _python: axios.create({
    baseURL: `http://localhost:${PYTHON_RELATED_SETTINGS.backendPort}`,
    timeout: 300000,
  }),
};
