import { useState, useEffect } from "react";
import api from "@/lib/api";

export interface Notification {
  id: string;
  type: "behavior_report" | "quran_report" | "academic_report" | "system";
  title: string;
  message: string;
  reportId?: string;
  priority: "low" | "medium" | "high" | "critical";
  targetRole: "admin" | "ustad" | "orangtua";
  actionUrl?: string;
  createdAt: string;
  read: boolean;
  readAt?: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const useNotifications = (filters?: {
  type?: string;
  priority?: string;
  read?: string;
  targetRole?: string;
  page?: number;
  limit?: number;
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(filters?.page || 1);
  const [totalPages, setTotalPages] = useState(0);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters?.type) params.append("type", filters.type);
      if (filters?.priority) params.append("priority", filters.priority);
      if (filters?.read !== undefined) params.append("read", filters.read);
      if (filters?.targetRole) params.append("targetRole", filters.targetRole);
      if (filters?.page) params.append("page", filters.page.toString());
      if (filters?.limit) params.append("limit", filters.limit.toString());

      console.log(
        "[useNotifications] Starting fetchNotifications with filters:",
        filters
      );
      const startTime = Date.now();

      const response = await api.get(`/api/notifications?${params.toString()}`);

      const endTime = Date.now();
      console.log(
        `[useNotifications] API call completed in ${endTime - startTime}ms`
      );

      if (response.status === 200) {
        const data: NotificationsResponse = response.data;
        setNotifications(data.notifications);
        setTotal(data.total);
        setCurrentPage(data.page);
        setTotalPages(data.totalPages);
      } else {
        setError(response.data?.error || "Gagal memuat data notifikasi");
      }
    } catch (err: any) {
      console.error("Error fetching notifications:", err);
      setError(
        err.response?.data?.error ||
          "Terjadi kesalahan saat memuat data notifikasi"
      );
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const response = await api.put(`/api/notifications?id=${id}`);

      if (response.status === 200) {
        // Update local notification state
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === id
              ? {
                  ...notification,
                  read: true,
                  readAt: new Date().toISOString(),
                }
              : notification
          )
        );
        return true;
      } else {
        setError(
          response.data?.error || "Gagal menandai notifikasi sebagai dibaca"
        );
        return false;
      }
    } catch (err: any) {
      console.error("Error marking notification as read:", err);
      setError(
        err.response?.data?.error ||
          "Terjadi kesalahan saat menandai notifikasi"
      );
      return false;
    }
  };

  const deleteNotification = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const response = await api.delete(`/api/notifications?id=${id}`);

      if (response.status === 200) {
        // Remove from local state
        setNotifications((prev) =>
          prev.filter((notification) => notification.id !== id)
        );
        return true;
      } else {
        setError(response.data?.error || "Gagal menghapus notifikasi");
        return false;
      }
    } catch (err: any) {
      console.error("Error deleting notification:", err);
      setError(
        err.response?.data?.error ||
          "Terjadi kesalahan saat menghapus notifikasi"
      );
      return false;
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [
    filters?.type,
    filters?.priority,
    filters?.read,
    filters?.targetRole,
    filters?.page,
    filters?.limit,
  ]);

  return {
    notifications,
    loading,
    error,
    total,
    currentPage,
    totalPages,
    fetchNotifications,
    markAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  };
};
