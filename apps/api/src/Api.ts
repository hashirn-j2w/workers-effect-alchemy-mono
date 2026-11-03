import * as Cloudflare from "@alchemy.run/cloudflare";
import { type ListId, TodoRpcs } from "@repo/contracts/todos";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { RpcSerialization, RpcServer } from "effect/rpc";

import TodoList from "./TodoList.ts";

// Serves TodoRpcs over HTTP and routes each call to the TodoList object named by its listId.
// It has no public URL; the website reaches it through a service binding.
export default class Api extends Cloudflare.RpcWorker<Api>()(
  "Api",
  { main: import.meta.url, workersDev: false, schema: TodoRpcs },
  Effect.gen(function* () {
    const lists = yield* TodoList;
    const list = (listId: ListId) => lists.getByName(listId);

    // A broken object link is a defect; only the typed TodoNotFound stays in the error channel.
    const handlers = TodoRpcs.toLayer({
      listTodos: (payload) =>
        list(payload.listId).pipe(
          Effect.flatMap((client) => client.listTodos(payload)),
          Effect.catchTags({ RpcClientError: Effect.die }),
        ),
      addTodo: (payload) =>
        list(payload.listId).pipe(
          Effect.flatMap((client) => client.addTodo(payload)),
          Effect.catchTags({ RpcClientError: Effect.die }),
        ),
      setTodoDone: (payload) =>
        list(payload.listId).pipe(
          Effect.flatMap((client) => client.setTodoDone(payload)),
          Effect.catchTags({ RpcClientError: Effect.die }),
        ),
      removeTodo: (payload) =>
        list(payload.listId).pipe(
          Effect.flatMap((client) => client.removeTodo(payload)),
          Effect.catchTags({ RpcClientError: Effect.die }),
        ),
    });

    // The browser client speaks JSON, so the Worker does too.
    return RpcServer.toHttpEffect(TodoRpcs).pipe(
      Effect.provide(Layer.mergeAll(handlers, RpcSerialization.layerJson)),
    );
  }),
) {}
