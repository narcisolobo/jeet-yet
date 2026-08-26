"use client";

import { GoogleIcon } from "@/components/icons/google-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { Mail, Lock } from "lucide-react";
import { Fragment } from "react";

function SignUpForm() {
  const { user, loading, signInWithGoogle } = useAuth();

  return (
    <Card className="min-w-[360]">
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
            <form className="space-y-2">
              <Field className="max-w-sm">
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="email"
                    name="email"
                    placeholder="you@example.com"
                  />
                  <InputGroupAddon align="inline-start">
                    <Mail className="text-muted-foreground" />
                  </InputGroupAddon>
                </InputGroup>
                <FieldDescription className="text-destructive text-xs">
                  Please enter a valid email.
                </FieldDescription>
              </Field>
              <Field className="max-w-sm">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="password"
                    name="password"
                    placeholder="strong password"
                  />
                  <InputGroupAddon align="inline-start">
                    <Lock className="text-muted-foreground" />
                  </InputGroupAddon>
                </InputGroup>
                <FieldDescription className="text-xs">
                  12 characters, 1 lower, 1 upper, 1 number, 1 special.
                </FieldDescription>
                <FieldDescription className="text-destructive text-xs">
                  Specific password errors.
                </FieldDescription>
              </Field>
              <Field className="max-w-sm">
                <FieldLabel htmlFor="confirm-password">
                  Confirm Password
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="confirm-password"
                    name="confirm-password"
                    placeholder="confirm password"
                  />
                  <InputGroupAddon align="inline-start">
                    <Lock className="text-muted-foreground" />
                  </InputGroupAddon>
                </InputGroup>
                <FieldDescription className="text-destructive text-xs">
                  Passwords must match.
                </FieldDescription>
              </Field>
            </form>
            <div className="flex items-center gap-2">
              <Separator className="flex-1" />
              <span className="text-muted-foreground px-3 text-xs uppercase">
                OR
              </span>
              <Separator className="flex-1" />
            </div>
            <Button variant="outline" onClick={signInWithGoogle}>
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
