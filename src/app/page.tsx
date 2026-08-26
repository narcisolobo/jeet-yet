import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

function LandingPage() {
  return (
    <section className="flex flex-1 items-center">
      <div className="mx-auto max-w-7xl px-6">
        <Card>
          <CardContent>
            <Link href="/auth/sign-in">Sign in to begin.</Link>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export default LandingPage;
