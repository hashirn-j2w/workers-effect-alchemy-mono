import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { ListId, type Todo } from "@repo/contracts/todos";
import { createFileRoute } from "@tanstack/react-router";
import * as AsyncResult from "effect/reactivity/AsyncResult";
import * as Schema from "effect/Schema";
import { XIcon } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { addTodoAtom, removeTodoAtom, setTodoDoneAtom, todosAtom, todosKey } from "~/rpc";

const decodeListId = Schema.decodeUnknownSync(ListId);

export const Route = createFileRoute("/lists/$listId")({
  params: {
    parse: ({ listId }) => ({ listId: decodeListId(listId) }),
    stringify: ({ listId }) => ({ listId }),
  },
  component: TodoListPage,
});

function TodoListPage() {
  const { listId } = Route.useParams();

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-6">
      <h1 className="font-heading text-lg font-medium">{listId}</h1>
      <AddTodoForm listId={listId} />
      <TodoItems listId={listId} />
    </main>
  );
}

function TodoItems({ listId }: { listId: ListId }) {
  const todos = useAtomValue(todosAtom(listId));

  if (AsyncResult.isInitial(todos)) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }

  if (!AsyncResult.isSuccess(todos)) {
    return <p className="text-destructive text-sm">Could not load todos.</p>;
  }

  return (
    <ul className="flex flex-col gap-1">
      {todos.value.map((todo) => (
        <TodoRow key={todo.id} listId={listId} todo={todo} />
      ))}
    </ul>
  );
}

function AddTodoForm({ listId }: { listId: ListId }) {
  const [text, setText] = useState("");
  const addTodo = useAtomSet(addTodoAtom);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = text.trim();

    if (trimmed === "") return;
    addTodo({ payload: { listId, text: trimmed }, reactivityKeys: todosKey(listId) });
    setText("");
  };

  return (
    <form onSubmit={submit} className="flex gap-2">
      <Input
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="What needs doing?"
        aria-label="New todo"
      />
      <Button type="submit">Add</Button>
    </form>
  );
}

function TodoRow({ listId, todo }: { listId: ListId; todo: Todo }) {
  const setDone = useAtomSet(setTodoDoneAtom);
  const remove = useAtomSet(removeTodoAtom);
  const reactivityKeys = todosKey(listId);

  return (
    <li className="flex items-center gap-3 py-1">
      <Checkbox
        checked={todo.done}
        onCheckedChange={(done) =>
          setDone({ payload: { listId, id: todo.id, done }, reactivityKeys })
        }
        aria-label={`Mark "${todo.text}" done`}
      />
      <span className={todo.done ? "text-muted-foreground flex-1 line-through" : "flex-1"}>
        {todo.text}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => remove({ payload: { listId, id: todo.id }, reactivityKeys })}
        aria-label={`Remove "${todo.text}"`}
      >
        <XIcon />
      </Button>
    </li>
  );
}
