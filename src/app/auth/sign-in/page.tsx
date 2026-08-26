import SignInForm from "@/views/sign-in/sign-in-form";

function SignInPage() {
  return (
    <section className="flex flex-1 items-center">
      <div className="mx-auto max-w-7xl px-6">
        <SignInForm />
      </div>
    </section>
  );
}

export default SignInPage;
