import React from "react";
import { formatNumber, parseNumber } from "../utils/formatters";

const ConsultationSection = ({ consultations, onTogglePayment }) => {
  // ✅ Проверка: есть ли реальные консультации с суммой > 0
  const validConsultations =
    consultations?.filter((c) => c.amount && parseNumber(c.amount) > 0) || [];

  if (validConsultations.length === 0) {
    return null; // Не показываем секцию, если нет консультаций
  }

  const totalPaid = validConsultations.filter((c) => c.isPaid).length;
  const totalCount = validConsultations.length;
  const progress = (totalPaid / totalCount) * 100;

  // Группировка по годам
  const consultationsByYear = validConsultations.reduce((acc, consultation) => {
    const parts = consultation.month?.split(" ") || [];
    const year = parts[1] || "2024";
    if (!acc[year]) acc[year] = [];
    acc[year].push(consultation);
    return acc;
  }, {});

  return (
    <div className="detail-section">
      <div className="section-title">
        💬 Ежемесячные консультации
        <span className="progress-badge">
          {totalPaid}/{totalCount} оплачено
        </span>
      </div>

      {totalCount > 0 && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}

      {Object.entries(consultationsByYear).map(([year, yearConsultations]) => (
        <div key={year} className="consultations-year-group">
          <div className="year-title">{year}</div>
          <div className="consultations-grid">
            {yearConsultations.map((consultation, idx) => (
              <div key={idx} className="consultation-card">
                <label className="consultation-checkbox">
                  <input
                    type="checkbox"
                    checked={consultation.isPaid || false}
                    onChange={() =>
                      onTogglePayment(consultation.month, consultation.isPaid)
                    }
                  />
                  <span
                    className={`consultation-status ${consultation.isPaid ? "paid" : "unpaid"}`}
                  >
                    {consultation.isPaid ? "✓" : "○"}
                  </span>
                </label>
                <div className="consultation-info">
                  <div className="consultation-month">{consultation.month}</div>
                  <div className="consultation-amount">
                    {formatNumber(consultation.amount)} ₽
                  </div>
                  {consultation.date && (
                    <div className="consultation-date">
                      Оплачено: {consultation.date}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConsultationSection;
