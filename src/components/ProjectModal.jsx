import React, { useState, useEffect } from "react";
import { formatNumber, parseNumber } from "../utils/formatters";

const ProjectModal = ({
  isOpen,
  onClose,
  editingProject,
  formData,
  setFormData,
  onSave,
}) => {
  // Все хуки ДО любого условия и раннего возврата
  const [showAdditionalAgreement, setShowAdditionalAgreement] = useState(false);
  const [showConsultations, setShowConsultations] = useState(false);

  // Функция для автоматического расчёта остатка (для этапов)
  // Функция для автоматического расчёта остатка (для этапов)
  const calculateStagesRemaining = () => {
    if (!formData.hasStages) return;

    const contractAmount = parseNumber(formData.contractCost);
    const additionalAmount = parseNumber(formData.additionalAgreementCost);
    const consultationsAmount = formData.consultationsMonthly.reduce(
      (sum, c) => sum + parseNumber(c.amount),
      0,
    );

    const totalContract =
      contractAmount + additionalAmount + consultationsAmount;

    // Сумма авансов (не важно, оплачены они или нет)
    const totalAdvances = formData.advances
      .filter((a) => a.amount)
      .reduce((sum, a) => sum + parseNumber(a.amount), 0);

    // Сумма всех этапов
    const totalStages = formData.stages.reduce(
      (sum, s) => sum + parseNumber(s.amount),
      0,
    );

    // Ожидаемая сумма этапов = общая сумма - сумма авансов
    // (независимо от того, оплачены они или нет!)
    const expectedStagesTotal = totalContract - totalAdvances;

    // Проверяем, равна ли сумма этапов ожидаемой
    const stagesMatch =
      totalStages === expectedStagesTotal || totalStages === 0;

    // Оплаченные этапы (для отображения)
    const paidStages = formData.stages.reduce((sum, s) => {
      const advancePaid = s.advanceIsPaid ? parseNumber(s.advanceAmount) : 0;
      const finalPaid = s.finalIsPaid ? parseNumber(s.finalAmount) : 0;
      return sum + advancePaid + finalPaid;
    }, 0);

    // Оплаченные авансы (общие)
    const paidAdvances = formData.advances
      .filter((a) => a.isPaid && a.amount)
      .reduce((sum, a) => sum + parseNumber(a.amount), 0);

    // Остаток к оплате
    const remaining = totalContract - (paidAdvances + paidStages);

    setFormData((prev) => ({
      ...prev,
      _remainingAmount: remaining > 0 ? remaining : 0,
      _stagesMatchTotal: stagesMatch,
      _expectedStagesTotal: expectedStagesTotal,
      _totalAdvances: totalAdvances,
    }));
  };
  // Функция для автоматического расчёта финальной оплаты (для обычных проектов)
  const calculateFinalPayment = () => {
    if (formData.hasStages) return;

    const contractAmount = parseNumber(formData.contractCost);
    const additionalAmount = parseNumber(formData.additionalAgreementCost);
    const consultationsAmount = formData.consultationsMonthly.reduce(
      (sum, c) => sum + parseNumber(c.amount),
      0,
    );

    const totalContract =
      contractAmount + additionalAmount + consultationsAmount;

    const paidAdvances = formData.advances
      .filter((a) => a.isPaid && a.amount)
      .reduce((sum, a) => sum + parseNumber(a.amount), 0);

    const remaining = totalContract - paidAdvances;

    if (remaining >= 0) {
      setFormData((prev) => ({
        ...prev,
        finalPayment: formatNumber(remaining),
        finalPaymentIsPaid: false,
      }));
    }
  };

  // Добавление нового этапа
  const addStage = () => {
    const newId = formData.stages.length + 1;
    const newStage = {
      id: newId,
      name: `Этап ${newId}`,
      amount: "",
      advanceAmount: "",
      advanceIsPaid: false,
      finalAmount: "",
      finalIsPaid: false,
    };
    console.log("Добавляю новый этап:", newStage);
    setFormData({ ...formData, stages: [...formData.stages, newStage] });
  };

  // Удаление этапа
  const removeStage = (index) => {
    const updatedStages = [...formData.stages];
    updatedStages.splice(index, 1);
    // Перенумеровываем этапы
    const renumberedStages = updatedStages.map((stage, idx) => ({
      ...stage,
      id: idx + 1,
      name: `Этап ${idx + 1}`,
    }));
    setFormData({ ...formData, stages: renumberedStages });
  };

  // Эффекты для инициализации и расчёта
  useEffect(() => {
    if (isOpen) {
      setShowAdditionalAgreement(!!formData.additionalAgreementCost);
      setShowConsultations(formData.consultationsMonthly?.length > 0);
    }
  }, [isOpen, formData.additionalAgreementCost, formData.consultationsMonthly]);

  // Автоматический пересчёт при изменении сумм (для обычных проектов)
  useEffect(() => {
    if (!formData.hasStages && isOpen) {
      calculateFinalPayment();
    }
  }, [
    formData.contractCost,
    formData.additionalAgreementCost,
    formData.consultationsMonthly,
    formData.advances,
    formData.hasStages,
    isOpen,
  ]);

  // Автоматический пересчёт при изменении этапов
  useEffect(() => {
    if (formData.hasStages && isOpen) {
      calculateStagesRemaining();
    }
  }, [
    formData.contractCost,
    formData.additionalAgreementCost,
    formData.consultationsMonthly,
    formData.advances,
    formData.stages,
    formData.hasStages,
    isOpen,
  ]);

  // Ранний возврат ТОЛЬКО ПОСЛЕ всех хуков
  if (!isOpen) return null;

  const addConsultationMonth = () => {
    const newConsultation = {
      month: `Месяц ${formData.consultationsMonthly.length + 1}`,
      amount: "",
      isPaid: false,
      date: null,
    };
    const updated = [...formData.consultationsMonthly, newConsultation];
    setFormData({ ...formData, consultationsMonthly: updated });
  };

  const removeConsultationMonth = (index) => {
    const updated = [...formData.consultationsMonthly];
    updated.splice(index, 1);
    setFormData({ ...formData, consultationsMonthly: updated });
  };

  const updateConsultationAmount = (index, value) => {
    const updated = [...formData.consultationsMonthly];
    updated[index].amount = value;
    setFormData({ ...formData, consultationsMonthly: updated });
  };

  const updateConsultationMonth = (index, value) => {
    const updated = [...formData.consultationsMonthly];
    updated[index].month = value;
    setFormData({ ...formData, consultationsMonthly: updated });
  };

  const totalConsultations = formData.consultationsMonthly.reduce(
    (sum, c) => sum + parseNumber(c.amount),
    0,
  );

  // Расчёт общей суммы проекта
  const totalProjectAmount =
    parseNumber(formData.contractCost) +
    parseNumber(formData.additionalAgreementCost) +
    totalConsultations;

  // Расчёт оплаченной суммы (авансы общие)
  const paidAdvances = formData.advances
    .filter((a) => a.isPaid && a.amount)
    .reduce((sum, a) => sum + parseNumber(a.amount), 0);

  // Расчёт оплаченных этапов (аванс этапа + финальная часть этапа)
  const paidStages = formData.hasStages
    ? formData.stages.reduce((sum, s) => {
        const advancePaid = s.advanceIsPaid ? parseNumber(s.advanceAmount) : 0;
        const finalPaid = s.finalIsPaid ? parseNumber(s.finalAmount) : 0;
        return sum + advancePaid + finalPaid;
      }, 0)
    : 0;

  // Общая оплаченная сумма
  const totalPaid = paidAdvances + paidStages;

  // Остаток к оплате
  const remainingAmount = totalProjectAmount - totalPaid;

  // Сумма всех этапов
  const totalStagesAmount = formData.hasStages
    ? formData.stages.reduce((sum, s) => sum + parseNumber(s.amount), 0)
    : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingProject ? "Редактировать проект" : "Новый проект"}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="form-section">
            <div className="form-group">
              <label>Наименование проекта *</label>
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) =>
                  setFormData({ ...formData, projectName: e.target.value })
                }
                placeholder="Введите название проекта"
              />
            </div>
            <div className="form-group">
              <label>Описание проекта</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Введите описание проекта"
                rows="2"
              />
            </div>
          </div>

          {/* Стоимость договора + кнопки добавления */}
          <div className="form-section">
            <div className="section-header-with-button">
              <h3>Стоимость</h3>
              <div className="add-buttons">
                {!showAdditionalAgreement && (
                  <button
                    type="button"
                    className="save-btn"
                    onClick={() => setShowAdditionalAgreement(true)}
                  >
                    + Доп. соглашение
                  </button>
                )}
                {!showConsultations && (
                  <button
                    type="button"
                    className="save-btn"
                    onClick={() => setShowConsultations(true)}
                  >
                    + Консультации
                  </button>
                )}
              </div>
            </div>

            {/* Основной договор */}
            <div className="form-group">
              <label>Стоимость договора</label>
              <input
                type="text"
                value={formData.contractCost}
                onChange={(e) =>
                  setFormData({ ...formData, contractCost: e.target.value })
                }
                placeholder="Например: 1 000 000"
              />
            </div>

            {/* Доп. соглашение */}
            {showAdditionalAgreement && (
              <div className="form-group dynamic-field">
                <div className="field-header">
                  <label>Стоимость доп.соглашения</label>
                  <button
                    type="button"
                    className="modal-close"
                    onClick={() => {
                      setShowAdditionalAgreement(false);
                      setFormData({ ...formData, additionalAgreementCost: "" });
                    }}
                  >
                    ×
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.additionalAgreementCost || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      additionalAgreementCost: e.target.value,
                    })
                  }
                  placeholder="Сумма доп.соглашения"
                />
              </div>
            )}
          </div>

          {/* Ежемесячные консультации */}
          {showConsultations && (
            <div className="form-section">
              <div className="section-header-with-button">
                <h3>Ежемесячные консультации</h3>
                <div className="add-buttons">
                  <button
                    type="button"
                    className="add-month-btn"
                    onClick={addConsultationMonth}
                  >
                    + Добавить месяц
                  </button>
                  <button
                    type="button"
                    className="modal-close"
                    onClick={() => {
                      setShowConsultations(false);
                      setFormData({ ...formData, consultationsMonthly: [] });
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>

              {formData.consultationsMonthly.length === 0 ? (
                <div className="empty-months-small">
                  <p
                    style={{
                      fontStyle: "italic",
                      color: "var(--text-secondary)",
                      fontSize: "15px",
                    }}
                  >
                    Нажмите "Добавить месяц"
                  </p>
                </div>
              ) : (
                <div className="months-list">
                  {formData.consultationsMonthly.map((consultation, idx) => (
                    <div key={idx} className="month-item">
                      <div className="month-header">
                        <div className="form-group month-name-group">
                          <label>Месяц</label>
                          <input
                            type="text"
                            value={consultation.month}
                            onChange={(e) =>
                              updateConsultationMonth(idx, e.target.value)
                            }
                            placeholder="Январь 2024"
                          />
                        </div>
                        <div className="form-group month-amount-group">
                          <label>Сумма</label>
                          <input
                            type="text"
                            value={consultation.amount}
                            onChange={(e) =>
                              updateConsultationAmount(idx, e.target.value)
                            }
                            placeholder="Сумма"
                          />
                        </div>
                        <button
                          type="button"
                          className="modal-close"
                          onClick={() => removeConsultationMonth(idx)}
                        >
                          ×
                        </button>
                      </div>
                      <div className="checkbox-group-inline checkbox-group-glass">
                        <label>
                          <input
                            type="checkbox"
                            checked={consultation.isPaid || false}
                            onChange={(e) => {
                              const updated = [
                                ...formData.consultationsMonthly,
                              ];
                              updated[idx].isPaid = e.target.checked;
                              if (e.target.checked) {
                                updated[idx].date = new Date()
                                  .toISOString()
                                  .split("T")[0];
                              } else {
                                updated[idx].date = null;
                              }
                              setFormData({
                                ...formData,
                                consultationsMonthly: updated,
                              });
                            }}
                          />
                          Оплачен
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {formData.consultationsMonthly.length > 0 && (
                <div className="total-consultations">
                  <strong>Общая сумма консультаций:</strong>{" "}
                  {formatNumber(totalConsultations)} ₽
                </div>
              )}
            </div>
          )}

          {/* Авансы */}
          <div className="form-section">
            <h3>Авансы</h3>

            {/* Аванс по договору */}
            <div className="form-row">
              <div className="form-group">
                <label>Аванс по договору</label>
                <input
                  type="text"
                  value={formData.advances[0]?.amount || ""}
                  onChange={(e) => {
                    const newAdvances = [...formData.advances];
                    newAdvances[0].amount = e.target.value;
                    setFormData({ ...formData, advances: newAdvances });
                  }}
                  placeholder="Сумма аванса"
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.advances[0]?.isPaid || false}
                    onChange={(e) => {
                      const newAdvances = [...formData.advances];
                      newAdvances[0].isPaid = e.target.checked;
                      setFormData({ ...formData, advances: newAdvances });
                    }}
                  />
                  Оплачен
                </label>
              </div>
            </div>

            {/* Аванс по доп.соглашению */}
            {showAdditionalAgreement && (
              <div className="form-row">
                <div className="form-group">
                  <label>Аванс по доп.соглашению</label>
                  <input
                    type="text"
                    value={formData.advances[1]?.amount || ""}
                    onChange={(e) => {
                      const newAdvances = [...formData.advances];
                      newAdvances[1].amount = e.target.value;
                      setFormData({ ...formData, advances: newAdvances });
                    }}
                    placeholder="Сумма аванса"
                  />
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.advances[1]?.isPaid || false}
                      onChange={(e) => {
                        const newAdvances = [...formData.advances];
                        newAdvances[1].isPaid = e.target.checked;
                        setFormData({ ...formData, advances: newAdvances });
                      }}
                    />
                    Оплачен
                  </label>
                </div>
              </div>
            )}

            {/* Аванс за консультации */}
            {showConsultations && (
              <div className="form-row">
                <div className="form-group">
                  <label>Аванс за консультации</label>
                  <input
                    type="text"
                    value={formData.advances[2]?.amount || ""}
                    onChange={(e) => {
                      const newAdvances = [...formData.advances];
                      newAdvances[2].amount = e.target.value;
                      setFormData({ ...formData, advances: newAdvances });
                    }}
                    placeholder="Сумма аванса"
                  />
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.advances[2]?.isPaid || false}
                      onChange={(e) => {
                        const newAdvances = [...formData.advances];
                        newAdvances[2].isPaid = e.target.checked;
                        setFormData({ ...formData, advances: newAdvances });
                      }}
                    />
                    Оплачен
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Переключатель "Оплата по этапам" */}
          <div className="checkbox-group-full checkbox-group-glass">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.hasStages || false}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    hasStages: e.target.checked,
                    finalPayment: "",
                    finalPaymentIsPaid: false,
                    stages:
                      e.target.checked && formData.stages.length === 0
                        ? [
                            {
                              id: 1,
                              name: "Этап 1",
                              amount: "",
                              advanceAmount: "",
                              advanceIsPaid: false,
                              finalAmount: "",
                              finalIsPaid: false,
                            },
                          ]
                        : formData.stages,
                  });
                }}
              />
              <span>Оплата проекта в несколько этапов</span>
            </label>
          </div>

          {/* Этапы оплаты - с возможностью добавления/удаления */}
          {formData.hasStages && (
            <div className="form-section">
              <div className="section-header-with-button">
                {/* <h3>Этапы оплаты</h3> */}
                <div className="add-buttons">
                  <button
                    type="button"
                    className="add-button"
                    onClick={addStage}
                  >
                    + Добавить этап
                  </button>
                </div>
              </div>

              {formData.stages.map((stage, idx) => {
                const stageTotal = parseNumber(stage.amount);
                const stageAdvance = parseNumber(stage.advanceAmount);
                const stageFinal = parseNumber(stage.finalAmount);
                const stagePaid =
                  (stage.advanceIsPaid ? stageAdvance : 0) +
                  (stage.finalIsPaid ? stageFinal : 0);
                const stageRemaining = stageTotal - stagePaid;
                const isStageComplete = stageRemaining === 0 && stageTotal > 0;

                return (
                  <div key={stage.id} className="stage-card-expanded">
                    <div className="stage-header">
                      <div className="stage-title">{stage.name}</div>
                      {formData.stages.length > 1 && (
                        <button
                          type="button"
                          className="modal-close"
                          onClick={() => removeStage(idx)}
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {/* Общая стоимость этапа */}
                    <div className="form-group">
                      <label>Стоимость этапа</label>
                      <input
                        type="text"
                        value={stage.amount || ""}
                        onChange={(e) => {
                          const newStages = [...formData.stages];
                          newStages[idx].amount = e.target.value;
                          setFormData({ ...formData, stages: newStages });
                        }}
                        placeholder="Общая сумма этапа"
                      />
                    </div>

                    {/* Аванс по этапу */}
                    <div className="form-row stage-payment-row">
                      <div className="form-group stage-advance">
                        <label>Аванс по этапу</label>
                        <input
                          type="text"
                          value={stage.advanceAmount || ""}
                          onChange={(e) => {
                            const newStages = [...formData.stages];
                            newStages[idx].advanceAmount = e.target.value;
                            setFormData({ ...formData, stages: newStages });
                          }}
                          placeholder="Сумма аванса"
                        />
                      </div>
                      <div className="form-group checkbox-group">
                        <label>
                          <input
                            type="checkbox"
                            checked={stage.advanceIsPaid || false}
                            onChange={(e) => {
                              const newStages = [...formData.stages];
                              newStages[idx].advanceIsPaid = e.target.checked;
                              setFormData({ ...formData, stages: newStages });
                            }}
                          />
                          Оплачен
                        </label>
                      </div>
                    </div>

                    {/* Финальная оплата по этапу */}
                    <div className="form-row stage-payment-row">
                      <div className="form-group stage-final">
                        <label>Финальная оплата этапа</label>
                        <input
                          type="text"
                          value={stage.finalAmount || ""}
                          onChange={(e) => {
                            const newStages = [...formData.stages];
                            newStages[idx].finalAmount = e.target.value;
                            setFormData({ ...formData, stages: newStages });
                          }}
                          placeholder="Сумма финальной оплаты"
                        />
                      </div>
                      <div className="form-group checkbox-group">
                        <label>
                          <input
                            type="checkbox"
                            checked={stage.finalIsPaid || false}
                            onChange={(e) => {
                              const newStages = [...formData.stages];
                              newStages[idx].finalIsPaid = e.target.checked;
                              setFormData({ ...formData, stages: newStages });
                            }}
                          />
                          Оплачен
                        </label>
                      </div>
                    </div>

                    {/* Индикатор завершённости этапа */}
                    {stageTotal > 0 && (
                      <div
                        className={`stage-status-indicator ${isStageComplete ? "complete" : "incomplete"}`}
                        style={{
                          color: "var(--text-secondary)",
                          marginTop: "10px",
                        }}
                      >
                        {isStageComplete ? (
                          <span>Этап полностью оплачен</span>
                        ) : (
                          <span>
                            Остаток по этапу: {formatNumber(stageRemaining)} ₽
                          </span>
                        )}
                      </div>
                    )}

                    {idx < formData.stages.length - 1 && (
                      <div className="stage-divider" />
                    )}
                  </div>
                );
              })}

              {/* Информация о суммах для этапов */}
            </div>
          )}

          {/* Информация о сумме проекта и остатке */}
          <div className="project-summary">
            <div className="summary-row">
              <span>Общая сумма проекта:</span>
              <strong>{formatNumber(totalProjectAmount)} ₽</strong>
            </div>
            <div className="summary-row paid">
              <span>Оплачено авансами:</span>
              <strong className="paid-amount">
                {formatNumber(paidAdvances)} ₽
              </strong>
            </div>
            {formData.hasStages && (
              <div className="summary-row paid">
                <span>Оплачено по этапам:</span>
                <strong className="paid-amount">
                  {formatNumber(paidStages)} ₽
                </strong>
              </div>
            )}
            <div className="summary-row paid">
              <span>Остаток к оплате:</span>
              <strong className="paid-amount">
                {formatNumber(remainingAmount)} ₽
              </strong>
            </div>
          </div>

          {/* Финальная оплата - только для обычных проектов */}
          {!formData.hasStages && remainingAmount > 0 && (
            <div className="form-section final-payment-auto">
              <h3>🎯 Финальная оплата</h3>
              <div className="final-payment-info">
                <div className="final-payment-amount">
                  <span>Сумма к оплате:</span>
                  <strong>{formatNumber(remainingAmount)} ₽</strong>
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.finalPaymentIsPaid || false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          finalPaymentIsPaid: e.target.checked,
                        })
                      }
                    />
                    Оплачен
                  </label>
                </div>
              </div>
              <div className="checkbox-hint">
                Финальная сумма рассчитывается автоматически: общая сумма -
                оплаченные авансы
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Отмена
          </button>
          <button className="save-btn" onClick={onSave}>
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
