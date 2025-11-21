"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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

interface ClassDetailsStepProps {
  data: ClassDetailsInput;
  onDataChange: (data: ClassDetailsInput) => void;
  onValidationChange: (isValid: boolean) => void;
}

export function ClassDetailsStep({
  data,
  onDataChange,
  onValidationChange,
}: ClassDetailsStepProps) {
  const [scheduleConflict, setScheduleConflict] = useState<any>(null);
  const [isCheckingSchedule, setIsCheckingSchedule] = useState(false);

  const { teachers, loading: teachersLoading } = useUstad({ available: true });

  const form = useForm<ClassDetailsInput>({
    resolver: zodResolver(classDetailsSchema),
    defaultValues: data,
    mode: "onChange",
  });

  const selectedTeacher = teachers.find((t) => t.id === form.watch("ustadId"));

  // Watch for form changes
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value) {
        onDataChange(value as ClassDetailsInput);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch, onDataChange]);

  // Watch for validation changes
  useEffect(() => {
    const isValid = form.formState.isValid;
    onValidationChange(isValid);
  }, [form.formState.isValid, onValidationChange]);

  // Check schedule conflicts when teacher or schedule changes
  useEffect(() => {
    const checkScheduleConflicts = async () => {
      const ustadId = form.getValues("ustadId");
      const schedule = form.getValues("schedule");

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
    form.watch("ustadId"),
    form.watch("schedule.days"),
    form.watch("schedule.startTime"),
    form.watch("schedule.endTime"),
  ]);

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
          <Form {...form}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Class Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Kelas</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Kelas 7A Matematika"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Nama kelas yang unik dan mudah diidentifikasi
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Academic Year */}
              <FormField
                control={form.control}
                name="academicYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tahun Akademik</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tahun akademik" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {academicYears.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Tahun akademik untuk kelas ini
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pengajar</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="ustadId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pilih Pengajar</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih pengajar untuk kelas ini" />
                    </SelectTrigger>
                  </FormControl>
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
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Selected Teacher Info */}
          {selectedTeacher && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-green-900">
                    {selectedTeacher.name}
                  </h4>
                  <p className="text-sm text-green-700">
                    {selectedTeacher.email}
                  </p>
                  {selectedTeacher.specialization && (
                    <p className="text-sm text-green-600">
                      Spesialisasi: {selectedTeacher.specialization}
                    </p>
                  )}
                  {selectedTeacher.phone && (
                    <p className="text-sm text-green-600">
                      Telepon: {selectedTeacher.phone}
                    </p>
                  )}
                  {selectedTeacher.currentClasses !== undefined && (
                    <div className="mt-2">
                      <Badge
                        variant="outline"
                        className="bg-green-100 text-green-800 border-green-200"
                      >
                        {selectedTeacher.currentClasses} kelas aktif
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
            <FormField
              control={form.control}
              name="schedule.days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hari Pelaksanaan</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {DAYS_OF_WEEK.map((day) => (
                      <FormField
                        key={day}
                        control={form.control}
                        name="schedule.days"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(day)}
                                onCheckedChange={(checked) => {
                                  const updatedDays = checked
                                    ? [...(field.value || []), day]
                                    : field.value?.filter((d) => d !== day) ||
                                      [];
                                  field.onChange(updatedDays);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              {day}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="schedule.startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Waktu Mulai</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih waktu mulai" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="schedule.endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Waktu Selesai</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih waktu selesai" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            {form.watch("schedule.days")?.length > 0 &&
              form.watch("schedule.startTime") &&
              form.watch("schedule.endTime") && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800">
                    Jadwal: {form.watch("schedule.days")?.join(", ")},{" "}
                    {form.watch("schedule.startTime")} -{" "}
                    {form.watch("schedule.endTime")}
                  </p>
                </div>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ClassDetailsStep;
