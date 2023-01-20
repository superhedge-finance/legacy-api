<p style="text-align: center" align="center">
  <a href="https://tsed.io" target="_blank"><img src="https://tsed.io/tsed-og.png" width="200" alt="Ts.ED logo"/></a>
</p>

<div align="center">
  <h1>Ts.ED - superhedge-api</h1>
  <br />
  <div align="center">
    <a href="https://cli.tsed.io/">Website</a>
    <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
    <a href="https://cli.tsed.io/getting-started.html">Getting started</a>
    <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
    <a href="https://api.tsed.io/rest/slack/tsedio/tsed">Slack</a>
    <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
    <a href="https://twitter.com/TsED_io">Twitter</a>
  </div>
  <hr />
</div>

> An awesome project based on Ts.ED framework

## Getting started

> **Important!** Ts.ED requires Node >= 14, Express >= 4 and TypeScript >= 4.

```batch
# install dependencies
$  install

# serve
$  start

# build for production
$  build
$  start:prod
```

## Docker

```
# build docker image
docker build -t superhedge/artgen-api --build-arg http_proxy --build-arg https_proxy --build-arg no_proxy .

# start docker container
docker run -d --name superhedge_artgen_api \
    -p 3000:3000 \
    -v $HOME/superhedge_storage:/superhedge_storage \
    -e IMAGES_SRC_DIR=/superhedge_storage/assets \
    -e IMAGES_DIST_DIR=/superhedge_storage/images \
  superhedge/artgen-api
```

## Barrelsby

This project uses [barrelsby](https://www.npmjs.com/package/barrelsby) to generate index files to import the controllers.

Edit `.barreslby.json` to customize it:

```json
{
  "directory": ["./src/controllers/rest", "./src/controllers/pages"],
  "exclude": ["__mock__", "__mocks__", ".spec.ts"],
  "delete": true
}
```
