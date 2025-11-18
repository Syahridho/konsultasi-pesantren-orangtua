import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// Types for report data
export interface AcademicReportExport {
  studentName: string;
  subject: string;
  gradeType: "number" | "letter" | "description";
  gradeNumber?: number;
  gradeLetter?: string;
  gradeDescription?: string;
  semester: string;
  academicYear: string;
  notes?: string;
  ustadName: string;
  createdAt: string;
}

export interface QuranReportExport {
  studentName: string;
  surah: string;
  ayatStart: number;
  ayatEnd: number;
  fluencyLevel: "excellent" | "good" | "fair" | "poor";
  testDate: string;
  notes?: string;
  nextAssignment?: string;
  ustadName: string;
  createdAt: string;
}

export interface BehaviorReportExport {
  studentName: string;
  category: "academic" | "behavior" | "discipline" | "health" | "other";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  incidentDate: string;
  location?: string;
  actionTaken?: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  followUpRequired: boolean;
  followUpDate?: string;
  ustadName: string;
  createdAt: string;
}

// Export Academic Reports to PDF
export const exportAcademicReportsToPDF = (
  reports: AcademicReportExport[],
  title: string = "Laporan Akademik Santri"
): void => {
  const doc = new jsPDF();

  // Add title page
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, 105, 20, { align: "center" });
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleString("id-ID")}`, 105, 30, {
    align: "center",
  });
  doc.line(105, 35, 105, 35);

  // Add table
  const tableData = reports.map((report) => [
    report.studentName || "",
    report.subject || "",
    report.gradeType === "number"
      ? `${report.gradeNumber}/100`
      : report.gradeType === "letter"
      ? report.gradeLetter || ""
      : report.gradeType === "description"
      ? "Deskripsi"
      : "-",
    report.semester || "",
    report.academicYear || "",
    report.notes || "-",
    report.ustadName || "",
    new Date(report.createdAt).toLocaleDateString("id-ID"),
  ]);

  const tableHeaders = [
    ["Nama Santri"],
    ["Mata Pelajaran"],
    ["Nilai"],
    ["Semester"],
    ["Tahun"],
    ["Catatan"],
    ["Ustad"],
    ["Tanggal"],
  ];

  autoTable(doc, {
    head: tableHeaders,
    body: tableData,
    startY: 45,
    theme: "striped",
    styles: { fontSize: 10 },
    headStyles: {
      fillColor: "#E5E7EB",
      textColor: "#000000",
      fontStyle: "bold",
    },
    bodyStyles: { fillColor: "#FFFFFF", textColor: "#000000" },
  });

  // Save the PDF
  doc.save(`laporan-akademik-${Date.now()}.pdf`);
};

// Export Quran Reports to PDF
export const exportQuranReportsToPDF = (
  reports: QuranReportExport[],
  title: string = "Laporan Hafalan Quran Santri"
): void => {
  const doc = new jsPDF();

  // Add title page
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, 105, 20, { align: "center" });
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleString("id-ID")}`, 105, 30, {
    align: "center",
  });
  doc.line(105, 35, 105, 35);

  // Add table
  const tableData = reports.map((report) => [
    report.studentName || "",
    report.surah || "",
    `${report.ayatStart} - ${report.ayatEnd}`,
    report.fluencyLevel || "",
    report.notes || "-",
    report.nextAssignment || "-",
    report.ustadName || "",
    new Date(report.testDate).toLocaleDateString("id-ID"),
  ]);

  const tableHeaders = [
    ["Nama Santri"],
    ["Surah"],
    ["Ayat"],
    ["Tingkat Kelancaran"],
    ["Catatan"],
    ["Tugas Berikutnya"],
    ["Ustad"],
    ["Tanggal"],
  ];

  autoTable(doc, {
    head: tableHeaders,
    body: tableData,
    startY: 45,
    theme: "striped",
    styles: { fontSize: 10 },
    headStyles: {
      fillColor: "#E5E7EB",
      textColor: "#000000",
      fontStyle: "bold",
    },
    bodyStyles: { fillColor: "#FFFFFF", textColor: "#000000" },
  });

  // Save the PDF
  doc.save(`laporan-hafalan-quran-${Date.now()}.pdf`);
};

