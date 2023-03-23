<div align="center">
  <h1>Superhedge Api</h1>
  <br />
  <hr />
</div>

> An awesome project based on Ts.ED framework

## How to set up local environment

> **Important!** Ts.ED requires Node >= 14, Express >= 4 and TypeScript >= 4.

1. Clone this repository on localhost.
2. Create an enviroment file named `.env` (copy .env.example) and fill the next enviroment variables

```
# Amazon RDS (PostgreSQL) connection information
DATABASE_HOST=
DATABASE_NAME=
DATABASE_USER=
DATABASE_PASSWORD=
DATABASE_PORT=
```
3. Install dependencies using 'yarn' package manager

```batch
# install dependencies
$  install
```

4. Run the api server(default port: 3000)
```batch
# serve
$  start

# build for production
$  build
$  start:prod
```