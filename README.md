# Drizzle ORM Filter Query Parser

String Parser for [Drizzle Filter](https://orm.drizzle.team/docs/operators).

## API
```js
import { parseQueryString } from "drizzle-orm-fqp"
import { user } from "./schema.ts"

const { value, lexErrors, parseErrors } = parseQueryString("eq(id, 1)", user)

const result = await db.query.user.findMany({
  where: value
})
```

## Important
Currently only [eq](https://orm.drizzle.team/docs/operators#eq) and [and](https://orm.drizzle.team/docs/operators#and) operators are allowed.
