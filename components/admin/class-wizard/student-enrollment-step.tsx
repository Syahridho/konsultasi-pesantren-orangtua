"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Search, Users, CheckSquare, Square, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useSantri } from "@/lib/hooks/useSantri";
import { Student } from "@/lib/hooks/useSantri";

interface StudentEnrollmentStepProps {
  selectedStudentIds: string[];
  onSelectionChange: (studentIds: string[]) => void;
  onValidationChange: (isValid: boolean) => void;
}

export function StudentEnrollmentStep({
  selectedStudentIds,
  onSelectionChange,
  onValidationChange,
}: StudentEnrollmentStepProps) {
  const [filters, setFilters] = useState({
    entryYear: "",
    status: "",
    search: "",
    page: 1,
    limit: 25,
  });

  const [selectAllMode, setSelectAllMode] = useState<
    "visible" | "filtered" | null
  >(null);
  const [isSelectingAll, setIsSelectingAll] = useState(false);

  const {
    students,
    loading,
    error,
    total,
    pagination,
    availableFilters,
    selectAllVisible,
    selectAllFiltered,
    refetch,
  } = useSantri(filters);

  // Update validation when selection changes
  useEffect(() => {
    onValidationChange(selectedStudentIds.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudentIds]);

  // Handle individual student selection
  const handleStudentToggle = useCallback(
    (studentId: string, checked: boolean) => {
      if (checked) {
        onSelectionChange([...selectedStudentIds, studentId]);
      } else {
        onSelectionChange(selectedStudentIds.filter((id) => id !== studentId));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedStudentIds]
  );

  // Handle select all visible
  const handleSelectAllVisible = useCallback(async () => {
    setIsSelectingAll(true);
    try {
      const visibleStudentIds = selectAllVisible();
      onSelectionChange([
        ...new Set([...selectedStudentIds, ...visibleStudentIds]),
      ]);
      setSelectAllMode("visible");
    } catch (error) {
      console.error("Error selecting all visible students:", error);
    } finally {
      setIsSelectingAll(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudentIds, selectAllVisible]);

  // Handle select all filtered
  const handleSelectAllFiltered = useCallback(async () => {
    setIsSelectingAll(true);
    try {
      const filteredStudentIds = await selectAllFiltered();
      onSelectionChange(filteredStudentIds);
      setSelectAllMode("filtered");
    } catch (error) {
      console.error("Error selecting all filtered students:", error);
    } finally {
      setIsSelectingAll(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectAllFiltered]);

  // Handle deselect all
  const handleDeselectAll = useCallback(() => {
    onSelectionChange([]);
    setSelectAllMode(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle header checkbox toggle
  const handleHeaderCheckboxToggle = useCallback((checked: boolean) => {
    if (checked) {
      handleSelectAllVisible();
    } else {
      const visibleStudentIds = students.map((s) => s.id);
      onSelectionChange(
        selectedStudentIds.filter((id) => !visibleStudentIds.includes(id))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, selectedStudentIds, handleSelectAllVisible]);

  // Handle filter changes
  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  // Check if all visible students are selected
  const allVisibleSelected =
    students.length > 0 &&
    students.every((student) => selectedStudentIds.includes(student.id));

  // Check if all filtered students are selected
  const allFilteredSelected =
    selectAllMode === "filtered" && selectedStudentIds.length >= total;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "graduated":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Aktif";
      case "inactive":
        return "Tidak Aktif";
      case "graduated":
        return "Lulus";
      default:
        return status;
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Pendaftaran Santri
            <Badge variant="outline" className="ml-2">
              {selectedStudentIds.length} terpilih
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari santri..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Entry Year Filter */}
            <Select
              value={filters.entryYear}
              onValueChange={(value) => handleFilterChange("entryYear", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tahun Masuk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tahun</SelectItem>
                {availableFilters.entryYears?.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {availableFilters.availableStatuses?.map((status) => (
                  <SelectItem key={status} value={status}>
                    {getStatusText(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Bulk Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllVisible}
                disabled={
                  loading || students.length === 0 || allVisibleSelected
                }
                className="whitespace-nowrap"
              >
                {isSelectingAll ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : allVisibleSelected ? (
                  <CheckSquare className="h-4 w-4 mr-2" />
                ) : (
                  <Square className="h-4 w-4 mr-2" />
                )}
                Pilih Semua Terlihat
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllFiltered}
                disabled={loading || allFilteredSelected}
                className="whitespace-nowrap"
              >
                {allFilteredSelected ? (
                  <CheckSquare className="h-4 w-4 mr-2" />
                ) : (
                  <Square className="h-4 w-4 mr-2" />
                )}
                Pilih Semua ({total})
              </Button>

              {selectedStudentIds.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAll}
                  className="whitespace-nowrap"
                >
                  Hapus Pilihan
                </Button>
              )}
            </div>
          </div>

          {/* Selection Summary */}
          {selectedStudentIds.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-800">
                {selectedStudentIds.length} santri dipilih untuk kelas ini
              </p>
            </div>
          )}

          {/* Students Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Memuat data santri...</span>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Tidak ada santri yang cocok dengan filter yang dipilih
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <Checkbox
                          checked={allVisibleSelected}
                          onCheckedChange={handleHeaderCheckboxToggle}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nama
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tahun Masuk
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <Checkbox
                            checked={selectedStudentIds.includes(student.id)}
                            onCheckedChange={(checked: boolean) =>
                              handleStudentToggle(student.id, checked)
                            }
                          />
                        </td>
                        <td className="px-4 py-4 font-medium text-gray-900">
                          {student.name}
                        </td>
                        <td className="px-4 py-4 text-gray-500">
                          {student.email}
                        </td>
                        <td className="px-4 py-4 text-gray-500">
                          {student.entryYear || "-"}
                        </td>
                        <td className="px-4 py-4">
                          <Badge className={getStatusColor(student.status)}>
                            {getStatusText(student.status)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {!loading && students.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-700">
                Menampilkan {students.length} dari {total} santri
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                >
                  Sebelumnya
                </Button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Halaman {pagination.page} dari {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default StudentEnrollmentStep;
