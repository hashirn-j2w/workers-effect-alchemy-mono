import { type ListId, TodoRpcs } from "@repo/contracts/todos";
import * as Layer from "effect/Layer";
import * as FetchHttpClient from "effect/http/FetchHttpClient";
import * as Atom from "effect/reactivity/Atom";
import * as AtomRpc from "effect/reactivity/AtomRpc";
import { RpcClient, RpcSerialization } from "effect/rpc";

// Browser RPC client. Results are atoms; serialization must match the API Worker (JSON).
export class TodoClient extends AtomRpc.Service<TodoClient>()("TodoClient", {
  group: TodoRpcs,
  protocol: RpcClient.layerProtocolHttp({ url: "/rpc" }).pipe(
    Layer.provide(FetchHttpClient.layer),
    Layer.provide(RpcSerialization.layerJson),
  ),
}) {}

// Mutations that pass the same key refetch the list.
export const todosKey = (listId: ListId) => [`todos:${listId}`];

export const todosAtom = Atom.family((listId: ListId) =>
  TodoClient.query("listTodos", { listId }, { reactivityKeys: todosKey(listId) }),
);

export const addTodoAtom = TodoClient.mutation("addTodo");
export const setTodoDoneAtom = TodoClient.mutation("setTodoDone");
export const removeTodoAtom = TodoClient.mutation("removeTodo");
