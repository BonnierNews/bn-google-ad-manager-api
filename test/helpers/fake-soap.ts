import { mock } from "node:test";
import * as soap from "soap";

export const enablefakeSoap = () => {
  mock.method(soap, "createClientAsync", () => {
    return Promise.resolve({
      addSoapHeader: () => { },
      setSecurity: () => { },
    });
  });
};