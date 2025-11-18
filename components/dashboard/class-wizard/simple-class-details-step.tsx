"use client";

import React, { useEffect, useState, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Users, Clock, AlertTriangle } from "lucide-react";
import { useUstad } from "@/lib/hooks/useUstad";
import {
  classDetailsSchema,
  generateAcademicYears,
  generateTimeOptions,
  DAYS_OF_WEEK,
  type ClassDetailsInput,
} from "@/lib/validations/class-schema";

interface SimpleClassDetailsStepProps {
  data: ClassDetailsInput;
  onDataChange: (data: ClassDetailsInput) => void;
  onValidationChange: (isValid: boolean) => void;
}

export default function SimpleClassDetailsStep({
  data,
  onDataChange,
  onValidationChange,
}: SimpleClassDetailsStepProps) {
  const [scheduleConflict, setScheduleConflict] = useState<any>(null);
  const [isCheckingSchedule, setIsCheckingSchedule] = useState(false);
  const [formData, setFormData] = useState<ClassDetailsInput>(data);
  const isInitialMount = useRef(true);

  const { teachers, loading: teachersLoading } = useUstad({ available: true });

  // Sync with parent data on mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      setFormData(data);
    }
  }, [data]);

  // Watch for form changes and notify parent
  useEffect(() => {
    if (!isInitialMount.current) {
      onDataChange(formData);
      
      // Validate and notify
      const isValid = classDetailsSchema.safeParse(formData).success;
      onValidationChange(isValid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  // Check schedule conflicts when teacher or schedule changes
  useEffect(() => {
    const checkScheduleConflicts = async () => {
      const ustadId = formData.ustadId;
      const schedule = formData.schedule;

      if (
        !ustadId ||
        !schedule?.days?.length ||
        !schedule.startTime ||
        !schedule.endTime
      ) {
        setScheduleConflict(null);
        return;
      }

      setIsCheckingSchedule(true);
      try {
        // This would typically call an API endpoint to check conflicts
        // For now, we'll simulate a basic check
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Simulate conflict detection (in real implementation, this would be an API call)
        const hasConflict = false; // Placeholder for actual conflict logic
        setScheduleConflict(
          hasConflict ? { className: "Existing Class" } : null
        );
      } catch (error) {
        console.error("Error checking schedule conflicts:", error);
      } finally {
        setIsCheckingSchedule(false);
      }
    };

    const timer = setTimeout(checkScheduleConflicts, 500);
    return () => clearTimeout(timer);
  }, [
    formData.ustadId,
    formData.schedule.days,
    formData.schedule.startTime,
    formData.schedule.endTime,
  ]);

  const selectedTeacher = teachers.find((t) => t.id === formData.ustadId);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      if (field.includes(".")) {
        const [parent, child] = field.split(".");
        return {
          ...prev,
          [parent]: {
            ...(prev as any)[parent],
            [child]: value,
          },
        };
      } else {
        return {
          ...prev,
          [field]: value,
        };
      }
    });
  };

  const handleDayToggle = (day: string, checked: boolean) => {
    const currentDays = formData.schedule.days || [];
    const updatedDays = checked
      ? [...currentDays, day]
      : currentDays.filter(d => d !== day);
    
    handleInputChange("schedule.days", updatedDays);
  };

  const academicYears = generateAcademicYears();
  const timeOptions = generateTimeOptions();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Informasi Kelas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Class Name */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Nama Kelas
                </label>
                <Input
                  placeholder="Contoh: Kelas 7A Matematika"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>

              {/* Academic Year */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Tahun Akademik
                </label>
                <Select
                  value={formData.academicYear}
                  onValueChange={(value) => handleInputChange("academicYear", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tahun akademik" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Teacher Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Pilih Pengajar
              </label>
              <Select
                value={formData.ustadId}
                onValueChange={(value) => handleInputChange("ustadId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih pengajar untuk kelas ini" />
                </SelectTrigger>
                <SelectContent>
                  {teachersLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2">Memuat data pengajar...</span>
                    </div>
                  ) : teachers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Tidak ada pengajar tersedia
                    </div>
                  ) : (
                    teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <div className="font-medium">{teacher.name}</div>
                            <div className="text-sm text-gray-500">
                              {teacher.specialization ||
                                "Tidak ada spesialisasi"}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {teacher.currentClasses !== undefined && (
                              <Badge variant="secondary">
                                {teacher.currentClasses} kelas
                              </Badge>
                            )}
                            {teacher.available && (
                              <Badge
                                variant="default"
                                className="bg-green-100 text-green-800"
                              >
                                Tersedia
                              </Badge>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              {/* Selected Teacher Info */}
              {selectedTeacher && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-900">
                        {selectedTeacher.name}
                      </h4>
                      <p className="text-sm text-blue-700">
                        {selectedTeacher.email}
                      </p>
                      {selectedTeacher.specialization && (
                        <p className="text-sm text-blue-600">
                          Spesialisasi: {selectedTeacher.specialization}
                        </p>
                      )}
                      {selectedTeacher.phone && (
                        <p className="text-sm text-blue-600">
                          Telepon: {selectedTeacher.phone}
                        </p>
                      )}
                      {selectedTeacher.currentClasses !== undefined && (
                        <div className="mt-2">
                          <Badge
                            variant="outline"
                            className="bg-blue-100 text-blue-800 border-blue-200"
                          >
                            {selectedTeacher.currentClasses} kelas aktif
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Schedule Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Jadwal Kelas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Days Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Hari Pelaksanaan
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {DAYS_OF_WEEK.map((day) => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox
                            id={`day-${day}`}
                            checked={formData.schedule.days?.includes(day) || false}
                            onCheckedChange={(checked: boolean) => handleDayToggle(day, checked)}
                          />
                          <label htmlFor={`day-${day}`} className="text-sm font-normal cursor-pointer">
                            {day}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Time Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Waktu Mulai
                      </label>
                      <Select
                        value={formData.schedule.startTime}
                        onValueChange={(value) => handleInputChange("schedule.startTime", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih waktu mulai" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Waktu Selesai
                      </label>
                      <Select
                        value={formData.schedule.endTime}
                        onValueChange={(value) => handleInputChange("schedule.endTime", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih waktu selesai" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Schedule Conflict Alert */}
                  {isCheckingSchedule && (
                    <Alert>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <AlertDescription>Memeriksa konflik jadwal...</AlertDescription>
                    </Alert>
                  )}

                  {scheduleConflict && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Jadwal bertentangan dengan kelas "{scheduleConflict.className}
                        ". Silakan pilih waktu atau hari yang berbeda.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Schedule Summary */}
                  {formData.schedule.days?.length > 0 &&
                    formData.schedule.startTime &&
                    formData.schedule.endTime && (
                      <div className="mt-4 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium text-green-800">
                          Jadwal: {formData.schedule.days.join(", ")},{" "}
                          {formData.schedule.startTime} -{" "}
                          {formData.schedule.endTime}
                        </p>
                      </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}