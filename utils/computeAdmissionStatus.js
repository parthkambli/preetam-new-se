const msPerDay = 1000 * 60 * 60 * 24;

function computeAdmissionStatus(admission) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!admission.endDate) {
    return { computedStatus: 'Active', remainingDays: '-', isExpired: false };
  }

  const start = admission.startDate ? new Date(admission.startDate) : null;
  if (start) start.setHours(0, 0, 0, 0);
  const end = new Date(admission.endDate);
  end.setHours(23, 59, 59, 999);

  // Future start date — not yet active
  if (start && start.getTime() > today.getTime()) {
    const diff = Math.round((start.getTime() - today.getTime()) / msPerDay);
    return { computedStatus: 'Inactive', remainingDays: `Starts in ${diff}d`, isExpired: false };
  }

  if (end < today) {
    return { computedStatus: 'Inactive', remainingDays: 'Expired', isExpired: true };
  }

  const diff = Math.floor((end - today) / msPerDay);
  return { computedStatus: 'Active', remainingDays: `${diff}d`, isExpired: false };
}

module.exports = { computeAdmissionStatus };
