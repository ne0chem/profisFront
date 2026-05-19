import { useState, useEffect } from "react";
import axios from "axios";
import { formatNumber } from "../utils/formatters";
import { calculateProjectTotals } from "../utils/projectCalculations";

const withRecalculatedBalance = (projects) =>
  projects.map((project) => {
    const { formattedBalance } = calculateProjectTotals(project);
    return { ...project, totalBalance: formattedBalance };
  });

const API_URL = "http://localhost:5001/api";

export const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openProjectId, setOpenProjectId] = useState(null);

  const fetchProjects = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const response = await axios.get(`${API_URL}/projects`);
      if (response.data.success) {
        setProjects(withRecalculatedBalance(response.data.data));
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const toggleProjectOpen = (projectId) => {
    setOpenProjectId(openProjectId === projectId ? null : projectId);
  };

  const toggleStagePayment = async (projectId, stageId, currentStatus) => {
    try {
      await axios.patch(`${API_URL}/projects/${projectId}/stage/${stageId}`, {
        isPaid: !currentStatus,
      });
      await fetchProjects({ silent: true });
    } catch (error) {
      console.error("Error updating stage:", error);
    }
  };

  const toggleAdvancePayment = async (projectId, advanceId, currentStatus) => {
    try {
      await axios.patch(
        `${API_URL}/projects/${projectId}/advance/${advanceId}`,
        {
          isPaid: !currentStatus,
        },
      );
      await fetchProjects({ silent: true });
    } catch (error) {
      console.error("Error updating advance:", error);
    }
  };

  const toggleConsultationPayment = async (
    projectId,
    monthIndex,
    currentStatus,
  ) => {
    try {
      const project = projects.find((p) => p._id === projectId);
      const updatedMonthly = [...project.details.consultationsMonthly];
      updatedMonthly[monthIndex].isPaid = !currentStatus;

      if (!currentStatus) {
        updatedMonthly[monthIndex].date = new Date()
          .toISOString()
          .split("T")[0];
      } else {
        updatedMonthly[monthIndex].date = null;
      }

      await axios.patch(`${API_URL}/projects/${projectId}/consultations`, {
        consultationsMonthly: updatedMonthly,
      });

      await fetchProjects({ silent: true });
    } catch (error) {
      console.error("Error updating consultation:", error);
      alert("Ошибка обновления статуса консультации");
    }
  };
  const toggleFinalPayment = async (projectId, currentStatus) => {
    try {
      await axios.patch(`${API_URL}/projects/${projectId}/final-payment`, {
        isPaid: !currentStatus,
      });
      await fetchProjects({ silent: true });
    } catch (error) {
      console.error("Error updating final payment:", error);
      alert("Ошибка обновления статуса финальной оплаты");
    }
  };
  const saveProject = async (projectData, editingProject) => {
    try {
      console.log("Saving to API:", projectData); // Для отладки

      let response;
      if (editingProject) {
        response = await axios.put(
          `${API_URL}/projects/${editingProject._id}`,
          projectData,
        );
      } else {
        response = await axios.post(`${API_URL}/projects`, projectData);
      }

      console.log("API response:", response.data); // Для отладки

      if (response.data.success) {
        await fetchProjects({ silent: true });
        return true;
      }
      return false;
    } catch (error) {
      console.error(
        "Error saving project:",
        error.response?.data || error.message,
      );
      alert(
        "Ошибка сохранения проекта: " +
          (error.response?.data?.message || error.message),
      );
      return false;
    }
  };

  const deleteProject = async (id) => {
    if (window.confirm("Удалить проект?")) {
      try {
        await axios.delete(`${API_URL}/projects/${id}`);
        await fetchProjects({ silent: true });
        if (openProjectId === id) setOpenProjectId(null);
        return true;
      } catch (error) {
        console.error("Error deleting project:", error);
        alert("Ошибка удаления проекта");
        return false;
      }
    }
    return false;
  };
  const toggleStageAdvance = async (projectId, stageId, currentStatus) => {
    try {
      await axios.patch(
        `${API_URL}/projects/${projectId}/stage/${stageId}/advance`,
        {
          isPaid: !currentStatus,
        },
      );
      await fetchProjects({ silent: true });
    } catch (error) {
      console.error("Error updating stage advance:", error);
      alert("Ошибка обновления статуса аванса этапа");
    }
  };

  const toggleStageFinal = async (projectId, stageId, currentStatus) => {
    try {
      await axios.patch(
        `${API_URL}/projects/${projectId}/stage/${stageId}/final`,
        {
          isPaid: !currentStatus,
        },
      );
      await fetchProjects({ silent: true });
    } catch (error) {
      console.error("Error updating stage final:", error);
      alert("Ошибка обновления статуса финальной оплаты этапа");
    }
  };

  return {
    projects,
    loading,
    openProjectId,
    toggleProjectOpen,
    toggleStageAdvance, // ← ДОЛЖНО БЫТЬ
    toggleStageFinal, // ← ДОЛЖНО БЫТЬ
    toggleAdvancePayment,
    toggleConsultationPayment,
    toggleFinalPayment,
    saveProject,
    deleteProject,
    fetchProjects,
  };
};
