export const formatNumber = (value) => {
  if (!value || value === "0") return "0";
  const numStr = value.toString().replace(/\s/g, "");
  const num = Number(numStr);
  if (isNaN(num) || num === 0) return "0";
  return num.toLocaleString("ru-RU");
};

export const parseNumber = (value) => {
  if (!value) return 0;
  const numStr = value.toString().replace(/\s/g, "");
  const num = Number(numStr);
  return isNaN(num) ? 0 : num;
};
