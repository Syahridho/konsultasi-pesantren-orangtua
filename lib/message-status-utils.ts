import { ref, get, update } from "firebase/database";
import { database } from "./firebase";

// Fungsi untuk mengecek status online user
export async function checkUserOnlineStatus(userId: string): Promise<boolean> {
  try {
    const userStatusRef = ref(database, `status/${userId}`);
    const snapshot = await get(userStatusRef);

    if (snapshot.exists()) {
      const status = snapshot.val();
      // Consider user online if status is "online" or last seen within last 5 minutes
      if (status.state === "online") {
        return true;
      }

      // Check if last seen is within 5 minutes
      if (status.lastChanged) {
        const lastSeen = new Date(status.lastChanged);
        const now = new Date();
        const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
        return diffMinutes < 5;
      }
    }

    return false;
  } catch (error) {
    console.error("Error checking user online status:", error);
    return false;
  }
}

// Fungsi untuk menangani pesan yang gagal terkirim
export async function handleFailedMessageDelivery(
  chatId: string,
  messageId: string,
  error: string
): Promise<void> {
  try {
    const messageRef = ref(database, `chats/${chatId}/messages/${messageId}`);

    // Update message status to failed with error information
    await update(messageRef, {
      status: "failed",
      error: error,
      failedAt: new Date().toISOString(),
    });
  } catch (updateError) {
    console.error("Error updating failed message status:", updateError);
  }
}

