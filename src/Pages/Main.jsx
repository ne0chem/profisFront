import React, { useState } from "react";
import { useProjects } from "../hooks/useProjects";
import ProjectRow from "../components/ProjectRow";
import ProjectModal from "../components/ProjectModal";
import { parseNumber, formatNumber } from "../utils/formatters";
import "./Main.css";

export default function Main() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    projectName: "",
    description: "",
    contractCost: "",
    additionalAgreementCost: "",
    consultationsMonthly: [],
    hasStages: false,
    stages: [],
    finalPayment: "",
    finalPaymentIsPaid: false,
    advances: [],
  });

  // ✅ ДОБАВЬТЕ toggleStageAdvance и toggleStageFinal в деструктуризацию
  const {
    projects,
    loading,
    openProjectId,
    toggleProjectOpen,
    toggleStageAdvance, // ← ДОБАВИТЬ
    toggleStageFinal, // ← ДОБАВИТЬ
    toggleAdvancePayment,
    toggleConsultationPayment,
    toggleFinalPayment,
    saveProject,
    deleteProject,
  } = useProjects();

  const handleAddProject = () => {
    setEditingProject(null);
    setFormData({
      projectName: "",
      description: "",
      contractCost: "",
      additionalAgreementCost: "",
      consultationsMonthly: [],
      hasStages: false,
      stages: [], // ← пустой массив, этапы будут добавляться через кнопку
      finalPayment: "",
      finalPaymentIsPaid: false,
      advances: [
        {
          id: 1,
          name: "Аванс по договору",
          amount: "",
          isPaid: false,
          type: "main",
        },
        {
          id: 2,
          name: "Аванс по доп.соглашению",
          amount: "",
          isPaid: false,
          type: "additional",
        },
        {
          id: 3,
          name: "Аванс за консультации",
          amount: "",
          isPaid: false,
          type: "consultations",
        },
      ],
    });
    setIsModalOpen(true);
  };

  const handleEditProject = (project) => {
    const hasStages =
      project.details?.stages?.some((s) => parseNumber(s.amount) > 0) || false;

    setEditingProject(project);
    setFormData({
      projectName: project.project,
      description: project.description || "",
      contractCost: project.details?.contractCost || "",
      additionalAgreementCost: project.details?.additionalAgreementCost || "",
      consultationsMonthly: project.details?.consultationsMonthly || [],
      hasStages: hasStages,
      stages: project.details?.stages || [],
      finalPayment: project.details?.finalPayment || "",
      finalPaymentIsPaid: project.details?.finalPaymentIsPaid || false,
      advances: project.details?.advances || [
        {
          id: 1,
          name: "Аванс по договору",
          amount: "",
          isPaid: false,
          type: "main",
        },
        {
          id: 2,
          name: "Аванс по доп.соглашению",
          amount: "",
          isPaid: false,
          type: "additional",
        },
        {
          id: 3,
          name: "Аванс за консультации",
          amount: "",
          isPaid: false,
          type: "consultations",
        },
      ],
    });
    setIsModalOpen(true);
  };

  const handleSaveProject = async () => {
    if (!formData.projectName || formData.projectName.trim() === "") {
      alert("Введите название проекта!");
      return;
    }

    const contractAmount = parseNumber(formData.contractCost);
    const additionalAmount = parseNumber(formData.additionalAgreementCost);
    const consultationsAmount = formData.consultationsMonthly.reduce(
      (sum, c) => sum + parseNumber(c.amount),
      0,
    );

    let stagesToSend = [];
    let stagesAmount = 0;
    let paidStages = 0;

    if (formData.hasStages) {
      // ВАЖНО: проверяем, что этапы есть и они правильные
      console.log("Создаю этапы для отправки:", formData.stages);

      stagesToSend = formData.stages.map((s, index) => ({
        id: index + 1, // ← гарантируем правильный ID
        name: s.name || `Этап ${index + 1}`,
        amount: s.amount || null,
        advanceAmount: s.advanceAmount || null,
        advanceIsPaid: s.advanceIsPaid || false,
        finalAmount: s.finalAmount || null,
        finalIsPaid: s.finalIsPaid || false,
      }));

      stagesAmount = stagesToSend.reduce(
        (sum, s) => sum + parseNumber(s.amount),
        0,
      );
      paidStages = stagesToSend.reduce((sum, s) => {
        const advancePaid = s.advanceIsPaid ? parseNumber(s.advanceAmount) : 0;
        const finalPaid = s.finalIsPaid ? parseNumber(s.finalAmount) : 0;
        return sum + advancePaid + finalPaid;
      }, 0);

      console.log("Отправляемые этапы:", stagesToSend);
    }

    const totalContract =
      contractAmount + additionalAmount + consultationsAmount + stagesAmount;

    const paidAdvances = formData.advances
      .filter((a) => a.isPaid && a.amount)
      .reduce((sum, a) => sum + parseNumber(a.amount), 0);

    const paidConsultations = formData.consultationsMonthly
      .filter((c) => c.isPaid && c.amount)
      .reduce((sum, c) => sum + parseNumber(c.amount), 0);

    let finalPaymentAmount = 0;
    let finalPaymentPaid = false;

    if (!formData.hasStages) {
      finalPaymentAmount = parseNumber(formData.finalPayment);
      finalPaymentPaid = formData.finalPaymentIsPaid;
    }

    const totalPaid =
      paidAdvances +
      paidConsultations +
      paidStages +
      (finalPaymentPaid ? finalPaymentAmount : 0);
    const balance = totalContract - totalPaid;

    const projectData = {
      project: formData.projectName,
      description: formData.description,
      totalBalance: formatNumber(balance > 0 ? balance : 0),
      details: {
        contractCost: formData.contractCost || null,
        additionalAgreementCost: formData.additionalAgreementCost || null,
        consultationsCost: formatNumber(consultationsAmount),
        consultationsMonthly: formData.consultationsMonthly.map((c) => ({
          month: c.month,
          amount: c.amount || null,
          isPaid: c.isPaid || false,
          date: c.date || null,
        })),
        stages: stagesToSend, // ← отправляем этапы
        finalPayment: !formData.hasStages
          ? formData.finalPayment || null
          : null,
        finalPaymentIsPaid: !formData.hasStages ? finalPaymentPaid : false,
        advances: formData.advances.map((a) => ({
          id: a.id,
          name: a.name,
          amount: a.amount || null,
          isPaid: a.isPaid || false,
          type: a.type,
        })),
      },
    };

    console.log("Отправляю ВЕСЬ проект:", JSON.stringify(projectData, null, 2));

    const success = await saveProject(projectData, editingProject);
    if (success) {
      setIsModalOpen(false);
      setEditingProject(null);
    }
  };

  const handleDeleteProject = async (id) => {
    await deleteProject(id);
  };

  if (loading) {
    return <div className="loading-spinner">Загрузка проектов...</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Тип платежа</h1>
        <button className="add-button" onClick={handleAddProject}>
          + Добавить проект
        </button>
      </div>

      <div className="table-wrapper">
        <table className="payment-table">
          <thead>
            <tr>
              <th className="expand-header"></th>
              <th>Проект</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td colSpan="2" className="empty-row">
                  Нет проектов. Создайте первый проект!
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <ProjectRow
                  key={project._id}
                  project={project}
                  isOpen={openProjectId === project._id}
                  onToggle={() => toggleProjectOpen(project._id)}
                  onEdit={() => handleEditProject(project)}
                  onDelete={() => handleDeleteProject(project._id)}
                  onToggleStageAdvance={(stageId, currentStatus) =>
                    toggleStageAdvance(project._id, stageId, currentStatus)
                  }
                  onToggleStageFinal={(stageId, currentStatus) =>
                    toggleStageFinal(project._id, stageId, currentStatus)
                  }
                  onToggleAdvance={(advanceId, currentStatus) =>
                    toggleAdvancePayment(project._id, advanceId, currentStatus)
                  }
                  onToggleConsultation={(monthIndex, currentStatus) =>
                    toggleConsultationPayment(
                      project._id,
                      monthIndex,
                      currentStatus,
                    )
                  }
                  onToggleFinalPayment={(currentStatus) =>
                    toggleFinalPayment(project._id, currentStatus)
                  }
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingProject={editingProject}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSaveProject}
      />
    </div>
  );
}
