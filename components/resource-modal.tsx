"use client";

import * as React from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface FieldOption {
  label: string;
  value: string | number;
}

export interface ResourceFieldConfig {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select" | "date" | "time" | "tags";
  placeholder?: string;
  options?: FieldOption[];
  defaultValue?: unknown;
  required?: boolean;
  helpText?: string;
}

export interface ResourceModalProps<T = Record<string, unknown>> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  schema?: z.ZodType<unknown>;
  fields: ResourceFieldConfig[];
  initialData?: Partial<T> | null;
  onSubmit: (values: T) => Promise<void> | void;
  submitLabel?: string;
}

export function ResourceModal<T extends Record<string, unknown>>({
  open,
  onOpenChange,
  title,
  description,
  schema,
  fields,
  initialData,
  onSubmit,
  submitLabel = "Save Changes",
}: ResourceModalProps<T>) {
  const [formData, setFormData] = React.useState<Record<string, unknown>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Initialize form state when opened or initialData changes
  React.useEffect(() => {
    if (open) {
      const initial: Record<string, unknown> = {};
      fields.forEach((field) => {
        if (initialData && initialData[field.name] !== undefined) {
          const val = initialData[field.name];
          if (field.type === "tags" && Array.isArray(val)) {
            initial[field.name] = val.join(", ");
          } else {
            initial[field.name] = val;
          }
        } else if (field.defaultValue !== undefined) {
          initial[field.name] = field.defaultValue;
        } else {
          initial[field.name] = field.type === "number" ? 0 : "";
        }
      });
      setFormData(initial);
      setErrors({});
    }
  }, [open, initialData, fields]);

  const handleChange = (name: string, value: unknown, type?: string) => {
    let parsedValue: unknown = value;
    if (type === "number") {
      parsedValue = value === "" ? "" : Number(value);
    }
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // 1. Process data (convert types like tags / numbers)
    const payload: Record<string, unknown> = { ...formData };
    fields.forEach((f) => {
      if (f.type === "number") {
        payload[f.name] = Number(payload[f.name]) || 0;
      } else if (f.type === "tags" && typeof payload[f.name] === "string") {
        payload[f.name] = (payload[f.name] as string)
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean);
      }
    });

    // 2. Validate with Zod Schema if provided
    if (schema) {
      const result = schema.safeParse(payload);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          const fieldName = String(issue.path[0]);
          if (!fieldErrors[fieldName]) {
            fieldErrors[fieldName] = issue.message;
          }
        });
        setErrors(fieldErrors);
        toast.error("Please correct the errors in the form.");
        return;
      }
    }

    // 3. Submit
    try {
      setIsSubmitting(true);
      await onSubmit(payload as T);
      toast.success(`${title} successfully completed.`);
      onOpenChange(false);
    } catch (err: unknown) {
      console.error("ResourceModal submit error:", err);
      const msg = err instanceof Error ? err.message : "Failed to save record.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {fields.map((field) => {
              const error = errors[field.name];
              const value = String(formData[field.name] ?? "");

              return (
                <div key={field.name} className="space-y-1.5">
                  <label
                    htmlFor={field.name}
                    className="text-xs font-semibold text-foreground"
                  >
                    {field.label}{" "}
                    {field.required && (
                      <span className="text-destructive">*</span>
                    )}
                  </label>

                  {field.type === "textarea" ? (
                    <Textarea
                      id={field.name}
                      placeholder={field.placeholder}
                      value={value}
                      onChange={(e) =>
                        handleChange(field.name, e.target.value, field.type)
                      }
                      rows={3}
                      className={error ? "border-destructive" : ""}
                    />
                  ) : field.type === "select" ? (
                    <select
                      id={field.name}
                      value={value}
                      onChange={(e) =>
                        handleChange(field.name, e.target.value, field.type)
                      }
                      className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {field.options?.map((opt) => (
                        <option key={String(opt.value)} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      id={field.name}
                      type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "time" ? "time" : "text"}
                      placeholder={field.placeholder}
                      value={value}
                      onChange={(e) =>
                        handleChange(field.name, e.target.value, field.type)
                      }
                      className={error ? "border-destructive" : ""}
                    />
                  )}

                  {error ? (
                    <p className="text-xs font-medium text-destructive">{error}</p>
                  ) : field.helpText ? (
                    <p className="text-xs text-muted-foreground">{field.helpText}</p>
                  ) : null}
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
