"use client";

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
import { Image as ImageIcon, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

function formatFileSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface PhotoFieldProps {
  initialPhotoUrl?: string;
}

function PhotoField({ initialPhotoUrl }: PhotoFieldProps) {
  const [photo, setPhoto] = useState<File | null>(null);
  const photoStatus: "idle" | "done" =
    photo || initialPhotoUrl ? "done" : "idle";
  const photoInputRef = useRef<HTMLInputElement>(null);

  const photoUrl = useMemo(
    () => (photo ? URL.createObjectURL(photo) : null),
    [photo],
  );
  const displayUrl = photoUrl ?? initialPhotoUrl ?? null;

  useEffect(() => {
    return () => {
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl);
      }
    };
  }, [photoUrl]);

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setPhoto(file);
  }

  function handleRemovePhoto() {
    setPhoto(null);
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
        <AttachmentMedia variant={displayUrl ? "image" : "icon"}>
          {displayUrl ? (
            // eslint-disable-next-line
            <img src={displayUrl} alt="" />
          ) : (
            <ImageIcon />
          )}
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>
            {photo ? photo.name : displayUrl ? "Current photo" : "Upload a photo"}
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
