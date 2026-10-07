import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Worker, Department } from '../types';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Users,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { downloadFile } from '../services/exportService';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportWorkers: (newWorkers: Worker[], mode: 'replace' | 'append') => void;
  currentWorkersCount: number;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportWorkers,
  currentWorkersCount,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedWorkers, setParsedWorkers] = useState<Worker[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    processFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    processFile(droppedFile);
  };

  const processFile = async (inputFile: File) => {
    setFile(inputFile);
    setErrorMsg(null);
    setIsProcessing(true);

    try {
      const data = await inputFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (rows.length === 0) {
        throw new Error('La hoja de cálculo está vacía o no contiene filas con datos.');
      }

      // Flexible column mapper
      const normalizedWorkers: Worker[] = [];

      rows.forEach((row, index) => {
        // Find name column
        const nameKey = Object.keys(row).find((k) =>
          /nombre|name|trabajador|empleado|apellidos/i.test(k.trim())
        );
        const nameVal = nameKey ? String(row[nameKey]).trim() : '';

        // Find department column
        const deptKey = Object.keys(row).find((k) =>
          /departamento|department|dpto|área|area|sección|seccion/i.test(k.trim())
        );
        const deptVal = deptKey ? String(row[deptKey]).trim() : 'Producción';

        // Skip rows without a valid name
        if (!nameVal || nameVal.length < 2) return;

        // Role column
        const roleKey = Object.keys(row).find((k) =>
          /puesto|role|cargo|posicion|posución|función|ocupación/i.test(k.trim())
        );
        const roleVal = roleKey ? String(row[roleKey]).trim() : 'Operador';

        // Hours column
        const hoursKey = Object.keys(row).find((k) =>
          /horas|hours|jornada|contrato/i.test(k.trim())
        );
        const hoursVal = hoursKey ? Number(row[hoursKey]) || 40 : 40;

        // Phone column
        const phoneKey = Object.keys(row).find((k) =>
          /telefono|teléfono|phone|movil|móvil|celular/i.test(k.trim())
        );
        const phoneVal = phoneKey ? String(row[phoneKey]).trim() : `+34600${String(index + 1).padStart(6, '0')}`;

        // ID column
        const idKey = Object.keys(row).find((k) =>
          /id|numero|número|nº|código|codigo|emp/i.test(k.trim())
        );
        const idVal = idKey && String(row[idKey]).trim()
          ? String(row[idKey]).trim()
          : `EMP-${String(index + 1).padStart(3, '0')}`;

        normalizedWorkers.push({
          id: `w-imported-${Date.now()}-${index}`,
          employeeNumber: idVal,
          name: nameVal,
          department: (deptVal || 'Producción') as Department,
          role: roleVal || 'Operador',
          contractHours: hoursVal,
          phoneNumber: phoneVal,
          email: `${nameVal.toLowerCase().replace(/[^a-z0-9]/g, '.')}@empresa.com`,
          status: 'Activo',
          vacationDaysTotal: 30,
          vacationDaysUsed: 0,
          rotationPattern: '5x2',
        });
      });

      if (normalizedWorkers.length === 0) {
        throw new Error(
          'No se pudieron detectar columnas de "Nombre" y "Departamento". Asegúrese de que la primera fila contenga encabezados con esos nombres.'
        );
      }

      setParsedWorkers(normalizedWorkers);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al analizar el archivo Excel');
      setParsedWorkers([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Nº Empleado': 'EMP-001',
        'Nombre y Apellidos': 'Juan Pérez Gómez',
        'Departamento': 'Producción',
        'Puesto': 'Supervisor de Línea',
        'Horas Semanales': 40,
        'Teléfono': '+34612345678',
      },
      {
        'Nº Empleado': 'EMP-002',
        'Nombre y Apellidos': 'María López Morales',
        'Departamento': 'Operaciones',
        'Puesto': 'Coordinadora de Envíos',
        'Horas Semanales': 40,
        'Teléfono': '+34612345679',
      },
      {
        'Nº Empleado': 'EMP-003',
        'Nombre y Apellidos': 'David Torres Castillo',
        'Departamento': 'Mantenimiento',
        'Puesto': 'Electromecánico',
        'Horas Semanales': 40,
        'Teléfono': '+34612345680',
      },
      {
        'Nº Empleado': 'EMP-004',
        'Nombre y Apellidos': 'Laura Sánchez Rubio',
        'Departamento': 'Calidad',
        'Puesto': 'Inspectora de Calidad',
        'Horas Semanales': 40,
        'Teléfono': '+34612345681',
      },
      {
        'Nº Empleado': 'EMP-005',
        'Nombre y Apellidos': 'Carlos Martín Vega',
        'Departamento': 'Atención al Cliente',
        'Puesto': 'Agente de Soporte 24/7',
        'Horas Semanales': 35,
        'Teléfono': '+34612345682',
      },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    ws['!cols'] = [
      { wch: 14 },
      { wch: 28 },
      { wch: 22 },
      { wch: 24 },
      { wch: 16 },
      { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Trabajadores');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    downloadFile(blob, 'Plantilla_Trabajadores_TurnoPro.xlsx');
  };

  const handleConfirmImport = () => {
    if (parsedWorkers.length === 0) return;
    onImportWorkers(parsedWorkers, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">
                Importar Plantilla de Personal desde Excel (.xlsx / .csv)
              </h3>
              <p className="text-xs text-slate-500">
                Cargue su propio archivo con los nombres y departamentos de su equipo.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm">
            ✕
          </button>
        </div>

        {/* Template download prompt */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <div className="font-semibold text-slate-800">¿No tienes el archivo con formato listo?</div>
            <div className="text-[11px] text-slate-500">
              Descarga nuestra plantilla de ejemplo con las columnas recomendadas.
            </div>
          </div>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 shadow-2xs whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Descargar Plantilla Excel</span>
          </button>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/60 hover:bg-indigo-50/30 rounded-xl p-6 text-center transition-colors cursor-pointer relative"
        >
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <div className="flex flex-col items-center justify-center gap-2 text-xs">
            <Upload className="w-8 h-8 text-indigo-500" />
            <div className="font-semibold text-slate-800">
              Arrastre y suelte su archivo Excel (.xlsx, .xls) o CSV aquí
            </div>
            <div className="text-[11px] text-slate-500">
              O haga clic para seleccionar desde su equipo
            </div>
            {file && (
              <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 font-mono text-[11px]">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Error al procesar el archivo:</div>
              <div>{errorMsg}</div>
            </div>
          </div>
        )}

        {/* Preview of parsed rows */}
        {parsedWorkers.length > 0 && (
          <div className="flex-1 overflow-hidden flex flex-col space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Se detectaron {parsedWorkers.length} trabajadores válidos</span>
              </div>

              {/* Mode selector */}
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="text-indigo-600"
                  />
                  <span>Reemplazar plantilla ({currentWorkersCount} actuales)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 ml-2">
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="text-indigo-600"
                  />
                  <span>Sumar / Añadir</span>
                </label>
              </div>
            </div>

            {/* Table preview */}
            <div className="border border-slate-200 rounded-lg overflow-y-auto max-h-48 text-xs">
              <table className="w-full">
                <thead className="bg-slate-100 text-slate-700 sticky top-0">
                  <tr className="border-b border-slate-200 text-left font-semibold">
                    <th className="py-2 px-3">ID</th>
                    <th className="py-2 px-3">Nombre y Apellidos</th>
                    <th className="py-2 px-3">Departamento</th>
                    <th className="py-2 px-3">Puesto</th>
                    <th className="py-2 px-3 text-center">Horas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedWorkers.slice(0, 10).map((w, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-1.5 px-3 font-mono text-slate-500">{w.employeeNumber}</td>
                      <td className="py-1.5 px-3 font-semibold text-slate-900">{w.name}</td>
                      <td className="py-1.5 px-3 text-slate-600">{w.department}</td>
                      <td className="py-1.5 px-3 text-slate-600">{w.role}</td>
                      <td className="py-1.5 px-3 text-center font-mono">{w.contractHours}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedWorkers.length > 10 && (
                <div className="p-2 bg-slate-50 text-center text-[11px] text-slate-400 border-t border-slate-200 italic">
                  +{parsedWorkers.length - 10} trabajadores más listos para importar.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800"
          >
            Cancelar
          </button>
          <button
            disabled={parsedWorkers.length === 0}
            onClick={handleConfirmImport}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            <span>Confirmar e Importar {parsedWorkers.length} Trabajadores</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
