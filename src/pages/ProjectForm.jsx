import React from 'react';
import './ProjectForm.css';
import ActivityCard from '../components/ActivityCard';
import ReportHeader from '../components/ReportHeader';
import ReportSummary from '../components/ReportSummary';
import useProjectForm from '../hooks/useProjectForm';

function ProjectForm() {
  const {
    reportRef,
    reportInfo,
    activities,
    message,
    exporting,
    saving,
    grandTotal,
    handleReportChange,
    handleActivityChange,
    handleImageChange,
    addActivity,
    removeActivity,
    exportToPdf,
    sendToApi,
  } = useProjectForm();

  return (
    <div className="project-form-container">
      <div className="form-wrapper">
        <div className="form-header">
          <div>
            <p className="form-eyebrow">Informe de actividades</p>
            <h1 className="form-title">Reporte SIEV</h1>
            <p className="form-subtitle">
              Completa los datos del informe, agrega las actividades necesarias y exporta el
              resultado a PDF.
            </p>
          </div>

          <button type="button" className="add-activity-btn" onClick={addActivity}>
            + Agregar actividad
          </button>
        </div>

        {message && <div className="form-message">{message}</div>}

        <div className="report-capture" ref={reportRef}>
          <ReportHeader reportInfo={reportInfo} onChange={handleReportChange} />

          {activities.map((activity, index) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              index={index}
              activitiesLength={activities.length}
              onActivityChange={handleActivityChange}
              onImageChange={handleImageChange}
              onRemove={removeActivity}
            />
          ))}

          <ReportSummary
            grandTotal={grandTotal}
            saving={saving}
            exporting={exporting}
            onSend={sendToApi}
            onExport={exportToPdf}
          />
        </div>
      </div>
    </div>
  );
}

export default ProjectForm;