// Export Behavior Reports to PDF
export const exportBehaviorReportsToPDF = (
  reports: BehaviorReportExport[],
  title: string = "Laporan Perilaku Santri"
): void => {
  const doc = new jsPDF();

  // Add title page
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, 105, 20, { align: "center" });
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleString("id-ID")}`, 105, 30, {
    align: "center",
  });
  doc.line(105, 35, 105, 35);

  // Add table
  const tableData = reports.map((report) => [
    report.studentName,
    report.title,
    report.category,
    report.priority,
    new Date(report.incidentDate).toLocaleDateString("id-ID"),
    report.status,
    report.actionTaken || "-",
    report.followUpRequired ? "Ya" : "Tidak",
    report.followUpDate
      ? new Date(report.followUpDate).toLocaleDateString("id-ID")
      : "-",
    report.ustadName,
    new Date(report.createdAt).toLocaleDateString("id-ID"),
  ]);

  const tableHeaders = [
    ["Nama Santri"],
    ["Judul"],
    ["Kategori"],
    ["Prioritas"],
    ["Tanggal"],
    ["Status"],
    ["Tindakan"],
    ["Perlu Follow-up"],
    ["Tanggal Follow-up"],
    ["Ustad"],
    ["Dibuat"],
  ];

  autoTable(doc, {
    head: tableHeaders,
    body: tableData,
    startY: 45,
    theme: "striped",
    styles: { fontSize: 9 },
    headStyles: {
      fillColor: "#E5E7EB",
      textColor: "#000000",
      fontStyle: "bold",
    },
    bodyStyles: { fillColor: "#FFFFFF", textColor: "#000000" },
  });

  // Save the PDF
  doc.save(`laporan-perilaku-${Date.now()}.pdf`);
};

// Export Academic Reports to Excel
export const exportAcademicReportsToExcel = (
  reports: AcademicReportExport[],
  filename: string = `laporan-akademik-${Date.now()}`
): void => {
  const tableData = reports.map((report) => ({
    "Nama Santri": report.studentName,
    "Mata Pelajaran": report.subject,
    "Tipe Nilai": report.gradeType,
    Nilai:
      report.gradeType === "number"
        ? report.gradeNumber
        : report.gradeType === "letter"
        ? report.gradeLetter
        : report.gradeDescription,
    Semester: report.semester,
    "Tahun Akademik": report.academicYear,
    Catatan: report.notes || "",
    Ustad: report.ustadName,
    Tanggal: new Date(report.createdAt).toLocaleDateString("id-ID"),
  }));

  const ws = XLSX.utils.json_to_sheet(tableData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws);
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

// Export Quran Reports to Excel
export const exportQuranReportsToExcel = (
  reports: QuranReportExport[],
  filename: string = `laporan-hafalan-quran-${Date.now()}`
): void => {
  const tableData = reports.map((report) => ({
    "Nama Santri": report.studentName,
    Surah: report.surah,
    "Ayat Awal": report.ayatStart,
    "Ayat Akhir": report.ayatEnd,
    "Jumlah Ayat": report.ayatEnd - report.ayatStart + 1,
    "Tingkat Kelancaran": report.fluencyLevel,
    "Tanggal Uji": new Date(report.testDate).toLocaleDateString("id-ID"),
    Catatan: report.notes || "",
    "Tugas Berikutnya": report.nextAssignment || "",
    Ustad: report.ustadName,
    Tanggal: new Date(report.createdAt).toLocaleDateString("id-ID"),
  }));

  const ws = XLSX.utils.json_to_sheet(tableData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws);
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

// Generic export functions that can be used by the admin dashboard
export const exportToPDF = async (
  reports: any[],
  reportType: string,
  filters: any
) => {
  switch (reportType) {
    case "academic":
      exportAcademicReportsToPDF(
        reports as AcademicReportExport[],
        "Laporan Akademik Santri"
      );
      break;
    case "quran":
      exportQuranReportsToPDF(
        reports as QuranReportExport[],
        "Laporan Hafalan Quran Santri"
      );
      break;
    case "behavior":
      exportBehaviorReportsToPDF(
        reports as BehaviorReportExport[],
        "Laporan Perilaku Santri"
      );
      break;
    default:
      throw new Error(`Unknown report type: ${reportType}`);
  }
};

export const exportToExcel = async (
  reports: any[],
  reportType: string,
  filters: any
) => {
  switch (reportType) {
    case "academic":
      exportAcademicReportsToExcel(reports as AcademicReportExport[]);
      break;
    case "quran":
      exportQuranReportsToExcel(reports as QuranReportExport[]);
      break;
    case "behavior":
      exportBehaviorReportsToExcel(reports as BehaviorReportExport[]);
      break;
    default:
      throw new Error(`Unknown report type: ${reportType}`);
  }
};

// Export Behavior Reports to Excel
export const exportBehaviorReportsToExcel = (
  reports: BehaviorReportExport[],
  filename: string = `laporan-perilaku-${Date.now()}`
): void => {
  const tableData = reports.map((report) => ({
    "Nama Santri": report.studentName,
    "Judul Laporan": report.title,
    Kategori: report.category,
    Prioritas: report.priority,
    Deskripsi: report.description,
    "Tanggal Kejadian": new Date(report.incidentDate).toLocaleDateString(
      "id-ID"
    ),
    Lokasi: report.location || "",
    "Tindakan Diambil": report.actionTaken || "",
    Status: report.status,
    "Perlu Follow-up": report.followUpRequired ? "Ya" : "Tidak",
    "Tanggal Follow-up": report.followUpDate
      ? new Date(report.followUpDate).toLocaleDateString("id-ID")
      : "",
    Ustad: report.ustadName,
    "Tanggal Dibuat": new Date(report.createdAt).toLocaleDateString("id-ID"),
  }));

  const ws = XLSX.utils.json_to_sheet(tableData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws);
  XLSX.writeFile(wb, `${filename}.xlsx`);
};
