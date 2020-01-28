# Itfest Backend

Steps to run this project:

1. Run `npm install` command
2. Setup database settings inside `ormconfig.json` file
3. Run `npm start` command

Some admin setting will be provided at
`npm run manage`

## Environment
To run this project please specify the following environment variable
```bash
DB_TYPE #Type of database, this project support mysql or postgres
DB_NAME #Name of database
DB_URL #URL of database including auth

SECRET #JWT secret
QRKEY #32 character string for qr data encryption

PORT #Service port
```

## API Doc
[OpenAPI](docs/openapi.yaml)

[Postman documenter(legacy)](https://documenter.getpostman.com/view/8029552/SVtYR6LZ?version=latest)
