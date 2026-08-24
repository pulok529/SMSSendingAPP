import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const cookieStore = await cookies();
  const hasSession = cookieStore.has("pulse_session");
  if (!hasSession) {
    redirect("/login");
  }
  redirect("/dashboard");
}
