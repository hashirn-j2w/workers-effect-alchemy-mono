import * as Cloudflare from "@alchemy.run/cloudflare";
import { Todo, TodoNotFound, TodoRpcs } from "@repo/contracts/todos";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";

// SQLite stores booleans as 0 or 1.
const TodoRow = Schema.Struct({
  id: Schema.Number,
  text: Schema.String,
  done: Schema.Number,
});

const decodeRows = Schema.decodeUnknownEffect(Schema.Array(TodoRow));

const toTodo = (row: typeof TodoRow.Type) => new Todo({ ...row, done: row.done === 1 });

// One object per list. The object name is the ListId, so the payload's listId is already implied.
export default class TodoList extends Cloudflare.RpcDurableObject<TodoList>()(
  "TodoList",
  { schema: TodoRpcs },
  Effect.gen(function* () {
    // Relative to where alchemy runs, which is the repo root.
    const migrations = yield* Cloudflare.SqlMigrations("./apps/api/migrations");
    const state = yield* Cloudflare.DurableObjectState;

    return Effect.gen(function* () {
      yield* migrations.apply().pipe(Effect.orDie);

      const query = Effect.fn("TodoList.query")(function* (
        sql: string,
        ...bindings: Array<string | number>
      ) {
        const cursor = yield* state.storage.sql.exec(sql, ...bindings);

        return yield* cursor.toArray().pipe(Effect.flatMap(decodeRows), Effect.orDie);
      });

      const one = Effect.fn("TodoList.one")(function* (
        id: number,
        sql: string,
        ...bindings: Array<string | number>
      ) {
        const [row] = yield* query(sql, ...bindings);

        if (row === undefined) return yield* new TodoNotFound({ id });

        return toTodo(row);
      });

      return TodoRpcs.toLayer({
        listTodos: () =>
          query("SELECT id, text, done FROM todos ORDER BY id").pipe(
            Effect.map((rows) => rows.map(toTodo)),
          ),
        addTodo: ({ text }) =>
          query("INSERT INTO todos (text) VALUES (?) RETURNING id, text, done", text).pipe(
            Effect.flatMap(([row]) =>
              row === undefined
                ? Effect.die("INSERT ... RETURNING produced no row")
                : Effect.succeed(toTodo(row)),
            ),
          ),
        setTodoDone: ({ id, done }) =>
          one(
            id,
            "UPDATE todos SET done = ? WHERE id = ? RETURNING id, text, done",
            done ? 1 : 0,
            id,
          ),
        removeTodo: ({ id }) =>
          one(id, "DELETE FROM todos WHERE id = ? RETURNING id, text, done", id).pipe(
            Effect.asVoid,
          ),
      });
    });
  }),
) {}
