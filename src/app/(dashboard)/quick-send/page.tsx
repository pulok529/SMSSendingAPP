import { QuickSendWorkbench } from "@/components/quick-send/quick-send-workbench";
import styles from "@/components/ui/dashboard.module.css";

export default function QuickSendPage() {
  return (
    <div className={styles.page}>
      <QuickSendWorkbench />
    </div>
  );
}
