import { Suspense } from "react";
import { LoginForm } from "./login-form";
import styles from "./login.module.css";

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.eyebrow}>⚡ Pulse Sender</div>
        <h1 className={styles.title}>Sign in to your account</h1>
        <p className={styles.text}>
          Access your customer directory, prepare personalized broadcast messages,
          and dispatch SMS through your linked Android gateway.
        </p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
