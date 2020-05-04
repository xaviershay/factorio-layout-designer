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

  async bearerToken() {
    return `Bearer ${await this.authToken()}`
  }


  async search(q) {
    return FibApi.SearchApi().searchQuery(await this.bearerToken(), { query: q });
  }

  async allRecipes() {
    const pageSize = 300;

    let results = []
    let index = 0;

    while (true) {
      if (index >= 10000) {
        throw new Error("More than 10000 recipes not supported, something probably broken.")
      }
      const response = await FibApi.RecipesApi().recipeList(await this.bearerToken(), {
        numberOfResults: pageSize,
        indexOfFirstResult: index 
      })

      const recipes = response.recipes

      if (recipes.length > 0) {
        results = results.concat(response.recipes)
        index += pageSize
      } else {
        break
      }
    }

    return results
  }

  rawApi() {
    return FibApi
  }
}
