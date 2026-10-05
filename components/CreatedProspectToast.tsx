"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import FormToast from "@/components/FormToast";

export default function CreatedProspectToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const created = searchParams.get("created") === "1";
  const [message, setMessage] = useState<string | undefined>();

  useEffect(() => {
    if (!created) return;
    setMessage("Prospect créé avec succès.");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("created");
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [created, pathname, router, searchParams]);

  if (!message) return null;
  return <FormToast key={message} message={message} tone="success" />;
}
