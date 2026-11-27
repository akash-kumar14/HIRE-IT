export const MAX_DISPLAY_NAME_LENGTH = 120;
export const MAX_BIO_LENGTH = 1000;

export function buildApplicationPayload({ displayName, bio } = {}) {
  const normalizedDisplayName =
    typeof displayName === "string" ? displayName.trim() : "";

  if (
    normalizedDisplayName.length === 0 ||
    normalizedDisplayName.length > MAX_DISPLAY_NAME_LENGTH
  ) {
    throw new Error(
      `Display name must be between 1 and ${MAX_DISPLAY_NAME_LENGTH} characters.`,
    );
  }

  const normalizedBio = typeof bio === "string" ? bio.trim() : "";

  if (normalizedBio.length > MAX_BIO_LENGTH) {
    throw new Error(`Bio must be at most ${MAX_BIO_LENGTH} characters.`);
  }

  return {
    displayName: normalizedDisplayName,
    bio: normalizedBio || null,
  };
}
