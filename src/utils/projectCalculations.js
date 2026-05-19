import { parseNumber, formatNumber } from "./formatters";

const sumPaidAdvances = (advances = []) =>
  advances
    .filter((a) => a.isPaid && parseNumber(a.amount) > 0)
    .reduce((sum, a) => sum + parseNumber(a.amount), 0);

const sumConsultationsDue = (monthly = []) =>
  monthly.reduce((sum, c) => sum + parseNumber(c.amount), 0);

const sumPaidConsultations = (monthly = []) =>
  monthly
    .filter((c) => c.isPaid && parseNumber(c.amount) > 0)
    .reduce((sum, c) => sum + parseNumber(c.amount), 0);

const getStagePaidAmount = (stage = {}) => {
  const stageAmount = parseNumber(stage.amount);
  const advanceAmount = parseNumber(stage.advanceAmount);
  const finalAmount = parseNumber(stage.finalAmount);
  const hasAdvance = advanceAmount > 0;
  const hasFinal = finalAmount > 0;
  const advancePaid = Boolean(stage.advanceIsPaid);
  const finalPaid = Boolean(stage.finalIsPaid);

  // Если этап отмечен полностью (или есть только одна часть и она оплачена),
  // считаем закрытой всю сумму этапа.
  if ((hasAdvance && hasFinal && advancePaid && finalPaid) ||
      (hasAdvance && !hasFinal && advancePaid) ||
      (!hasAdvance && hasFinal && finalPaid)) {
    return stageAmount;
  }

  let paid = 0;
  if (advancePaid) paid += advanceAmount;
  if (finalPaid) paid += finalAmount;
  return paid;
};

const sumPaidStages = (stages = []) =>
  stages.reduce((sum, s) => sum + getStagePaidAmount(s), 0);

const hasPaymentStages = (stages = []) =>
  stages.some((s) => parseNumber(s.amount) > 0);

/** Общая сумма к оплате по проекту (этапы не добавляются сверху — они часть договора) */
export const calculateTotalDue = (details = {}) => {
  const contract = parseNumber(details.contractCost);
  const additional = parseNumber(details.additionalAgreementCost);
  const consultations = sumConsultationsDue(details.consultationsMonthly);
  return contract + additional + consultations;
};

export const calculateFinalPaymentDue = (details = {}) => {
  const totalDue = calculateTotalDue(details);
  const paidAdvances = sumPaidAdvances(details.advances);
  const paidConsultations = sumPaidConsultations(details.consultationsMonthly);
  return Math.max(0, totalDue - paidAdvances - paidConsultations);
};

/** Сколько уже оплачено */
export const calculateTotalPaid = (details = {}) => {
  const paidAdvances = sumPaidAdvances(details.advances);
  const paidConsultations = sumPaidConsultations(details.consultationsMonthly);
  const paidStages = sumPaidStages(details.stages);

  if (hasPaymentStages(details.stages)) {
    return paidAdvances + paidConsultations + paidStages;
  }

  const finalPaid = Boolean(details.finalPaymentIsPaid);
  const finalDue = calculateFinalPaymentDue(details);

  if (finalPaid && finalDue > 0) {
    // Финальный платёж закрывает весь текущий остаток.
    return paidAdvances + paidConsultations + finalDue;
  }

  return paidAdvances + paidConsultations;
};

export const calculateBalance = (details = {}) => {
  const totalDue = calculateTotalDue(details);
  const totalPaid = calculateTotalPaid(details);
  return Math.max(0, totalDue - totalPaid);
};

export const calculateProjectTotals = (project) => {
  const details = project?.details || {};
  const totalDue = calculateTotalDue(details);
  const totalPaid = calculateTotalPaid(details);
  const balance = Math.max(0, totalDue - totalPaid);

  return {
    totalDue,
    totalPaid,
    balance,
    formattedBalance: formatNumber(balance),
    isFullyPaid: balance === 0 && totalDue > 0,
  };
};

/** Для формы в модалке (formData) */
export const calculateFormTotals = (formData) => {
  const details = {
    contractCost: formData.contractCost,
    additionalAgreementCost: formData.additionalAgreementCost,
    consultationsMonthly: formData.consultationsMonthly,
    advances: formData.advances,
    stages: formData.hasStages ? formData.stages : [],
    finalPayment: formData.hasStages ? null : formData.finalPayment,
    finalPaymentIsPaid: formData.hasStages ? false : formData.finalPaymentIsPaid,
  };
  return calculateProjectTotals({ details });
};

/** Остаток для автозаполнения финального платежа (без этапов) */
export const calculateFinalPaymentRemaining = (formData) => {
  const totalDue = calculateTotalDue({
    contractCost: formData.contractCost,
    additionalAgreementCost: formData.additionalAgreementCost,
    consultationsMonthly: formData.consultationsMonthly,
  });
  const paidAdvances = sumPaidAdvances(formData.advances);
  const paidConsultations = sumPaidConsultations(formData.consultationsMonthly);
  return Math.max(0, totalDue - paidAdvances - paidConsultations);
};
