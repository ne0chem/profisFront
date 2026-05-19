import React from "react";
import { formatNumber } from "../utils/formatters";

const PaymentModal = ({ isOpen, onClose, stage, onConfirm }) => {
  if (!isOpen) return null;

  const handleAdvanceOnly = () => {
    onConfirm("advance");
    onClose();
  };

  const handleFinalOnly = () => {
    onConfirm("final");
    onClose();
  };

  const handleFullPayment = () => {
    onConfirm("full");
    onClose();
  };

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div
        className="payment-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="payment-modal-header">
          <h3>{stage.name}</h3>
          <button className="payment-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="payment-modal-body">
          <p className="payment-stage-total">
            Стоимость этапа: {formatNumber(stage.amount)} ₽
          </p>
          <div className="payment-options">
            <button
              className="payment-option advance"
              onClick={handleAdvanceOnly}
            >
              <span></span>
              <div>
                <strong>Только аванс</strong>
                <small>{formatNumber(stage.advanceAmount)} ₽</small>
              </div>
            </button>
            <button className="payment-option final" onClick={handleFinalOnly}>
              <span></span>
              <div>
                <strong>Только финальная оплата</strong>
                <small>{formatNumber(stage.finalAmount)} ₽</small>
              </div>
            </button>
            <button className="payment-option full" onClick={handleFullPayment}>
              <span></span>
              <div>
                <strong>Полностью оплатить этап</strong>
                <small>{formatNumber(stage.amount)} ₽</small>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
