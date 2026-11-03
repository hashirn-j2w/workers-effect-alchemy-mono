import * as Schema from "effect/Schema";
import { Rpc, RpcGroup } from "effect/rpc";

// Names one todo list. Each list is its own Durable Object, so this is also the object name.
export const ListId = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^[a-z0-9-]{1,64}$/)),
  Schema.brand("ListId"),
);

export type ListId = typeof ListId.Type;

export class Todo extends Schema.Class<Todo>("Todo")({
  id: Schema.Number,
  text: Schema.String,
  done: Schema.Boolean,
}) {}

export class TodoNotFound extends Schema.TaggedError<TodoNotFound>()("TodoNotFound", {
  id: Schema.Number,
}) {}

// Served by the API Worker to browsers and by each TodoList object to the Worker.
export class TodoRpcs extends RpcGroup.make(
  Rpc.make("listTodos", {
    payload: { listId: ListId },
    success: Schema.Array(Todo),
  }),
  Rpc.make("addTodo", {
    payload: { listId: ListId, text: Schema.NonEmptyString },
    success: Todo,
  }),
  Rpc.make("setTodoDone", {
    payload: { listId: ListId, id: Schema.Number, done: Schema.Boolean },
    success: Todo,
    error: TodoNotFound,
  }),
  Rpc.make("removeTodo", {
    payload: { listId: ListId, id: Schema.Number },
    success: Schema.Void,
    error: TodoNotFound,
  }),
) {}
