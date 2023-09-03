import type { FetchImageFn } from "@carefree0910/components";
import { Requests } from "@carefree0910/core";

export const fetchImage: FetchImageFn = (data) => {
  return Requests.postJson<Blob>("_python", "/fetch_image", data, { responseType: "blob" });
};
