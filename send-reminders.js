const { schedule } = require("@netlify/functions");
const { getStore } = require("@netlify/blobs");
const webpush = require("web-push");

function localParts(timezone) {
  const now = new Date();
  let parts;
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour12: false,
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(now);
  } catch (e) {
    // Unknown timezone string — fall back to UTC
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC", hour12: false, weekday: "short", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).formatToParts(now);
  }
  const get = (t) => parts.find((p) => p.type === t)?.value;
  const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const hour = get("hour") === "24" ? "00" : get("hour");
  return {
    dateStr: `${get("year")}-${get("month")}-${get("day")}`,
    minutesSinceMidnight: Number(hour) * 60 + Number(get("minute")),
    dow: weekdayMap[get("weekday")],
  };
}

function dayIndexFor(dateStr, startDate) {
  const a = new Date(dateStr + "T00:00:00Z");
  const b = new Date(startDate + "T00:00:00Z");
  return Math.round((a - b) / 86400000);
}

async function handler() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:you@example.com";
  if (!publicKey || !privateKey) {
    console.log("VAPID keys not configured — skipping reminder run.");
    return { statusCode: 200, body: "no vapid keys" };
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);

  const store = getStore("push-subs");
  const { blobs } = await store.list();

  for (const { key } of blobs) {
    const record = await store.get(key, { type: "json" });
    if (!record || !record.subscription) continue;

    const { dateStr, minutesSinceMidnight, dow } = localParts(record.timezone || "UTC");
    const sentLog = record.sentLog || {};
    let changed = false;

    for (const reminder of record.reminders || []) {
      if (!reminder.days || !reminder.days.includes(dow)) continue;
      if (sentLog[reminder.id] === dateStr) continue; // already sent today

      const [hh, mm] = (reminder.time || "00:00").split(":").map(Number);
      const remMinutes = hh * 60 + mm;
      const withinWindow = minutesSinceMidnight >= remMinutes && minutesSinceMidnight < remMinutes + 15;
      if (!withinWindow) continue;

      let title = "Rule of Life";
      let body = `Time for ${reminder.label}.`;
      if (reminder.type === "verse") {
        title = "Today's verse";
        body = "Your daily Bible verse is ready — open Rule of Life to read it.";
      } else if (reminder.type === "examen") {
        title = "Evening Examen";
        body = "A few quiet minutes to review your day and write in your Examen.";
      } else if (reminder.type === "plan") {
        const idx = dayIndexFor(dateStr, reminder.startDate) + 1;
        title = reminder.label;
        body = `Day ${idx} of ${reminder.lengthDays} — don't forget today.`;
      } else {
        title = "Reminder";
        body = `Don't forget: ${reminder.label} today.`;
      }

      try {
        await webpush.sendNotification(record.subscription, JSON.stringify({ title, body, tag: reminder.id }));
        sentLog[reminder.id] = dateStr;
        changed = true;
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          // Subscription is gone (browser data cleared, uninstalled, etc.) — remove it.
          await store.delete(key);
          changed = false;
          break;
        }
        console.error("Push send failed for", key, err.message);
      }
    }

    if (changed) {
      await store.setJSON(key, { ...record, sentLog });
    }
  }

  return { statusCode: 200, body: "done" };
}

exports.handler = schedule("*/15 * * * *", handler);
