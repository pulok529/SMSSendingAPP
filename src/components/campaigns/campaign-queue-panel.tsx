"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "@/components/ui/dashboard.module.css";
import { templates } from "@/lib/mock-data";

type ApiCampaign = {
  id: string;
  name: string;
  channel: string;
  audienceSize: number;
  sentCount: number;
  failedCount: number;
  status: string;
  event?: {
    smsTemplate?: string | null;
  } | null;
};

type CampaignsResponse = {
  campaigns: ApiCampaign[];
};

type QueueResponse = {
  ok?: boolean;
  queued?: number;
  error?: string;
};

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:4000";

export function CampaignQueuePanel() {
  const [campaigns, setCampaigns] = useState<ApiCampaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [message, setMessage] = useState(templates[0]?.body ?? "");
  const [notice, setNotice] = useState("Loading campaigns from the API...");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    async function loadCampaigns() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/campaigns`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const data = (await response.json()) as CampaignsResponse;

        if (!isCurrent) {
          return;
        }

        setCampaigns(data.campaigns);

        const firstCampaign = data.campaigns[0];
        if (firstCampaign) {
          setSelectedCampaignId(firstCampaign.id);
          setMessage(firstCampaign.event?.smsTemplate ?? templates[0]?.body ?? "");
          setNotice(`${data.campaigns.length} campaign record(s) loaded.`);
        } else {
          setNotice("No campaign records found. Seed the database first.");
        }
      } catch (error) {
        if (!isCurrent) {
          return;
        }

        setNotice(
          error instanceof Error
            ? `Could not load campaigns: ${error.message}`
            : "Could not load campaigns."
        );
      }
    }

    loadCampaigns();

    return () => {
      isCurrent = false;
    };
  }, []);

  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.id === selectedCampaignId),
    [campaigns, selectedCampaignId]
  );

  async function queueCampaign() {
    if (!selectedCampaignId) {
      setNotice("Choose a campaign before queueing SMS jobs.");
      return;
    }

    setIsBusy(true);
    setNotice("Queueing SMS jobs...");

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/campaigns/${selectedCampaignId}/queue-sms`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
            limit: 100,
          }),
        }
      );
      const data = (await response.json()) as QueueResponse;

      if (!response.ok) {
        throw new Error(data.error ?? `API returned ${response.status}`);
      }

      setNotice(
        `Queued ${data.queued ?? 0} SMS job(s) for Android pickup.`
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? `Queue failed: ${error.message}`
          : "Queue failed."
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <article className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>Build a campaign</h2>
          <p className={styles.panelText}>
            Queue SMS deliveries into the backend so the Android sender can pick
            them up from the mobile job API.
          </p>
        </div>
        <span className={styles.badge}>Live API</span>
      </div>

      <div className={styles.formGrid}>
        <label className={styles.label}>
          Campaign
          <select
            className={styles.field}
            value={selectedCampaignId}
            onChange={(event) => {
              const campaign = campaigns.find(
                (item) => item.id === event.target.value
              );
              setSelectedCampaignId(event.target.value);
              setMessage(campaign?.event?.smsTemplate ?? message);
            }}
          >
            <option value="">Select a campaign</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.label}>
          Channel
          <select className={styles.field} value="SMS" disabled>
            <option>SMS</option>
          </select>
        </label>
        <label className={styles.label}>
          Audience
          <input
            className={styles.field}
            value="All SMS-consented customers without this campaign delivery"
            readOnly
          />
        </label>
        <label className={styles.label}>
          Template
          <select
            className={styles.field}
            defaultValue={templates[0]?.name}
            onChange={(event) => {
              const template = templates.find(
                (item) => item.name === event.target.value
              );
              setMessage(template?.body ?? message);
            }}
          >
            {templates
              .filter((template) => template.channel === "SMS")
              .map((template) => (
                <option key={template.id}>{template.name}</option>
              ))}
          </select>
        </label>
      </div>

      <label className={styles.label} style={{ marginTop: 16 }}>
        SMS content
        <textarea
          className={styles.textarea}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </label>

      <div className={styles.previewBox} style={{ marginTop: 16 }}>
        <strong>Selected campaign:</strong>{" "}
        {selectedCampaign?.name ?? "No campaign selected"}
        <br />
        <strong>Status:</strong> {notice}
      </div>

      <div className={styles.buttonRow} style={{ marginTop: 16 }}>
        <button
          className={styles.buttonPrimary}
          disabled={isBusy || !selectedCampaignId}
          onClick={queueCampaign}
          type="button"
        >
          {isBusy ? "Queueing..." : "Queue campaign"}
        </button>
      </div>
    </article>
  );
}
