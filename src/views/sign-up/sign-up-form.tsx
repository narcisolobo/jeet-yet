"use client";

import { useState, type FormEvent } from "react";
import { GoogleIcon } from "@/components/icons/google-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { Mail, Lock } from "lucide-react";
import { Fragment } from "react";
import { validateSignUp } from "@/app/auth/sign-up/actions";
import type { SignUpFieldErrors } from "@/app/auth/sign-up/schema";

function SignUpForm() {
  const { user, loading, signInWithGoogle, signUpWithEmail } = useAuth();
  const [fieldErrors, setFieldErrors] = useState<SignUpFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const result = await validateSignUp({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirm-password") ?? ""),
    });

    if (!result.success) {
      setFieldErrors(result.errors);
      setSubmitting(false);
      return;
    }

    try {
      await signUpWithEmail(result.data.email, result.data.password);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error) {
        if (error.code === "auth/email-already-in-use") {
          setFieldErrors({
            email: ["An account with this email already exists."],
          });
          setSubmitting(false);
          return;
        }
        if (error.code === "auth/weak-password") {
          setFieldErrors({
            password: ["Password does not meet requirements."],
          });
          setSubmitting(false);
          return;
        }
      }
      setFormError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <Card className="min-w-[360] shadow-lg">
      <CardHeader>
        <CardTitle>Sign Up</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-sm">Signing up...</p>
        ) : user ? (
          <p className="text-muted-foreground text-sm">
            Sign up successful! Redirecting...
          </p>
        ) : (
          <Fragment>
            <form className="space-y-2" onSubmit={handleSubmit}>
              <Field
                className="max-w-sm"
                data-invalid={Boolean(fieldErrors.email?.length)}
              >
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    aria-invalid={Boolean(fieldErrors.email?.length)}
                    disabled={submitting}
                    required
                  />
                  <InputGroupAddon align="inline-start">
                    <Mail className="text-muted-foreground" />
                  </InputGroupAddon>
                </InputGroup>
                <FieldError
                  errors={fieldErrors.email?.map((message) => ({ message }))}
                />
              </Field>
              <Field
                className="max-w-sm"
                data-invalid={Boolean(fieldErrors.password?.length)}
              >
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="password"
                    name="password"
                    type="password"
                    placeholder="************"
                    aria-invalid={Boolean(fieldErrors.password?.length)}
                    disabled={submitting}
                    required
                  />
                  <InputGroupAddon align="inline-start">
                    <Lock className="text-muted-foreground" />
                  </InputGroupAddon>
                </InputGroup>
                <FieldDescription className="text-xs">
                  12 characters, 1 lower, 1 upper, 1 number, 1 special.
                </FieldDescription>
                <FieldError
                  errors={fieldErrors.password?.map((message) => ({
                    message,
                  }))}
                />
              </Field>
              <Field
                className="max-w-sm"
                data-invalid={Boolean(fieldErrors.confirmPassword?.length)}
              >
                <FieldLabel htmlFor="confirm-password">
                  Confirm Password
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    placeholder="************"
                    aria-invalid={Boolean(fieldErrors.confirmPassword?.length)}
                    disabled={submitting}
                    required
                  />
                  <InputGroupAddon align="inline-start">
                    <Lock className="text-muted-foreground" />
                  </InputGroupAddon>
                </InputGroup>
                <FieldError
                  errors={fieldErrors.confirmPassword?.map((message) => ({
                    message,
                  }))}
                />
              </Field>
              {formError ? <FieldError>{formError}</FieldError> : null}
              <Button
                className="mt-4 w-full"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Signing up..." : "Sign Up"}
              </Button>
            </form>
            <div className="flex items-center gap-2">
              <Separator className="flex-1" />
              <span className="text-muted-foreground px-3 text-xs uppercase">
                OR
              </span>
              <Separator className="flex-1" />
            </div>
            <Button
              className="w-full"
              variant="outline"
              onClick={signInWithGoogle}
            >
              <GoogleIcon />
              Sign up with Google
            </Button>
          </Fragment>
        )}
      </CardContent>
    </Card>
  );
}

export default SignUpForm;
