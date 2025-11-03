export const getStatusColor = (status) => {
  switch (status) {
    case "pending":
      return "#ef4444"; // red-500
    case "in-progress":
      return "#f59e0b"; // amber-500
    case "resolved":
      return "#10b981"; // emerald-500
    default:
      return "#6b7280"; // gray-500
  }
};

export const getStatusBgColor = (status) => {
  switch (status) {
    case "pending":
      return "bg-red-50 border-red-200";
    case "in-progress":
      return "bg-amber-50 border-amber-200";
    case "resolved":
      return "bg-emerald-50 border-emerald-200";
    default:
      return "bg-gray-50 border-gray-200";
  }
};