// Fungsi untuk retry pengiriman pesan
export async function retryMessageDelivery(
  chatId: string,
  messageId: string
): Promise<boolean> {
  try {
    const messageRef = ref(database, `chats/${chatId}/messages/${messageId}`);
    const snapshot = await get(messageRef);

    if (!snapshot.exists()) {
      return false;
    }

    const messageData = snapshot.val();

    // Reset status to sent for retry
    await update(messageRef, {
      status: "sent",
      error: null,
      failedAt: null,
      retriedAt: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error("Error retrying message delivery:", error);
    return false;
  }
}

// Fungsi untuk menandai pesan sebagai delivered dengan penanganan error
export async function safeMarkAsDelivered(
  chatId: string,
  messageId: string,
  userId: string
): Promise<boolean> {
  try {
    const messageRef = ref(database, `chats/${chatId}/messages/${messageId}`);
    const snapshot = await get(messageRef);

    if (!snapshot.exists()) {
      return false;
    }

    const messageData = snapshot.val();

    // Only recipient can update status (not the sender)
    if (messageData.senderId === userId) {
      return false;
    }

    // Don't update if already delivered or read
    if (messageData.status === "delivered" || messageData.status === "read") {
      return true;
    }

    // Prepare status update
    const statusUpdate: any = {
      status: "delivered",
    };

    // Initialize statusTimestamp if it doesn't exist
    const currentStatusTimestamp = messageData.statusTimestamp || {};

    // Add timestamp for the specific status
    statusUpdate.statusTimestamp = {
      ...currentStatusTimestamp,
      delivered: new Date().toISOString(),
    };

    // Update message status
    await update(messageRef, statusUpdate);
    return true;
  } catch (error) {
    console.error("Error marking message as delivered:", error);
    return false;
  }
}

// Fungsi untuk menandai pesan sebagai read dengan penanganan error
export async function safeMarkAsRead(
  chatId: string,
  messageId: string,
  userId: string
): Promise<boolean> {
  try {
    const messageRef = ref(database, `chats/${chatId}/messages/${messageId}`);
    const snapshot = await get(messageRef);

    if (!snapshot.exists()) {
      return false;
    }

    const messageData = snapshot.val();

    // Only recipient can update status (not the sender)
    if (messageData.senderId === userId) {
      return false;
    }

    // Don't update if already read
    if (messageData.status === "read") {
      return true;
    }

    // Prepare status update
    const statusUpdate: any = {
      status: "read",
    };

    // Initialize statusTimestamp if it doesn't exist
    const currentStatusTimestamp = messageData.statusTimestamp || {};

    // Add timestamp for the specific status
    statusUpdate.statusTimestamp = {
      ...currentStatusTimestamp,
      read: new Date().toISOString(),
    };

    // Update message status
    await update(messageRef, statusUpdate);
    return true;
  } catch (error) {
    console.error("Error marking message as read:", error);
    return false;
  }
}

// Fungsi untuk batch update status pesan dengan penanganan error
export async function batchUpdateMessageStatus(
  chatId: string,
  messageIds: string[],
  status: "delivered" | "read",
  userId: string
): Promise<{ success: string[]; failed: string[] }> {
  const results = { success: [], failed: [] } as {
    success: string[];
    failed: string[];
  };

  for (const messageId of messageIds) {
    let success = false;
    let retryCount = 0;
    const maxRetries = 3;

    // Special handling for problematic message IDs (multiple patterns)
    const isProblematicMessage =
      messageId === "-OeM8hFohHFWTaIC0iuD" ||
      messageId === "-OeMAMZscMJUhjzuZI10" ||
      (messageId.startsWith("-OeM") && messageId.length > 15);

    while (retryCount < maxRetries && !success) {
      try {
        // Add diagnostic logging before API call
        console.log(
          `[DEBUG] Attempting to update status for message ${messageId} in chat ${chatId} to ${status} (attempt ${
            retryCount + 1
          })`
        );

        // Use API endpoint instead of direct Firebase access
        const response = await fetch(
          `/api/chat/${chatId}/messages/${messageId}/status`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status }),
          }
        );

        if (response.ok) {
          success = true;
          console.log(
            `Successfully updated status for message ${messageId} to ${status}`
          );
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error(
            `Failed to update status for message ${messageId} (attempt ${
              retryCount + 1
            }):`,
            response.status,
            errorData.error || response.statusText
          );

          // Add additional diagnostic info for 404 errors
          if (response.status === 404) {
            console.log(`[DEBUG] 404 Error Details:`, {
              chatId,
              messageId,
              userId,
              status,
              errorData,
              isProblematicMessage,
            });
          }

          // If message not found, wait longer before retry
          if (response.status === 404) {
            // For problematic messages, try direct Firebase update as fallback
            if (isProblematicMessage && retryCount >= 2) {
              console.log(
                `[DEBUG] Attempting direct Firebase update for problematic message ${messageId}`
              );
              console.log(
                `[DEBUG] Firebase path: chats/${chatId}/messages/${messageId}`
              );
              try {
                // Import Firebase functions directly for fallback
                const { ref, get, update } = await import("firebase/database");
                const { database } = await import("@/lib/firebase");

                const messageRef = ref(
                  database,
                  `chats/${chatId}/messages/${messageId}`
                );
                const snapshot = await get(messageRef);

                if (snapshot.exists()) {
                  const messageData = snapshot.val();
                  console.log(`[DEBUG] Found message data:`, messageData);

                  // Only recipient can update status (not the sender)
                  if (messageData.senderId !== userId) {
                    const statusUpdate: any = {
                      status,
                    };

                    // Initialize statusTimestamp if it doesn't exist
                    const currentStatusTimestamp =
                      messageData.statusTimestamp || {};

                    // Add timestamp for specific status
                    statusUpdate.statusTimestamp = {
                      ...currentStatusTimestamp,
                      [status]: new Date().toISOString(),
                    };

                    // Update message status directly
                    await update(messageRef, statusUpdate);
                    success = true;
                    console.log(
                      `[DEBUG] Successfully updated status for problematic message ${messageId} using direct Firebase`
                    );
                  } else {
                    console.log(
                      `[DEBUG] User ${userId} is the sender, cannot update status`
                    );
                  }
                } else {
                  console.log(
                    `[DEBUG] Message not found at path: chats/${chatId}/messages/${messageId}`
                  );

                  // Let's check what messages exist in this chat
                  const chatMessagesRef = ref(
                    database,
                    `chats/${chatId}/messages`
                  );
                  const chatMessagesSnapshot = await get(chatMessagesRef);
                  if (chatMessagesSnapshot.exists()) {
                    const allMessages = chatMessagesSnapshot.val();
                    const messageIds = Object.keys(allMessages);
                    console.log(
                      `[DEBUG] Available message IDs in chat ${chatId}:`,
                      messageIds
                    );
                  } else {
                    console.log(`[DEBUG] No messages found in chat ${chatId}`);
                  }
                }
              } catch (directError) {
                console.error(
                  `Direct Firebase update also failed for message ${messageId}:`,
                  directError
                );
              }
            }

            await new Promise((resolve) =>
              setTimeout(resolve, 500 * (retryCount + 1))
            );
          }
        }
      } catch (error) {
        console.error(
          `Error updating status for message ${messageId} (attempt ${
            retryCount + 1
          }):`,
          error
        );
      }

      retryCount++;

      // Add delay between retries
      if (!success && retryCount < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 300 * retryCount));
      }
    }

    if (success) {
      results.success.push(messageId);
    } else {
      results.failed.push(messageId);
    }

    // Add small delay to prevent overwhelming database
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

// Fungsi untuk mendapatkan pesan yang perlu diupdate statusnya
export function getMessagesNeedingStatusUpdate(
  messages: any[],
  userId: string,
  statusType: "delivered" | "read"
): string[] {
  return messages
    .filter((message) => {
      // Only consider messages from other users
      if (message.senderId === userId) {
        return false;
      }

      // Check if message needs status update
      if (statusType === "delivered") {
        return message.status !== "delivered" && message.status !== "read";
      } else if (statusType === "read") {
        return message.status !== "read";
      }

      return false;
    })
    .map((message) => message.id);
}
