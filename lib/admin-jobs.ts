/** Job listing status (DB + admin UI). */
export type JobListStatus = "open" | "closed" | "draft" | "deleted";

/** Status allowed when creating/editing a job (not deleted). */
export type JobFormStatus = "open" | "closed" | "draft";

export type AdminJobType = "full-time" | "part-time" | "contract" | "remote" | "hybrid";

export const ADMIN_JOB_PAGE_SIZE = 25;
