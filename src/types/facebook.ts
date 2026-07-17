export interface FacebookPage {
    pageId: string;
    name: string;
    category?: string;
    picture?: string;
    followers?: number;
    about?: string;
    connectedAt?: string;
    status?: "connected" | "expired" | "error";
}

export interface FacebookPost {
    id: string;
    message: string;
    link?: string;
    imageUrl?: string;
    permalinkUrl?: string;
    createdAt: string;
    likeCount?: number;
    commentCount?: number;
    shareCount?: number;
}

export interface FacebookGroup {
    groupId: string;
    groupName: string;
}

export interface FacebookCommentAuthor {
    id: string;
    name: string;
    picture?: string;
}

export interface FacebookComment {
    id: string;
    from: FacebookCommentAuthor;
    message: string;
    createdAt: string;
    hidden?: boolean;
    likeCount?: number;
    canReply?: boolean;
}

export interface FacebookParticipant {
    id: string;
    name: string;
    picture?: string;
}

export interface FacebookConversation {
    id: string;
    snippet: string;
    participants: FacebookParticipant[];
    updatedAt: string;
    unreadCount?: number;
    messageCount?: number;
    canReply?: boolean;
}

export interface FacebookMessage {
    id: string;
    fromId: string;
    fromName: string;
    message: string;
    createdAt: string;
    attachments?: FacebookMessageAttachment[];
}

export interface FacebookMessageAttachment {
    id: string;
    mimeType?: string;
    name?: string;
    size?: number;
    image?: {
        url?: string;
        previewUrl?: string;
        width?: number;
        height?: number;
    };
}

export interface FacebookInsightValue {
    value: number;
    endTime?: string;
}

export interface FacebookInsightMetric {
    name: string;
    period: string;
    values: FacebookInsightValue[];
}

export type InsightPeriod = "day" | "week" | "days_28";
