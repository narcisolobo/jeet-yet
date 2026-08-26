"use client";

import { useState, type FormEvent } from "react";
import { GoogleIcon } from "@/components/icons/google-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { Mail, Lock } from "lucide-react";
import { Fragment } from "react";

type SignInFieldErrors = Partial<Record<"email" | "password", string[]>>;

function SignInForm() {
  const { user, loading, signInWithGoogle, signInWithEmail } = useAuth();
  const [fieldErrors, setFieldErrors] = useState<SignInFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const errors: SignInFieldErrors = {};
    if (!email) errors.email = ["Please enter a valid email."];
    if (!password) errors.password = ["Password is required."];

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitting(false);
      return;
    }

    try {
      await signInWithEmail(email, password);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error) {
        if (
          error.code === "auth/invalid-credential" ||
          error.code === "auth/wrong-password" ||
          error.code === "auth/user-not-found"
        ) {
          // These all mean "the credentials didn't match" — kept under one
          // message regardless of which the SDK returns, since which
          // specific code comes back depends on environment: the Auth
          // Emulator still returns the legacy wrong-password/user-not-found
          // codes, while production Firebase Auth unifies both into
          // invalid-credential specifically so a client can't distinguish
          // (and thus can't leak) which one was wrong.
          setFormError("Incorrect email or password.");
          setSubmitting(false);
          return;
        }
        if (error.code === "auth/too-many-requests") {
          setFormError("Too many attempts. Please try again later.");
          setSubmitting(false);
          return;
        }
        if (error.code === "auth/user-disabled") {
          setFormError("This account has been disabled.");
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
        <CardTitle>Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-sm">Signing in...</p>
        ) : user ? (
          <p className="text-muted-foreground text-sm">
            Sign in successful! Redirecting...
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
                <FieldError
                  errors={fieldErrors.password?.map((message) => ({
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
                {submitting ? "Signing in..." : "Sign In"}
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
              Sign in with Google
            </Button>
          </Fragment>
        )}
      </CardContent>
    </Card>
  );
}

export default SignInForm;
