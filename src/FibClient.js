// A thin wrapper around the auto-generated swagger client for FIB

import * as FibApi from "fib-api-client";

export default class FibClient {
  async authToken() {
    const authEndpoint =
      "https://sa6mifk9pb.execute-api.us-east-1.amazonaws.com/fibAuth";
    if (this.tokenRequest == null) {
      this.tokenRequest = fetch(authEndpoint, {
        method: "post",
      }).then((x) => x.json());
    }

    return (await this.tokenRequest).authorizationToken;
  }

  async search(q) {
    return FibApi.SearchApi().searchQuery(await this.authToken(), { query: q });
  }
}
