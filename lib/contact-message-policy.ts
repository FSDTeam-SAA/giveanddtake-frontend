export const CONTACT_MESSAGE_WORD_LIMIT = 50;

export const countContactMessageWords = (message: string): number =>
  (message.match(/\S+/g) ?? []).length;

export const getContactMessageError = (message: string): string | null => {
  if (message.trim().length < 10) {
    return "Message must be at least 10 characters.";
  }
  if (countContactMessageWords(message) > CONTACT_MESSAGE_WORD_LIMIT) {
    return "Message cannot exceed 50 words.";
  }
  return null;
};
