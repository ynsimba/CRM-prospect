"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateProspectProfileAction, type ProspectFormState } from "@/app/actions/prospects";
import DateField from "@/components/DateField";
import FormToast from "@/components/FormToast";
import {
  PROSPECT_PROFILE_FIELDS,
  profileFieldLabel,
  type ProspectProfileField,
} from "@/lib/prospect-edit-policy";
import { toDateInput } from "@/lib/prospect-list-logic";

const initialState: ProspectFormState = {};

type ProspectEditFormProps = {
  prospectId: string;
  values: Record<ProspectProfileField, string | Date | null>;
  lockedFields: ProspectProfileField[];
  fullEdit: boolean;
  onSuccess?: () => void;
};

function FieldInput({
  field,
  value,
  fullEdit,
}: {
  field: ProspectProfileField;
  value: string | Date | null;
  fullEdit: boolean;
}) {
  if (field === "notes") {
    return (
      <label className="login-field span-2">
        <span>{profileFieldLabel(field)}</span>
        <textarea name={field} rows={2} defaultValue={String(value ?? "")} placeholder="Notes internes…" />
      </label>
    );
  }
  if (field === "firstContactAt" || field === "nextContactAt") {
    return (
      <label className="login-field">
        <span>{profileFieldLabel(field)}</span>
        <DateField name={field} defaultValue={toDateInput(value)} />
      </label>
    );
  }
  return (
    <label className="login-field">
      <span>{profileFieldLabel(field)}</span>
      <input
        name={field}
        type={field === "email" ? "email" : "text"}
        defaultValue={String(value ?? "")}
        placeholder={fullEdit ? undefined : "À compléter"}
      />
    </label>
  );
}

export default function ProspectEditForm({
  prospectId,
  values,
  lockedFields,
  fullEdit,
  onSuccess,
}: ProspectEditFormProps) {
  const action = updateProspectProfileAction.bind(null, prospectId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [toast, setToast] = useState<{ id: number; message: string; tone: "success" | "error" } | null>(null);
  const wasPending = useRef(false);
  const locked = new Set(lockedFields);
  const editableFields = PROSPECT_PROFILE_FIELDS.filter((field) => fullEdit || !locked.has(field));

  useEffect(() => {
    if (pending) {
      wasPending.current = true;
      return;
    }
    if (!wasPending.current) return;
    wasPending.current = false;
    if (state.success) {
      setToast({ id: Date.now(), message: state.success, tone: "success" });
      onSuccess?.();
    } else if (state.error) {
      setToast({ id: Date.now(), message: state.error, tone: "error" });
    }
  }, [pending, state.success, state.error, onSuccess]);

  if (!fullEdit && editableFields.length === 0) {
    return (
      <p className="empty-copy">
        Fiche complète. Seule la direction peut encore modifier les informations déjà renseignées.
      </p>
    );
  }

  return (
    <>
      <FormToast key={toast?.id ?? "idle"} message={toast?.message} tone={toast?.tone ?? "success"} />
      <form action={formAction} className="product-form prospect-edit-form">
        {!fullEdit && lockedFields.length > 0 ? (
          <div className="prospect-edit-filled span-2">
            <span className="prospect-edit-filled-label">Déjà renseignés</span>
            <ul className="prospect-edit-chips">
              {lockedFields.map((field) => (
                <li key={field}>{profileFieldLabel(field)}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="prospect-edit-fields span-2">
          {editableFields.map((field) => (
            <FieldInput key={field} field={field} value={values[field]} fullEdit={fullEdit} />
          ))}
        </div>

        {state.error ? <p className="login-error span-2">{state.error}</p> : null}

        <div className="prospect-form-footer span-2">
          <button type="submit" className="btn-download" disabled={pending || editableFields.length === 0}>
            {pending ? "Enregistrement…" : fullEdit ? "Enregistrer" : "Enregistrer les compléments"}
          </button>
        </div>
      </form>
    </>
  );
}
