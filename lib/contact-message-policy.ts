export const CONTACT_MESSAGE_CHARACTER_LIMIT = 500;
export const CONTACT_SUBJECT_CHARACTER_LIMIT = 50;

export const getContactSubjectError = (subject: string): string | null => {
  if (subject.trim().length < 3) return "Subject must be at least 3 characters.";
  if (subject.length > CONTACT_SUBJECT_CHARACTER_LIMIT) return "Subject cannot exceed 50 characters.";
  return null;
};

export const getContactMessageError = (message: string): string | null => {
  if (message.trim().length < 10) return "Message must be at least 10 characters.";
  if (message.length > CONTACT_MESSAGE_CHARACTER_LIMIT) return "Message cannot exceed 500 characters.";
  return null;
};
