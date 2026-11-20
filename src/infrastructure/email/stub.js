export async function sendVerificationEmail({ to, userId }) {
  return {
    provider: "stub",
    accepted: true,
    recipient: to,
    template: "email_verification",
    userId,
  };
}
