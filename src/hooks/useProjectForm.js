import { useMemo, useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { createProjectReport } from '../services/projectReportService';

const createActivity = () => ({
  id: Date.now() + Math.random(),
  actividad: '',
  area: '',
  cantidad: '',
  valorUnitario: '',
  total: '',
  cotizacion: '',
  observacion: '',
  imagen: '',
  imagenNombre: '',
});

export default function useProjectForm() {
  const reportRef = useRef(null);
  const [reportInfo, setReportInfo] = useState({
    fecha: '',
    serialProyecto: '',
    cliente: '',
    cotizacionGeneral: '',
  });
  const [activities, setActivities] = useState([createActivity()]);
  const [message, setMessage] = useState('');
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);

  const grandTotal = useMemo(
    () =>
      activities.reduce((sum, activity) => {
        const total = parseFloat(activity.total);
        return sum + (Number.isNaN(total) ? 0 : total);
      }, 0),
    [activities],
  );

  const handleReportChange = (e) => {
    const { name, value } = e.target;
    setReportInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const updateActivity = (index, name, value) => {
    setActivities((prev) =>
      prev.map((activity, activityIndex) => {
        if (activityIndex !== index) {
          return activity;
        }

        const nextActivity = {
          ...activity,
          [name]: value,
        };

        if (name === 'cantidad' || name === 'valorUnitario') {
          const cantidad = name === 'cantidad' ? parseFloat(value) : parseFloat(activity.cantidad);
          const valorUnitario =
            name === 'valorUnitario' ? parseFloat(value) : parseFloat(activity.valorUnitario);

          if (!Number.isNaN(cantidad) && !Number.isNaN(valorUnitario)) {
            nextActivity.total = (cantidad * valorUnitario).toFixed(2);
          } else {
            nextActivity.total = '';
          }
        }

        return nextActivity;
      }),
    );
  };

  const handleActivityChange = (index, e) => {
    const { name, value } = e.target;
    updateActivity(index, name, value);
  };

  const handleImageChange = (index, e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setActivities((prev) =>
        prev.map((activity, activityIndex) =>
          activityIndex === index
            ? {
                ...activity,
                imagen: reader.result,
                imagenNombre: file.name,
              }
            : activity,
        ),
      );
    };
    reader.readAsDataURL(file);
  };

  const addActivity = () => {
    setActivities((prev) => [...prev, createActivity()]);
  };

  const removeActivity = (index) => {
    setActivities((prev) => prev.filter((_, activityIndex) => activityIndex !== index));
  };

  const exportToPdf = async () => {
    if (!reportRef.current) {
      return;
    }

    setExporting(true);
    setMessage('');

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`informe-siev-${reportInfo.serialProyecto || 'sin-serial'}.pdf`);
      setMessage('Informe exportado correctamente en PDF.');
    } catch (error) {
      setMessage(`No se pudo exportar el PDF: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const sendToApi = async () => {
    setSaving(true);
    setMessage('');

    try {
      const payload = {
        ...reportInfo,
        totalGeneral: grandTotal,
        actividades: activities.map((activity) => ({
          actividad: activity.actividad,
          area: activity.area,
          cantidad: activity.cantidad,
          valorUnitario: activity.valorUnitario,
          total: activity.total,
          cotizacion: activity.cotizacion,
          observacion: activity.observacion,
          imagen: activity.imagen,
          imagenNombre: activity.imagenNombre,
        })),
      };

      console.group('Payload enviado al endpoint');
      console.log(payload);
      console.log('payload-json:', JSON.stringify(payload, null, 2));
      console.groupEnd();

      await createProjectReport(payload);
      setMessage('Informe enviado al API correctamente.');
    } catch (error) {
      setMessage(`No se pudo enviar al API: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return {
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
    setReportInfo,
    setActivities,
    setMessage,
  };
}
