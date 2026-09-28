"use client";

import { useActionState } from "react";
import { deleteUserAction, type UserFormState } from "@/app/actions/users";

const initialState: UserFormState = {};

export default function UserDeleteButton({ userId, userName }: { userId: string; userName: string }) {
  const [state, formAction, pending] = useActionState(deleteUserAction, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        const ok = window.confirm(
          `Supprimer définitivement ${userName} ?\n\nSes prospects restent dans le CRM, sans propriétaire. Ses activités et tâches personnelles sont retirées. Cette action est irréversible.`,
        );
        if (!ok) event.preventDefault();
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      {state.error ? (
        <p className="login-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <button type="submit" className="table-action is-danger" disabled={pending}>
        {pending ? "…" : "Supprimer"}
      </button>
    </form>
  );
}
