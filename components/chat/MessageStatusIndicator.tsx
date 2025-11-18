import { Check, CheckCheck } from "lucide-react";

interface MessageStatusIndicatorProps {
  status?: "sent" | "delivered" | "read";
  size?: "sm" | "md" | "lg";
}

export default function MessageStatusIndicator({
  status,
  size = "md",
}: MessageStatusIndicatorProps) {
  if (!status) {
    return null;
  }

  // Debug: Log status to console
  console.log("MessageStatusIndicator - Status:", status);

  const getStatusText = (status: string) => {
    switch (status) {
      case "sent":
        return "Sent";
      case "delivered":
        return "Delivered";
      case "read":
        return "Read";
      default:
        return "";
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "sent":
        return "sent";
      case "delivered":
        return "delivered";
      case "read":
        return "read";
      default:
        return "";
    }
  };

  const getSizeClass = (size: string) => {
    switch (size) {
      case "sm":
        return "w-3 h-3";
      case "lg":
        return "w-5 h-5";
      default:
        return "w-4 h-4";
    }
  };

  const iconSize = getSizeClass(size);

  return (
    <div
      className={`message-status-indicator message-status-tooltip ${getStatusClass(
        status
      )}`}
      data-status={getStatusText(status)}
    >
      {status === "sent" && <Check className={iconSize} />}
      {status === "delivered" && <CheckCheck className={iconSize} />}
      {status === "read" && <CheckCheck className={iconSize} />}
    </div>
  );
}
