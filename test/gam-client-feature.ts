import assert from "node:assert";
import { describe, it, before } from "node:test";
import { GAMClient } from "../src/GAMClient";
import { enableFakeFetch } from "./helpers/fake-fetch";
import { enablefakeSoap } from "./helpers/fake-soap";

// Setup the client for testing
const client = new GAMClient();

describe("gam client", async () => {
  before(() => {
    enableFakeFetch();
    enablefakeSoap()
  })

  it("Client gives back error if calling 'getService' before 'authorize'", async () => {
    try {
      await client.getService("LineItemService");
      assert(false, "Should not be able to call getService before authorize");
    } catch (e) {
      assert(e === "Client not authorized");
    }
  });

  it("Client should be able to authorize correctly with a given apiVersion", async () => {
    await client.authorize({
      accessToken: "foo-bar",
      networkCode: "123456789",
      apiVersion: "v202309"
    });

    const [apiVersion, networkCode, accessToken] = Object.values(client);

    assert.equal(apiVersion, "v202309");
    assert.equal(networkCode, "123456789");
    assert.equal(accessToken, "foo-bar");
  });

  it("Client should be able to authorize correctly without a given apiVersion to get the latest one", async () => {
    await client.authorize({
      accessToken: "foo-bar",
      networkCode: "123456789",
    });

    const [apiVersion, networkCode, accessToken] = Object.values(client);

    assert(apiVersion === "v202311");
    assert.equal(networkCode, "123456789");
    assert.equal(accessToken, "foo-bar");
  });

  it("Client should be able to get a service", async () => {
    const creativeService = await client.getService("CreativeService");

    assert(creativeService.setSecurity !== undefined);
    assert(creativeService.addSoapHeader !== undefined);
  });
});