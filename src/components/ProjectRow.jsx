import React, { useState } from "react";
import ConsultationSection from "./ConsultationSection";
import PaymentCircle from "./PaymentCircle";
import PaymentModal from "./PaymentModal";
import { formatNumber, parseNumber } from "../utils/formatters";
import {
  calculateProjectTotals,
  calculateFinalPaymentDue,
} from "../utils/projectCalculations";
import editIcon from '../eddit.svg';
import deleteIcon from '../del.svg';

const ProjectRow = ({
  project,
  isOpen,
  onToggle,
  onEdit,
  onDelete,
  onToggleStageAdvance,
  onToggleStageFinal,
  onToggleAdvance,
  onToggleConsultation,
  onToggleFinalPayment,
}) => {
  const [selectedStage, setSelectedStage] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const parseNumberLocal = (value) => {
    if (!value) return 0;
    const numStr = value.toString().replace(/\s/g, "");
    const num = Number(numStr);
    return isNaN(num) ? 0 : num;
  };

  const validAdvances =
    project.details?.advances?.filter(
      (a) => a.amount && parseNumberLocal(a.amount) > 0,
    ) || [];

  const validStages =
    project.details?.stages?.filter(
      (s) => s.amount && parseNumberLocal(s.amount) > 0,
    ) || [];

  const hasConsultations =
    project.details?.consultationsMonthly?.length > 0 &&
    project.details.consultationsMonthly.some(
      (c) => c.amount && parseNumberLocal(c.amount) > 0,
    );

  const finalPaymentDue = calculateFinalPaymentDue(project.details);
  const hasFinalPayment =
    !validStages.length &&
    (finalPaymentDue > 0 || Boolean(project.details?.finalPaymentIsPaid));

  const { formattedBalance } = calculateProjectTotals(project);
  const finalPaymentDisplay =
    finalPaymentDue > 0
      ? finalPaymentDue
      : parseNumberLocal(project.details?.finalPayment);

  const handleConsultationToggle = (month, currentStatus) => {
    const monthIndex = project.details.consultationsMonthly?.findIndex(
      (c) => c.month === month,
    );
    if (monthIndex !== -1) {
      onToggleConsultation(monthIndex, currentStatus);
    }
  };

  const handleStagePaymentClick = (stage) => {
    setSelectedStage(stage);
    setIsPaymentModalOpen(true);
  };

  const handleStagePaymentConfirm = (type) => {
    if (type === "advance") {
      onToggleStageAdvance(selectedStage.id, selectedStage.advanceIsPaid);
    } else if (type === "final") {
      onToggleStageFinal(selectedStage.id, selectedStage.finalIsPaid);
    } else if (type === "full") {
      // Если оплачиваем полностью, отмечаем и аванс, и финальную оплату
      if (!selectedStage.advanceIsPaid && selectedStage.advanceAmount) {
        onToggleStageAdvance(selectedStage.id, selectedStage.advanceIsPaid);
      }
      if (!selectedStage.finalIsPaid && selectedStage.finalAmount) {
        onToggleStageFinal(selectedStage.id, selectedStage.finalIsPaid);
      }
    }
  };

  // Определяем статус этапа для кружочка
  const getStagePaymentStatus = (stage) => {
    const advancePaid = stage.advanceIsPaid;
    const finalPaid = stage.finalIsPaid;
    const hasAdvance =
      stage.advanceAmount && parseNumberLocal(stage.advanceAmount) > 0;
    const hasFinal =
      stage.finalAmount && parseNumberLocal(stage.finalAmount) > 0;

    if (advancePaid && finalPaid) return "full";
    if (advancePaid && !finalPaid && hasAdvance && hasFinal) return "partial";
    if (!advancePaid && finalPaid && hasAdvance && hasFinal) return "partial";
    if (advancePaid && !hasFinal) return "full";
    if (finalPaid && !hasAdvance) return "full";
    return "none";
  };

  return (
    <>
      <tr className="container">
        <td className="expand-cell" onClick={onToggle}>
          <span className={`expand-icon ${isOpen ? "expanded" : ""}`}>▶</span>
        </td>
        <td className="project-info-cell">
          <div className="project-header-actions">
            <div className="project-title">{project.project}</div>
            <div className="project-actions">
            <button
  className="edit-btn"
  onClick={(e) => {
    e.stopPropagation();
    onEdit();
  }}
>
  <img src={editIcon} alt="Edit" className="btn-icon" />
</button>
<button
  className="delete-btn"
  onClick={(e) => {
    e.stopPropagation();
    onDelete();
  }}
>
  <img src={deleteIcon} alt="Delete" className="btn-icon" />
</button>
            </div>
          </div>
          <div className="project-description">{project.description}</div>
          <div className="project-total-balance">
            Остаток оплаты: <strong>{formattedBalance} ₽</strong>
          </div>
        </td>
      </tr>
      {isOpen && (
        <tr className="details-row">
          <td colSpan="2" className="details-cell">
            <div className="details-container">
              {/* Основные суммы */}
              <div className="detail-section">
                <div className="section-title">Основные суммы</div>
                <div className="summary-grid">
                  {project.details?.contractCost &&
                    parseNumberLocal(project.details.contractCost) > 0 && (
                      <div className="summary-item">
                        <span>Стоимость договора:</span>
                        <strong>
                          {formatNumber(project.details.contractCost)} ₽
                        </strong>
                      </div>
                    )}
                  {project.details?.additionalAgreementCost &&
                    parseNumberLocal(project.details.additionalAgreementCost) >
                      0 && (
                      <div className="summary-item">
                        <span>Доп.соглашение:</span>
                        <strong>
                          {formatNumber(
                            project.details.additionalAgreementCost,
                          )}{" "}
                          ₽
                        </strong>
                      </div>
                    )}
                  {project.details?.consultationsCost &&
                    parseNumberLocal(project.details.consultationsCost) > 0 && (
                      <div className="summary-item">
                        <span>Консультации (всего):</span>
                        <strong>
                          {formatNumber(project.details.consultationsCost)} ₽
                        </strong>
                      </div>
                    )}
                </div>
              </div>

              {/* Консультации */}
              {hasConsultations && (
                <ConsultationSection
                  consultations={project.details?.consultationsMonthly}
                  onTogglePayment={handleConsultationToggle}
                />
              )}

              {/* Авансы с кружочками */}
              {validAdvances.length > 0 && (
                <div className="detail-section">
                  <div className="section-title">Авансы</div>
                  <div className="items-list">
                  <div className="summary-grid">
                    {validAdvances.map((advance) => (
                      <div key={advance.id} className="payment-item">
                        <PaymentCircle
                          isPaid={advance.isPaid || false}
                          onClick={() =>
                            onToggleAdvance(advance.id, advance.isPaid)
                          }
                          label={advance.name}
                        />
                        <span className="item-name">{advance.name}</span>
                        <span className="item-amount">
                          {formatNumber(advance.amount)} ₽
                        </span>
                      </div>
                    ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Финальная оплата */}
              {hasFinalPayment && (
                <div className="detail-section">
                  <div className="section-title">Финальная оплата</div>
                  <div className="payment-item">
                    <PaymentCircle
                      isPaid={project.details.finalPaymentIsPaid || false}
                      onClick={() =>
                        onToggleFinalPayment(project.details.finalPaymentIsPaid)
                      }
                      label="Финальный платёж"
                    />
                    <span className="item-name">Финальный платёж</span>
                    <span className="item-amount">
                      {formatNumber(finalPaymentDisplay)} ₽
                    </span>
                  </div>
                </div>
              )}

              {/* Этапы с расширенными кружочками */}
              {validStages.length > 0 && (
                <div className="detail-section">
                  <div className="section-title">Этапы оплаты</div>
                  <div className="stages-list-expanded">
                    {validStages.map((stage) => {
                      const status = getStagePaymentStatus(stage);
                      return (
                        <div key={stage.id} className="stage-detail-card">
                          <div className="stage-detail-header">
                            <div className="stage-detail-title">
                              {stage.name}
                            </div>
                            <div className="ayment-item">
                            <PaymentCircle
                              isPaid={status === "full"}
                              isPartial={status === "partial"}
                              onClick={() => handleStagePaymentClick(stage)}
                              label={`${stage.name} - ${status === "full" ? "Полностью оплачен" : status === "partial" ? "Частично оплачен" : "Не оплачен"}`}
                              type="full"
                            />
                            </div>
                          </div>
                          <div className="year-title">
                            Общая сумма этапа: {formatNumber(stage.amount)} ₽
                          </div>

                          <div className="summary-grid">
                            <div className="payment-item">
                              <PaymentCircle
                                isPaid={stage.advanceIsPaid || false}
                                onClick={() =>
                                  onToggleStageAdvance(
                                    stage.id,
                                    stage.advanceIsPaid,
                                  )
                                }
                                label="Аванс этапа"
                                type="advance"
                              />
                              <span className="item-name">Аванс этапа</span>
                              <span className="item-amount">
                                {formatNumber(stage.advanceAmount)} ₽
                              </span>
                            </div>

                            <div className="payment-item">
                              <PaymentCircle
                                isPaid={stage.finalIsPaid || false}
                                onClick={() =>
                                  onToggleStageFinal(
                                    stage.id,
                                    stage.finalIsPaid,
                                  )
                                }
                                label="Финальная оплата этапа"
                                type="final"
                              />
                              <span className="item-name">Финальная оплата этапа</span>
                              <span className="item-amount">
                                {formatNumber(stage.finalAmount)} ₽
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        stage={selectedStage}
        onConfirm={handleStagePaymentConfirm}
      />
    </>
  );
};

export default ProjectRow;
