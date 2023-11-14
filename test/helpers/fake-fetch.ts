import { mock } from "node:test";
import fs from "fs/promises"

export const enableFakeFetch = () => {
  mock.method(global, "fetch", async (url: string, options: Record<string, any>) => {
    switch (url) {
      case "https://ads.google.com/apis/ads/publisher":
        return { status: 200, text: async () => Promise.resolve(await fs.readFile("./test/data/google-publisher-example.html", { encoding: 'utf-8' })) }
      default:
        return { status: 404, text: () => Promise.resolve(``) }
    }
  });
};
