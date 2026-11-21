export async function sendVerificationEmail({ to, userId }) {
  return {
    provider: "stub",
    accepted: true,
    recipient: to,
    template: "email_verification",
    userId,
  };
}

export async function sendPasswordResetEmail({ to, userId }) {
  return {
    provider: "stub",
    accepted: true,
    recipient: to,
    template: "password_reset",
    userId,
  };
}
