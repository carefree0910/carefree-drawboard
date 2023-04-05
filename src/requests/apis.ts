import axios, { AxiosInstance } from "axios";

import type { APISources } from "@/types/requests";

export const apis: Record<APISources, AxiosInstance> = {
  nolibox: axios.create({ baseURL: "https://creator-huawei-test.nolibox.com", timeout: 3000 }),
};
