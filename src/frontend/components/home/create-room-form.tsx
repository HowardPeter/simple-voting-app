"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createRoom } from "@/lib/api";
import { errorMessage, validateName } from "@/lib/validation";

export function CreateRoomForm() {
  const router = useRouter();
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
      const { code } = await createRoom(name.trim());
      router.push(`/room/${code}`);
    } catch (err) {
      setFormError(errorMessage(err));
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Create a room" description="Start a new room and invite others with its code." />
      <form noValidate onSubmit={onSubmit} className="flex flex-1 flex-col gap-4">
        <Input
          label="Your name"
          name="name"
          autoComplete="nickname"
          placeholder="e.g. Alex"
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
        <Button type="submit" loading={pending} className="mt-auto">
          Create room
        </Button>
      </form>
    </Card>
  );
}
