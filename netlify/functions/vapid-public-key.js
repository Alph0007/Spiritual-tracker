exports.handler = async () => {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    return { statusCode: 500, body: "VAPID_PUBLIC_KEY is not set" };
  }
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: key,
  };
};
