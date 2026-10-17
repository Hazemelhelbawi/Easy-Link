/** Default reporting month: current calendar month when year matches, else latest from upload. */
export function defaultReportingMonth(reportingYear, availableMonths = []) {
  const now = new Date();
  const current = now.getMonth() + 1;
  if (reportingYear === now.getFullYear() && availableMonths.includes(current)) {
    return current;
  }
  if (availableMonths.length) return availableMonths[availableMonths.length - 1];
  return current;
}
