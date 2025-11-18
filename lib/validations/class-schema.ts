import { z } from "zod";

// Days of week in Indonesian
const DAYS_OF_WEEK = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const;

// Time validation helper
const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

// Class details validation
export const classDetailsSchema = z
  .object({
    name: z
      .string()
      .min(3, "Nama kelas minimal 3 karakter")
      .max(50, "Nama kelas maksimal 50 karakter")
      .regex(
        /^[a-zA-Z0-9\s\-]+$/,
        "Nama kelas hanya boleh mengandung huruf, angka, spasi, dan dash"
      ),
    academicYear: z
      .string()
      .min(4, "Tahun akademik tidak valid")
      .regex(
        /^\d{4}\/\d{4}$/,
        "Format tahun akademik harus YYYY/YYYY (contoh: 2024/2025)"
      ),
    ustadId: z.string().min(1, "Pengajar wajib dipilih"),
    schedule: z
      .object({
        days: z
          .array(z.string())
          .min(1, "Pilih minimal 1 hari")
          .max(6, "Maksimal 6 hari"),
        startTime: z
          .string()
          .min(1, "Waktu mulai wajib diisi")
          .regex(timeRegex, "Format waktu tidak valid (contoh: 08:00)"),
        endTime: z
          .string()
          .min(1, "Waktu selesai wajib diisi")
          .regex(timeRegex, "Format waktu tidak valid (contoh: 10:00)"),
      })
      .refine(
        (data) => {
          // Check if end time is after start time
          const [startHour, startMin] = data.startTime.split(":").map(Number);
          const [endHour, endMin] = data.endTime.split(":").map(Number);
          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;
          return endMinutes > startMinutes;
        },
        {
          message: "Waktu selesai harus setelah waktu mulai",
          path: ["endTime"],
        }
      ),
  })
  .refine(
    (data) => {
      // Check if duration is reasonable (minimum 30 minutes, maximum 6 hours)
      const [startHour, startMin] = data.schedule.startTime
        .split(":")
        .map(Number);
      const [endHour, endMin] = data.schedule.endTime.split(":").map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      const duration = endMinutes - startMinutes;
      return duration >= 30 && duration <= 360; // 30 min to 6 hours
    },
    {
      message: "Durasi kelas minimal 30 menit dan maksimal 6 jam",
      path: ["schedule"],
    }
  );

// Student enrollment validation
export const studentEnrollmentSchema = z.object({
  studentIds: z
    .array(z.string())
    .min(1, "Pilih minimal 1 santri")
    .max(50, "Maksimal 50 santri per kelas"),
  filters: z
    .object({
      entryYear: z.string().optional(),
      status: z.string().optional(),
      search: z.string().optional(),
    })
    .optional(),
});

// Complete class creation validation
export const createClassSchema = classDetailsSchema.merge(
  studentEnrollmentSchema
);

// Update class validation (all fields optional)
export const updateClassSchema = createClassSchema.partial();

// Types for TypeScript
export type ClassDetailsInput = z.infer<typeof classDetailsSchema>;
export type StudentEnrollmentInput = z.infer<typeof studentEnrollmentSchema>;
export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;

// Helper functions
export const generateAcademicYears = (count: number = 7) => {
  const currentYear = new Date().getFullYear();
  const years = [];

  for (let i = -2; i <= count; i++) {
    const startYear = currentYear + i;
    const endYear = startYear + 1;
    years.push(`${startYear}/${endYear}`);
  }

  return years;
};

export const generateTimeOptions = () => {
  const times = [];

  for (let hour = 6; hour <= 21; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const timeStr = `${hour.toString().padStart(2, "0")}:${min
        .toString()
        .padStart(2, "0")}`;
      times.push(timeStr);
    }
  }

  return times;
};

export const formatScheduleDisplay = (
  schedule: ClassDetailsInput["schedule"]
) => {
  const dayNames = schedule.days.join(", ");
  return `${dayNames}, ${schedule.startTime} - ${schedule.endTime}`;
};

// Validation error messages in Indonesian
export const VALIDATION_MESSAGES = {
  REQUIRED: "Field ini wajib diisi",
  MIN_LENGTH: (min: number) => `Minimal ${min} karakter`,
  MAX_LENGTH: (max: number) => `Maksimal ${max} karakter`,
  INVALID_EMAIL: "Email tidak valid",
  INVALID_TIME: "Format waktu tidak valid (HH:MM)",
  INVALID_ACADEMIC_YEAR: "Format tahun akademik harus YYYY/YYYY",
  MIN_STUDENTS: "Pilih minimal 1 santri",
  MAX_STUDENTS: "Maksimal 50 santri per kelas",
  MIN_DAYS: "Pilih minimal 1 hari",
  MAX_DAYS: "Maksimal 6 hari",
  TIME_CONFLICT: "Waktu selesai harus setelah waktu mulai",
  DURATION_LIMIT: "Durasi kelas minimal 30 menit dan maksimal 6 jam",
  SCHEDULE_CONFLICT: "Jadwal bertentangan dengan kelas lain",
  DUPLICATE_CLASS:
    "Kelas dengan nama, tahun akademik, dan pengajar yang sama sudah ada",
  TEACHER_NOT_FOUND: "Pengajar tidak ditemukan",
  INVALID_TEACHER: "User yang dipilih bukan pengajar",
  STUDENT_NOT_FOUND: "Santri tidak ditemukan",
  INVALID_STUDENT: "User yang dipilih bukan santri",
} as const;

export { DAYS_OF_WEEK };
