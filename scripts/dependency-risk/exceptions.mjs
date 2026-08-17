export function validateRiskException(exception, { now = new Date() } = {}) {
  const errors = [];
  if (!exception.approver || exception.approver === exception.owner)
    errors.push({ code: "EXCEPTION_APPROVAL_REQUIRED" });
  if (
    !Array.isArray(exception.compensatingControls) ||
    exception.compensatingControls.length === 0
  )
    errors.push({ code: "COMPENSATING_CONTROL_REQUIRED" });
  if (
    !exception.expiresAt ||
    new Date(exception.expiresAt).getTime() <= now.getTime()
  )
    errors.push({ code: "EXCEPTION_EXPIRED" });
  if (!exception.reviewTrigger)
    errors.push({ code: "REVIEW_TRIGGER_REQUIRED" });
  return { passed: errors.length === 0, errors };
}

export function appendExceptionLifecycle(history, event) {
  if (!event?.at || !event?.status || !event?.actor)
    throw new Error("EXCEPTION_EVENT_INVALID");
  const last = history.at(-1);
  if (last && new Date(event.at).getTime() < new Date(last.at).getTime())
    throw new Error("EXCEPTION_HISTORY_REGRESSION");
  return [...history, Object.freeze({ ...event })];
}
