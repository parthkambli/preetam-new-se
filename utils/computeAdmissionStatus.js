const msPerDay = 1000 * 60 * 60 * 24;

function computeAdmissionStatus(admission) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!admission.endDate) {
    return { computedStatus: 'Active', remainingDays: '-', isExpired: false };
  }

  const end = new Date(admission.endDate);
  end.setHours(23, 59, 59, 999);

  if (end < today) {
    return { computedStatus: 'Inactive', remainingDays: 'Expired', isExpired: true };
  }

  const diff = Math.ceil((end - today) / msPerDay);
  return { computedStatus: 'Active', remainingDays: `${diff}d`, isExpired: false };
}

module.exports = { computeAdmissionStatus };
