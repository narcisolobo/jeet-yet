"use server";

import { z } from "zod";
import {
  signUpSchema,
  type SignUpInput,
  type SignUpFieldErrors,
} from "./schema";

type ValidateSignUpResult =
  | { success: true; data: SignUpInput }
  | { success: false; errors: SignUpFieldErrors };

async function validateSignUp(input: {
  email: string;
  password: string;
  confirmPassword: string;
}): Promise<ValidateSignUpResult> {
  const result = signUpSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      errors: z.flattenError(result.error).fieldErrors,
    };
  }

  return { success: true, data: result.data };
}

export { validateSignUp };
