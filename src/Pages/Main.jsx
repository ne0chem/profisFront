import React, { useState } from "react";
import { useProjects } from "../hooks/useProjects";
import ProjectRow from "../components/ProjectRow";
import ProjectModal from "../components/ProjectModal";
import { parseNumber, formatNumber } from "../utils/formatters";
import { calculateProjectTotals } from "../utils/projectCalculations";
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

    const consultationsAmount = formData.consultationsMonthly.reduce(
      (sum, c) => sum + parseNumber(c.amount),
      0,
    );

    let stagesToSend = [];

    if (formData.hasStages) {
      console.log("Создаю этапы для отправки:", formData.stages);

      stagesToSend = formData.stages.map((s, index) => ({
        id: index + 1,
        name: s.name || `Этап ${index + 1}`,
        amount: s.amount || null,
        advanceAmount: s.advanceAmount || null,
        advanceIsPaid: s.advanceIsPaid || false,
        finalAmount: s.finalAmount || null,
        finalIsPaid: s.finalIsPaid || false,
      }));

      console.log("Отправляемые этапы:", stagesToSend);
    }

    const previewProject = {
      details: {
        contractCost: formData.contractCost,
        additionalAgreementCost: formData.additionalAgreementCost,
        consultationsMonthly: formData.consultationsMonthly,
        advances: formData.advances,
        stages: stagesToSend,
        finalPayment: !formData.hasStages ? formData.finalPayment : null,
        finalPaymentIsPaid: !formData.hasStages
          ? formData.finalPaymentIsPaid
          : false,
      },
    };
    const { balance } = calculateProjectTotals(previewProject);

    const projectData = {
      project: formData.projectName,
      description: formData.description,
      totalBalance: formatNumber(balance),
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
        finalPaymentIsPaid: !formData.hasStages
          ? formData.finalPaymentIsPaid
          : false,
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
        <h1 className="page-title">Оплата проектов</h1>
        <button className="add-button" onClick={handleAddProject}>
          + Добавить проект
        </button>
      </div>

      <div className="table-wrapper">
        <table className="payment-table">
          <thead>
            <tr>
              <th className="expand-header"></th>
              <th>Проекты</th>
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
