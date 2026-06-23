// utils/date.js

// exports.getTodayIST = () => {
//   const now = new Date();

//   const year = now.getFullYear();

//   const month = String(
//     now.getMonth() + 1
//   ).padStart(2, "0");

//   const day = String(
//     now.getDate()
//   ).padStart(2, "0");

//   return `${year}-${month}-${day}`;
// };


exports.getTodayIST = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());
};


exports.getDayNameFromDate = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  const dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ];

  return dayNames[date.getUTCDay()];
};