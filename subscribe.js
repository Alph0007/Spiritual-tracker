const crypto = require("crypto");
const { getStore } = require("@netlify/blobs");

function keyFor(endpoint) {
  return crypto.createHash("sha256").update(endpoint).digest("hex");
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }
  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: "Invalid JSON" };
  }
  const { subscription, timezone, reminders } = payload;
  if (!subscription || !subscription.endpoint) {
    return { statusCode: 400, body: "Missing subscription" };
  }

  const store = getStore("push-subs");
  const key = keyFor(subscription.endpoint);
  const existing = (await store.get(key, { type: "json" })) || {};

  await store.setJSON(key, {
    subscription,
    timezone: timezone || "UTC",
    reminders: Array.isArray(reminders) ? reminders : [],
    sentLog: existing.sentLog || {}, // { reminderId: 'YYYY-MM-DD' } — prevents duplicate sends same day
    updatedAt: new Date().toISOString(),
  });

  return { statusCode: 200, body: "ok" };
};
