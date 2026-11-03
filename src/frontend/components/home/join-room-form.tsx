"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiError, joinRoom } from "@/lib/api";
import { errorMessage, validateName, validateRoomCode } from "@/lib/validation";

type FieldErrors = { code: string | null; name: string | null };

export function JoinRoomForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({ code: null, name: null });
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invalid = { code: validateRoomCode(code), name: validateName(name) };
    setErrors(invalid);
    setFormError(null);
    if (invalid.code || invalid.name) return;

    setPending(true);
    try {
      await joinRoom(code, name.trim());
      router.push(`/room/${code}`);
    } catch (err) {
      // A missing room belongs to the code field; everything else to the form.
      if (err instanceof ApiError && err.status === 404) {
        setErrors({ code: err.message, name: null });
      } else {
        setFormError(errorMessage(err));
      }
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Join a room" description="Enter the 5-digit code you were given." />
      <form noValidate onSubmit={onSubmit} className="flex flex-1 flex-col gap-4">
        <Input
          label="Room code"
          name="code"
          inputMode="numeric"
          autoComplete="off"
          placeholder="12345"
          maxLength={5}
          className="font-mono tracking-widest"
          value={code}
          error={errors.code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, ""));
            setErrors((prev) => ({ ...prev, code: null }));
          }}
        />
        <Input
          label="Your name"
          name="name"
          autoComplete="nickname"
          placeholder="e.g. Sam"
          value={name}
          error={errors.name}
          onChange={(e) => {
            setName(e.target.value);
            setErrors((prev) => ({ ...prev, name: null }));
          }}
        />
        {formError && (
          <p role="alert" className="text-sm text-danger">
            {formError}
          </p>
        )}
        <Button type="submit" loading={pending} className="mt-auto">
          Join room
        </Button>
      </form>
    </Card>
  );
}
