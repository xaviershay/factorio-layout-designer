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
