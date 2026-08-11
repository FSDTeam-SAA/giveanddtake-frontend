/**
 * Processing states where an elevator pitch is not watchable yet and its
 * document is still changing server-side.
 *
 * A pitch is deleted and recreated with a NEW _id every time a user uploads
 * (see requestElevatorPitchUploadUrl on the API), so any view holding an id
 * across an upload must refetch rather than trust what it already has.
 */
export const PENDING_PITCH_STATES = [
  "pending",
  "uploaded",
  "queued",
  "processing",
];

export const isPendingPitchState = (state?: string | null) =>
  PENDING_PITCH_STATES.includes(state ?? "");
