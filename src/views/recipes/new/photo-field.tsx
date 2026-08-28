"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Image as ImageIcon, X } from "lucide-react";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment";
import { Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";

// Placeholder for the real Firebase Storage upload — no Storage integration
// exists yet in this codebase. Swap this timer out once that's wired up,
// keeping the same "uploading" -> "done" transition below.
const PLACEHOLDER_UPLOAD_MS = 1200;

function formatFileSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function PhotoField() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoStatus, setPhotoStatus] = useState<"idle" | "uploading" | "done">(
    "idle",
  );
  const photoInputRef = useRef<HTMLInputElement>(null);

  const photoUrl = useMemo(
    () => (photo ? URL.createObjectURL(photo) : null),
    [photo],
  );

  useEffect(() => {
    return () => {
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl);
      }
    };
  }, [photoUrl]);

  useEffect(() => {
    if (photoStatus !== "uploading") return;
    const timeoutId = setTimeout(
      () => setPhotoStatus("done"),
      PLACEHOLDER_UPLOAD_MS,
    );
    return () => clearTimeout(timeoutId);
  }, [photoStatus]);

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setPhoto(file);
    setPhotoStatus(file ? "uploading" : "idle");
  }

  function handleRemovePhoto() {
    setPhoto(null);
    setPhotoStatus("idle");
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  }

  return (
    <Field className="w-full">
      <FieldLabel htmlFor="photo">Recipe Photo</FieldLabel>
      <input
        ref={photoInputRef}
        id="photo"
        name="photo"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoChange}
      />
      <Attachment state={photoStatus} orientation="horizontal">
        <AttachmentTrigger
          aria-label="Upload recipe photo"
          onClick={() => photoInputRef.current?.click()}
        />
        <AttachmentMedia variant={photo ? "image" : "icon"}>
          {photo && photoUrl ? (
            // eslint-disable-next-line
            <img src={photoUrl} alt="" />
          ) : (
            <ImageIcon />
          )}
          {photoStatus === "uploading" && (
            <Spinner className="absolute inset-0 m-auto" />
          )}
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>
            {photo ? photo.name : "Upload a photo"}
          </AttachmentTitle>
          {photo && (
            <AttachmentDescription>
              {formatFileSize(photo.size)}
            </AttachmentDescription>
          )}
        </AttachmentContent>
        {photo && (
          <AttachmentActions>
            <AttachmentAction
              type="button"
              aria-label="Remove photo"
              onClick={handleRemovePhoto}
            >
              <X />
            </AttachmentAction>
          </AttachmentActions>
        )}
      </Attachment>
    </Field>
  );
}

export default PhotoField;
