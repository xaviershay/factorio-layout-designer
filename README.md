# Factorio Layout Designer

![Screenshot](https://raw.githubusercontent.com/xaviershay/factorio-layout-designer/master/doc/fld-screenshot.png)

This project is basically a port of Foreman to the web. It uses the same
`or-tools` solver via a webservice (`or-tools-lambda` directory). Unlike
Foreman, it is intended to stay "decoupled" from Factorio data so that it can
be useful even when the mod you are using isn't known to the app.

It's still very much a WIP and isn't deployed anywhere.

    yarn install
    yarn start

Before commiting, format files:

    yarn fmt

It has a soft dependency on (Factorio Item Browser API
(FIB))[https://petstore.swagger.io/?url=https://raw.githubusercontent.com/factorio-item-browser/api-server/master/api/openapi.yaml#/]
for fetching recipes and icons. The app is useable without it, just without
icons and recipes need to be made by hand. It uses another lambda function
`fib_auth.rb` to proxy auth calls, which is needed to keep the access key
secret. This auth call returns a short lived JWT the client can use to access
API endpoints directly.

A test/development version is available at https://factorio-layout-designer.web.app/

