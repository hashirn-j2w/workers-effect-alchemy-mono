import { ListId } from "@repo/contracts/todos";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/lists/$listId", params: { listId: ListId.make("inbox") } });
  },
});
