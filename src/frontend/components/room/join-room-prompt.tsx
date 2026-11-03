"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { errorMessage, validateName } from "@/lib/validation";

type Props = { code: string; join: (name: string) => Promise<unknown> };

// The code comes from the URL. A missing room switches the session to
// "room-not-found", so this form only shows the other errors.
export function JoinRoomPrompt({ code, join }: Props) {
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invalid = validateName(name);
    setNameError(invalid);
    setFormError(null);
    if (invalid) return;

    setPending(true);
    try {
      await join(name.trim());
    } catch (err) {
      setFormError(errorMessage(err));
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title={`Join room ${code}`}
        description="Enter your name so others know who is voting."
      />
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          label="Your name"
          name="name"
          autoComplete="nickname"
          autoFocus
          placeholder="e.g. Sam"
          value={name}
          error={nameError}
          onChange={(e) => {
            setName(e.target.value);
            setNameError(null);
          }}
        />
        {formError && (
          <p role="alert" className="text-sm text-danger">
            {formError}
          </p>
        )}
        <Button type="submit" loading={pending}>
          Join room
        </Button>
      </form>
    </Card>
  );
}
