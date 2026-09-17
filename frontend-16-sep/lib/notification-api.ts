// frontend/lib/notification-api.ts

import {
    api,
    type ApiOk,
} from "@/lib/api";

export interface AppNotification {
    id: number;
    type: string;
    title: string;
    message: string;
    entity_type: string;
    entity_id?: number | null;
    entity_reference: string;
    action_url: string;
    read_at?: string | null;
    created_at: string;
}

export interface NotificationListData {
    items: AppNotification[];
    unread_count: number;
}

export const notificationApi = {
    list: (limit = 20) =>
        api.get<
            ApiOk<NotificationListData>
        >(
            `/dashboard/notifications?limit=${encodeURIComponent(
                String(limit)
            )}`
        ),

    markRead: (id: number) =>
        api.patch<
            ApiOk<{
                updated: boolean;
            }>
        >(
            `/dashboard/notifications/${id}/read`,
            {}
        ),

    markAllRead: () =>
        api.patch<
            ApiOk<{
                updated: number;
            }>
        >(
            "/dashboard/notifications/read-all",
            {}
        ),
};

export function notificationTimeLabel(
    createdAt: string
): string {
    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const seconds = Math.max(
        0,
        Math.floor(
            (Date.now() - date.getTime()) / 1000
        )
    );

    if (seconds < 60) {
        return "Just now";
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
        return `${minutes} min ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
        return `${hours} hr ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
        return `${days} day${days === 1 ? "" : "s"} ago`;
    }

    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    );
}
