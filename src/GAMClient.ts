import { BearerSecurity, Client, createClientAsync } from "soap"
import { promiseFromCallback } from "./utils";

export type GAMClientConfig = {
  networkCode: string;
  apiVersion?: string | undefined;
  accessToken: string;
}

export type DFPOptions = GAMClientConfig;

interface DFPClient extends Client {
  setToken(token: string): void;
}

class GAMClient {
  private apiVersion: GAMClientConfig["apiVersion"] = undefined;
  private networkCode: GAMClientConfig["networkCode"] = "";
  private accessToken: GAMClientConfig["accessToken"] = ""

  private getLatestApiVersion = async () => {
    const response = await fetch("https://ads.google.com/apis/ads/publisher");

    const html = await response.text();

    return html.match(/v\d+/g)!.at(-1)!;
  }

  public authorize = async ({ networkCode, apiVersion, accessToken }: GAMClientConfig) => {
    // TODO: check array of supported versions
    if (apiVersion && !apiVersion.match(/v\d+/)) throw "Api Version not supported"

    this.networkCode = networkCode;
    this.apiVersion = apiVersion || await this.getLatestApiVersion();
    this.accessToken = accessToken;
  }

  public getService = async (serviceName: string, token?: string) => {
    const client = await createClientAsync(`https://ads.google.com/apis/ads/publisher/${this.apiVersion}/${serviceName}?wsdl`)

    client.addSoapHeader(this.getSoapHeaders());

    client.setSecurity(new BearerSecurity(token ?? this.accessToken));

    return new Proxy(client, {
      get: (target, propertyKey) => {
        const method = propertyKey.toString();

        if (target.hasOwnProperty(method) && !['setToken'].includes(method)) {
          return async function run(dto: any = {}) {
            let res;

            if (client[method + "Async"]) {
              res = await client[method + "Async"](dto);
            } else {
              res = await promiseFromCallback((cb) => client[method](dto, cb));
            }

            return Array.isArray(res) ? res[0].rval : res.rval;

          };
        } else {
          return target[method];
        }
      }
    }) as DFPClient;
  }

  private getSoapHeaders() {
    return {
      RequestHeader: {
        attributes: {
          'soapenv:actor': "http://schemas.xmlsoap.org/soap/actor/next",
          'soapenv:mustUnderstand': 0,
          'xsi:type': "ns1:SoapRequestHeader",
          'xmlns:ns1': "https://www.google.com/apis/ads/publisher/" + this.apiVersion,
          'xmlns:xsi': "http://www.w3.org/2001/XMLSchema-instance",
          'xmlns:soapenv': "http://schemas.xmlsoap.org/soap/envelope/"
        },
        'ns1:networkCode': this.networkCode,
        'ns1:applicationName': 'content-api'
      }
    };
  }

}

export {
  GAMClient, DFPClient
}

// export class DFP {

//   private readonly options: DFPOptions;

//   constructor(options: DFPOptions) {
//     this.options = options;
//   }

//   public async getService(service: string, token?: string): Promise<DFPClient> {
//     const { apiVersion } = this.options;
//     const serviceUrl = `https://ads.google.com/apis/ads/publisher/${apiVersion}/${service}?wsdl`;
//     const client = await promiseFromCallback((cb) => createClient(serviceUrl, cb));

//     client.addSoapHeader(this.getSoapHeaders());

//     client.setToken = function setToken(token: string) {
//       client.setSecurity(new BearerSecurity(token));
//     };

//     if (token) {
//       client.setToken(token);
//     }

//     return new Proxy(client, {
//       get: function get(target, propertyKey) {
//         const method = propertyKey.toString();
//         if (target.hasOwnProperty(method) && !['setToken'].includes(method)) {
//           return async function run(dto: any = {}) {
//             const res = await promiseFromCallback((cb) => client[method](dto, cb));
//             return DFP.parse(res);
//           };
//         } else {
//           return target[method];
//         }
//       }
//     }) as DFPClient;
//   }

//   public static parse(res: any) {
//     return res.rval;
//   }

//   private getSoapHeaders() {
//     const { apiVersion, networkCode } = this.options;

//     return {
//       RequestHeader: {
//         attributes: {
//           'soapenv:actor': "http://schemas.xmlsoap.org/soap/actor/next",
//           'soapenv:mustUnderstand': 0,
//           'xsi:type': "ns1:SoapRequestHeader",
//           'xmlns:ns1': "https://www.google.com/apis/ads/publisher/" + apiVersion,
//           'xmlns:xsi': "http://www.w3.org/2001/XMLSchema-instance",
//           'xmlns:soapenv': "http://schemas.xmlsoap.org/soap/envelope/"
//         },
//         'ns1:networkCode': networkCode,
//         'ns1:applicationName': 'content-api'
//       }
//     };
//   }

// }