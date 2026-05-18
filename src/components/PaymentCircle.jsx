import React, { useState } from "react";

const PaymentCircle = ({
  isPaid,
  isPartial = false,
  onClick,
  label,
  type = "full", // "full", "advance", "final"
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getCircleClass = () => {
    if (type === "advance") {
      if (isPaid) return "circle-paid-advance";
      return "circle-unpaid";
    }
    if (type === "final") {
      if (isPaid) return "circle-paid-final";
      return "circle-unpaid";
    }
    if (isPartial) return "circle-partial";
    if (isPaid) return "circle-paid";
    return "circle-unpaid";
  };

  return (
    <div
      className="payment-circle-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        className={`payment-circle ${getCircleClass()}`}
        onClick={onClick}
        title={label}
      >
        {isPaid && type !== "partial" ? "✓" : isPartial ? "◐" : "○"}
      </button>
      {isHovered && (
        <div className="circle-tooltip">
          {isPaid
            ? "Оплачено"
            : isPartial
              ? "Частично оплачено"
              : "Не оплачено"}
        </div>
      )}
    </div>
  );
};

export default PaymentCircle;
