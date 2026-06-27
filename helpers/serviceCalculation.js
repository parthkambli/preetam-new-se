exports.calculateServiceFee = ({ oneDayFee, days, startDate }) => {
  const start = new Date(startDate);
  const endDate = new Date(start);
  endDate.setDate(endDate.getDate() + days);
  const totalFee = oneDayFee * days;
  return { endDate, totalFee };
};
