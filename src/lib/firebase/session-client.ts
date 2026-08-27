import type { User } from "firebase/auth";

async function syncSessionCookie(user: User) {
  const idToken = await user.getIdToken();
  await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
}

async function clearSessionCookie() {
  await fetch("/api/session", { method: "DELETE" });
}

export { syncSessionCookie, clearSessionCookie };
