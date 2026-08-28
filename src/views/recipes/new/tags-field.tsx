"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

function TagsField() {
  const [tagDraft, setTagDraft] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  function handleAddTag() {
    const value = tagDraft.trim();
    setTagDraft("");
    if (!value || tags.includes(value)) return;
    setTags((prev) => [...prev, value]);
  }

  function handleTagKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddTag();
    }
  }

  function handleRemoveTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  return (
    <Field className="w-full min-w-sm">
      <FieldLabel htmlFor="tags-draft">Tags</FieldLabel>
      <Input
        id="tags-draft"
        type="text"
        placeholder="Type a tag and press Enter"
        value={tagDraft}
        onChange={(event) => setTagDraft(event.target.value)}
        onKeyDown={handleTagKeyDown}
      />
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                className="rounded-full hover:bg-secondary-foreground/10"
                onClick={() => handleRemoveTag(tag)}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </Field>
  );
}

export default TagsField;
