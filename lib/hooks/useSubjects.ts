import { useState, useEffect } from "react";
import api from "@/lib/api";

export interface Subject {
  id: string;
  name: string;
  classId: string;
  className: string;
}

export interface SubjectsResponse {
  subjects: Subject[];
  total: number;
}

// Default subjects to use as fallback
const DEFAULT_SUBJECTS = [
  "Matematika",
  "Bahasa Indonesia",
  "Bahasa Arab",
  "Bahasa Inggris",
  "IPA",
  "IPS",
  "Pendidikan Agama Islam",
  "Al-Quran",
  "Hadist",
  "Akidah Akhlak",
  "Fiqih",
  "Sejarah Islam",
  "PKn",
  "Penjaskes",
  "Seni Budaya",
  "Prakarya",
  "TIK",
  "Bimbingan Konseling",
];

export const useSubjects = (classId?: string) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubjects = async (selectedClassId?: string) => {
    if (!selectedClassId) {
      setSubjects([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Special case for "other" class selection
    if (selectedClassId === "other") {
      console.log("[useSubjects] Using default subjects for 'other' selection");
      const defaultSubjects = DEFAULT_SUBJECTS.map((subject, index) => ({
        id: `other-${index}`,
        name: subject,
        classId: "other",
        className: "Custom Subject",
      }));
      setSubjects(defaultSubjects);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(
        "[useSubjects] Fetching subjects for class:",
        selectedClassId
      );
      const startTime = Date.now();

      const response = await api.get(
        `/api/classes/${selectedClassId}/subjects`
      );

      const endTime = Date.now();
      console.log(
        `[useSubjects] API call completed in ${endTime - startTime}ms`
      );

      if (response.status === 200) {
        const data: SubjectsResponse = response.data;
        const fetchedSubjects = data.subjects || [];

        // If no subjects found, use default subjects
        if (fetchedSubjects.length === 0) {
          console.log(
            "[useSubjects] No subjects found, using default subjects"
          );
          const defaultSubjects = DEFAULT_SUBJECTS.map((subject, index) => ({
            id: `default-${index}`,
            name: subject,
            classId: selectedClassId,
            className: "Default Subject",
          }));
          setSubjects(defaultSubjects);
        } else {
          setSubjects(fetchedSubjects);
        }
      } else {
        // If API returns error (like 400 for missing class), use default subjects
        console.log(
          "[useSubjects] API error, using default subjects as fallback"
        );
        const defaultSubjects = DEFAULT_SUBJECTS.map((subject, index) => ({
          id: `default-${index}`,
          name: subject,
          classId: selectedClassId,
          className: "Default Subject",
        }));
        setSubjects(defaultSubjects);
        setError(
          response.data?.error ||
            "Gagal memuat data mata pelajaran, menggunakan data default"
        );
      }
    } catch (err: any) {
      console.error("[useSubjects] Error fetching subjects:", err);

      // Log detailed error information
      if (err.response) {
        console.error(
          "[useSubjects] Error response status:",
          err.response.status
        );
        console.error("[useSubjects] Error response data:", err.response.data);
        console.error(
          "[useSubjects] Error response headers:",
          err.response.headers
        );
      }

      // On any error, use default subjects as fallback
      console.log(
        "[useSubjects] Network error, using default subjects as fallback"
      );
      const defaultSubjects = DEFAULT_SUBJECTS.map((subject, index) => ({
        id: `fallback-${index}`,
        name: subject,
        classId: selectedClassId || "unknown",
        className: "Fallback Subject",
      }));
      setSubjects(defaultSubjects);
      setError(
        err.response?.data?.error ||
          "Terjadi kesalahan saat memuat data mata pelajaran, menggunakan data default"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects(classId);
  }, [classId]);

  return {
    subjects,
    loading,
    error,
    fetchSubjects,
    refetch: () => fetchSubjects(classId),
  };
};
