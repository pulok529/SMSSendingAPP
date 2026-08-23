import { Suspense } from "react";
import { LoginForm } from "./login-form";
import styles from "./login.module.css";

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.eyebrow}>Pulse Dispatch</div>
        <h1 className={styles.title}>Sign in to send SMS</h1>
        <p className={styles.text}>
          Admins and approved senders can import Excel contacts, prepare
          personalized messages, and queue Android SMS jobs.
        </p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
