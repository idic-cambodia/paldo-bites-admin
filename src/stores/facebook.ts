import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import type {
    FacebookPage,
    FacebookPost,
    FacebookComment,
    FacebookConversation,
    FacebookMessage,
    FacebookInsightMetric,
    InsightPeriod
} from "@/types/facebook";

/**
 * Base path for the Paldo Facebook integration API.
 *
 * ASSUMPTION: the spec you shared (`/pages`, `/pages/:pageId/posts`, ...) doesn't
 * show a route prefix, but every other admin endpoint in this app lives under
 * `/api/admin/*` and is proxied via vite's `/api` -> VITE_BASE_URL rule. This
 * mirrors that pattern under `/api/facebook`. If the real backend mounts these
 * routes somewhere else (e.g. bare `/pages`, or `/api/pages`), this is the only
 * line you need to change.
 */
const FB_BASE = "/api/admin/facebook";

type ApiEnvelope<T> = {
    success?: boolean;
    message?: string;
    data?: T;
    paging?: { cursors?: { after?: string; before?: string }; next?: string; previous?: string };
    nextCursor?: string;
};

function authHeader(): string {
    const auth = useAuthStore();
    return auth.token.startsWith("Bearer ") ? auth.token : `Bearer ${auth.token}`;
}

async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<ApiEnvelope<T>> {
    const auth = useAuthStore();
    if (!auth.token) throw new Error("Not authenticated.");

    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = {
        Authorization: authHeader(),
        ...(options.body && !isFormData ? { "Content-Type": "application/json" } : {}),
        ...((options.headers as Record<string, string>) || {})
    };

    const response = await fetch(`${FB_BASE}${path}`, { ...options, headers });
    const body = (await response.json().catch(() => ({}))) as ApiEnvelope<T>;
    if (!response.ok || body.success === false) {
        throw new Error(body.message || "Facebook request failed.");
    }
    return body;
}

function pickList(body: ApiEnvelope<any>): any[] {
    if (Array.isArray(body.data)) return body.data;
    if (Array.isArray((body.data as any)?.data)) return (body.data as any).data;
    return [];
}

function pickCursor(body: ApiEnvelope<any>): string | undefined {
    return body.paging?.cursors?.after || body.nextCursor || undefined;
}

function toTimestamp(value: string): number {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
}

function sortMessages(list: FacebookMessage[]): FacebookMessage[] {
    return [...list].sort((a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt));
}

/* ---------- mappers (tolerant of a few likely field-name variants) ---------- */

function mapPage(raw: any): FacebookPage {
    return {
        pageId: raw.pageId || raw.id || raw._id || "",
        name: raw.name || raw.pageName || "Untitled Page",
        category: raw.category,
        picture: raw.picture?.data?.url || raw.picture || raw.pictureUrl,
        followers: raw.followers ?? raw.fan_count ?? raw.followersCount,
        about: raw.about,
        connectedAt: raw.connectedAt || raw.createdAt,
        status: raw.status || "connected"
    };
}

function mapPost(raw: any): FacebookPost {
    return {
        id: raw.id || raw.postId || raw._id || "",
        message: raw.message || raw.text || "",
        link: raw.link,
        imageUrl: raw.imageUrl || raw.full_picture || raw.picture,
        permalinkUrl: raw.permalinkUrl || raw.permalink_url,
        createdAt: raw.createdAt || raw.created_time || new Date().toISOString(),
        likeCount: raw.likeCount ?? raw.likes?.summary?.total_count ?? 0,
        commentCount: raw.commentCount ?? raw.comments?.summary?.total_count ?? 0,
        shareCount: raw.shareCount ?? raw.shares?.count ?? 0
    };
}

function mapComment(raw: any): FacebookComment {
    return {
        id: raw.id || raw.commentId || raw._id || "",
        from: {
            id: raw.from?.id || raw.fromId || "",
            name: raw.from?.name || raw.fromName || "Unknown",
            picture: raw.from?.picture?.data?.url || raw.from?.picture
        },
        message: raw.message || raw.text || "",
        createdAt: raw.createdAt || raw.created_time || new Date().toISOString(),
        hidden: Boolean(raw.hidden ?? raw.is_hidden),
        likeCount: raw.likeCount ?? raw.like_count ?? 0,
        canReply: raw.canReply ?? raw.can_reply ?? true
    };
}

function mapConversation(raw: any): FacebookConversation {
    const participants = raw.participants?.data ??
        raw.participants ??
        raw.senders?.data ??
        raw.senders ??
        [];

    return {
        id: raw.id ?? raw.conversationId ?? raw._id ?? "",
        participants: participants.map((p: any) => ({
            id: p.id ?? "",
            name: p.name ?? "Unknown",
            picture: p.picture?.data?.url ?? p.picture ?? null,
        })),
        snippet: raw.snippet ?? raw.lastMessage ?? raw.snippet_text ?? "",
        updatedAt: raw.updated_time ??  new Date().toISOString(),
        unreadCount: raw.unread_count ??  0,
        messageCount: raw.message_count ??  0,
        canReply: raw.can_reply  ?? true
    };
}

function mapMessage(raw: any): FacebookMessage {
    const attachments = (raw.attachments?.data || []).map((attachment: any) => ({
        id: attachment.id || attachment.media?.id || attachment.name || "",
        mimeType: attachment.mime_type || attachment.mimeType,
        name: attachment.name,
        size: attachment.size,
        image: attachment.image_data
            ? {
                  url: attachment.image_data.url,
                  previewUrl: attachment.image_data.preview_url,
                  width: attachment.image_data.width,
                  height: attachment.image_data.height
              }
            : undefined
    }));

    return {
        id: raw.id || raw.messageId || raw._id || "",
        fromId: raw.from?.id || raw.fromId || "",
        fromName: raw.from?.name || raw.fromName || "Unknown",
        message: raw.message || raw.text || "",
        createdAt: raw.createdAt || raw.created_time || new Date().toISOString(),
        attachments: attachments.length ? attachments : undefined
    };
}

function mapInsightMetric(raw: any): FacebookInsightMetric {
    return {
        name: raw.name,
        period: raw.period,
        values: (raw.values || []).map((v: any) => ({ value: Number(v.value ?? 0), endTime: v.end_time || v.endTime }))
    };
}

/* ---------------------------------- store ---------------------------------- */

export const useFacebookStore = defineStore("facebook", () => {
    // Pages
    const pages = ref<FacebookPage[]>([]);
    const pagesLoading = ref(false);
    const pagesError = ref("");
    const activePageId = ref<string>("");

    const activePage = computed(() => pages.value.find((p) => p.pageId === activePageId.value) || null);

    // Posts
    const posts = ref<FacebookPost[]>([]);
    const postsLoading = ref(false);
    const postsError = ref("");
    const postsCursor = ref<string | undefined>(undefined);
    const postsHasMore = ref(false);

    // Comments (scoped to a single "object", usually a post id)
    const commentsObjectId = ref<string>("");
    const comments = ref<FacebookComment[]>([]);
    const commentsLoading = ref(false);
    const commentsError = ref("");
    const commentsCursor = ref<string | undefined>(undefined);
    const commentsHasMore = ref(false);

    // Inbox
    const conversations = ref<FacebookConversation[]>([]);
    const inboxLoading = ref(false);
    const inboxError = ref("");
    const inboxCursor = ref<string | undefined>(undefined);
    const inboxHasMore = ref(false);

    const activeConversationId = ref<string>("");
    const messages = ref<FacebookMessage[]>([]);
    const messagesLoading = ref(false);
    const messagesError = ref("");
    const messagesCursor = ref<string | undefined>(undefined);
    const messagesHasMore = ref(false);

    // Insights
    const insights = ref<FacebookInsightMetric[]>([]);
    const insightsLoading = ref(false);
    const insightsError = ref("");

    function resetPageScopedState() {
        posts.value = [];
        postsCursor.value = undefined;
        postsHasMore.value = false;
        comments.value = [];
        commentsObjectId.value = "";
        commentsCursor.value = undefined;
        commentsHasMore.value = false;
        conversations.value = [];
        inboxCursor.value = undefined;
        inboxHasMore.value = false;
        activeConversationId.value = "";
        messages.value = [];
        messagesCursor.value = undefined;
        messagesHasMore.value = false;
        insights.value = [];
    }

    function setActivePage(pageId: string) {
        if (activePageId.value === pageId) return;
        activePageId.value = pageId;
        resetPageScopedState();
    }

    /* ---------- Pages ---------- */

    async function fetchPages() {
        pagesLoading.value = true;
        pagesError.value = "";
        try {
            const body = await apiFetch<any[]>("/pages");
            pages.value = pickList(body).map(mapPage);
            if (!activePageId.value && pages.value.length) {
                setActivePage(pages.value[0].pageId);
            }
        } catch (err) {
            pagesError.value = err instanceof Error ? err.message : "Failed to load Facebook pages.";
            pages.value = [];
        } finally {
            pagesLoading.value = false;
        }
    }

    async function connectPage(userAccessToken: string, pageId: string) {
        pagesError.value = "";
        try {
            const body = await apiFetch<any>("/pages/connect", {
                method: "POST",
                body: JSON.stringify({ userAccessToken, pageId })
            });
            await fetchPages();
            if (body.data) setActivePage(mapPage(body.data).pageId);
            return true;
        } catch (err) {
            pagesError.value = err instanceof Error ? err.message : "Failed to connect page.";
            return false;
        }
    }

    async function disconnectPage(pageId: string) {
        pagesError.value = "";
        try {
            await apiFetch(`/pages/${encodeURIComponent(pageId)}`, { method: "DELETE" });
            pages.value = pages.value.filter((p) => p.pageId !== pageId);
            if (activePageId.value === pageId) {
                activePageId.value = "";
                resetPageScopedState();
                if (pages.value.length) setActivePage(pages.value[0].pageId);
            }
            return true;
        } catch (err) {
            pagesError.value = err instanceof Error ? err.message : "Failed to disconnect page.";
            return false;
        }
    }

    async function refreshPage(pageId: string) {
        pagesError.value = "";
        try {
            const body = await apiFetch<any>(`/pages/${encodeURIComponent(pageId)}/refresh`, { method: "POST" });
            const updated = body.data ? mapPage(body.data) : null;
            if (updated) {
                const idx = pages.value.findIndex((p) => p.pageId === pageId);
                if (idx !== -1) pages.value[idx] = updated;
            }
            return true;
        } catch (err) {
            pagesError.value = err instanceof Error ? err.message : "Failed to refresh page.";
            return false;
        }
    }

    /* ---------- Posts ---------- */

    async function fetchPosts(opts: { reset?: boolean } = {}) {
        if (!activePageId.value) return;
        if (opts.reset) {
            posts.value = [];
            postsCursor.value = undefined;
        }
        postsLoading.value = true;
        postsError.value = "";
        try {
            const query = new URLSearchParams({ limit: "20" });
            if (postsCursor.value) query.set("after", postsCursor.value);
            const body = await apiFetch<any[]>(`/pages/${encodeURIComponent(activePageId.value)}/posts?${query}`);
            const list = pickList(body).map(mapPost);
            posts.value = opts.reset ? list : [...posts.value, ...list];
            postsCursor.value = pickCursor(body);
            postsHasMore.value = Boolean(postsCursor.value);
        } catch (err) {
            postsError.value = err instanceof Error ? err.message : "Failed to load posts.";
        } finally {
            postsLoading.value = false;
        }
    }

    async function createPost(payload: { message: string; link?: string; imageBase64?: string }) {
        if (!activePageId.value) return false;
        postsError.value = "";
        try {
            await apiFetch(`/pages/${encodeURIComponent(activePageId.value)}/posts`, {
                method: "POST",
                body: JSON.stringify(payload)
            });
            await fetchPosts({ reset: true });
            return true;
        } catch (err) {
            postsError.value = err instanceof Error ? err.message : "Failed to publish post.";
            return false;
        }
    }

    async function deletePost(postId: string) {
        if (!activePageId.value) return false;
        postsError.value = "";
        try {
            await apiFetch(`/pages/${encodeURIComponent(activePageId.value)}/posts/${encodeURIComponent(postId)}`, {
                method: "DELETE"
            });
            posts.value = posts.value.filter((p) => p.id !== postId);
            return true;
        } catch (err) {
            postsError.value = err instanceof Error ? err.message : "Failed to delete post.";
            return false;
        }
    }

    /* ---------- Comments ---------- */

    async function fetchComments(objectId: string, opts: { reset?: boolean } = {}) {
        if (!activePageId.value) return;
        if (opts.reset || commentsObjectId.value !== objectId) {
            comments.value = [];
            commentsCursor.value = undefined;
            commentsObjectId.value = objectId;
        }
        commentsLoading.value = true;
        commentsError.value = "";
        try {
            const query = new URLSearchParams({ limit: "25" });
            if (commentsCursor.value) query.set("after", commentsCursor.value);
            const body = await apiFetch<any[]>(
                `/pages/${encodeURIComponent(activePageId.value)}/comments/${encodeURIComponent(objectId)}?${query}`
            );
            const list = pickList(body).map(mapComment);
            comments.value = opts.reset ? list : [...comments.value, ...list];
            commentsCursor.value = pickCursor(body);
            commentsHasMore.value = Boolean(commentsCursor.value);
        } catch (err) {
            commentsError.value = err instanceof Error ? err.message : "Failed to load comments.";
        } finally {
            commentsLoading.value = false;
        }
    }

    async function replyComment(commentId: string, message: string) {
        if (!activePageId.value) return false;
        try {
            await apiFetch(
                `/pages/${encodeURIComponent(activePageId.value)}/comments/${encodeURIComponent(commentId)}/reply`,
                { method: "POST", body: JSON.stringify({ message }) }
            );
            if (commentsObjectId.value) await fetchComments(commentsObjectId.value, { reset: true });
            return true;
        } catch (err) {
            commentsError.value = err instanceof Error ? err.message : "Failed to send reply.";
            return false;
        }
    }

    async function deleteComment(commentId: string) {
        if (!activePageId.value) return false;
        try {
            await apiFetch(`/pages/${encodeURIComponent(activePageId.value)}/comments/${encodeURIComponent(commentId)}`, {
                method: "DELETE"
            });
            comments.value = comments.value.filter((c) => c.id !== commentId);
            return true;
        } catch (err) {
            commentsError.value = err instanceof Error ? err.message : "Failed to delete comment.";
            return false;
        }
    }

    async function setCommentHidden(commentId: string, hide: boolean) {
        if (!activePageId.value) return false;
        try {
            await apiFetch(
                `/pages/${encodeURIComponent(activePageId.value)}/comments/${encodeURIComponent(commentId)}/hide`,
                { method: "PATCH", body: JSON.stringify({ hide }) }
            );
            const target = comments.value.find((c) => c.id === commentId);
            if (target) target.hidden = hide;
            return true;
        } catch (err) {
            commentsError.value = err instanceof Error ? err.message : "Failed to update comment visibility.";
            return false;
        }
    }

    async function likeObject(objectId: string) {
        if (!activePageId.value) return false;
        try {
            await apiFetch(`/pages/${encodeURIComponent(activePageId.value)}/like/${encodeURIComponent(objectId)}`, {
                method: "POST"
            });
            return true;
        } catch {
            return false;
        }
    }

    async function unlikeObject(objectId: string) {
        if (!activePageId.value) return false;
        try {
            await apiFetch(`/pages/${encodeURIComponent(activePageId.value)}/like/${encodeURIComponent(objectId)}`, {
                method: "DELETE"
            });
            return true;
        } catch {
            return false;
        }
    }

    /* ---------- Inbox ---------- */

    async function fetchInbox(opts: { reset?: boolean } = {}) {
        if (!activePageId.value) return;
        if (opts.reset) {
            conversations.value = [];
            inboxCursor.value = undefined;
        }
        inboxLoading.value = true;
        inboxError.value = "";
        try {
            const query = new URLSearchParams({ limit: "20" });
            if (inboxCursor.value) query.set("after", inboxCursor.value);
            const body = await apiFetch<any[]>(`/pages/${encodeURIComponent(activePageId.value)}/inbox?${query}`);
            const list = pickList(body).map(mapConversation);
            conversations.value = opts.reset ? list : [...conversations.value, ...list];
            inboxCursor.value = pickCursor(body);
            inboxHasMore.value = Boolean(inboxCursor.value);
        } catch (err) {
            inboxError.value = err instanceof Error ? err.message : "Failed to load inbox.";
        } finally {
            inboxLoading.value = false;
        }
    }

    async function openConversation(conversationId: string) {
        if (!activePageId.value) return;
        activeConversationId.value = conversationId;
        messages.value = [];
        messagesCursor.value = undefined;
        await fetchMessages({ reset: true });
        await markConversationRead(conversationId);
    }

    async function fetchMessages(opts: { reset?: boolean } = {}) {
        if (!activePageId.value || !activeConversationId.value) return;
        if (opts.reset) {
            messages.value = [];
            messagesCursor.value = undefined;
        }
        messagesLoading.value = true;
        messagesError.value = "";
        try {
            const query = new URLSearchParams({ limit: "30" });
            if (messagesCursor.value) query.set("before", messagesCursor.value);
            const body = await apiFetch<any[]>(
                `/pages/${encodeURIComponent(activePageId.value)}/inbox/${encodeURIComponent(activeConversationId.value)}?${query}`
            );
            const list = pickList(body).map(mapMessage);
            // Keep the thread chronological so the newest message appears at the bottom.
            messages.value = opts.reset ? sortMessages(list) : sortMessages([...list, ...messages.value]);
            messagesCursor.value = body.paging?.cursors?.before || undefined;
            messagesHasMore.value = Boolean(messagesCursor.value);
        } catch (err) {
            messagesError.value = err instanceof Error ? err.message : "Failed to load messages.";
        } finally {
            messagesLoading.value = false;
        }
    }

    async function replyConversation(message: string) {
        if (!activePageId.value || !activeConversationId.value) return false;
        try {
            await apiFetch(
                `/pages/${encodeURIComponent(activePageId.value)}/inbox/${encodeURIComponent(activeConversationId.value)}/reply`,
                { method: "POST", body: JSON.stringify({ message }) }
            );
            await fetchMessages({ reset: true });
            await fetchInbox({ reset: true });
            return true;
        } catch (err) {
            messagesError.value = err instanceof Error ? err.message : "Failed to send message.";
            return false;
        }
    }

    async function sendNewMessage(recipientId: string, message: string) {
        if (!activePageId.value) return false;
        try {
            await apiFetch(`/pages/${encodeURIComponent(activePageId.value)}/messages`, {
                method: "POST",
                body: JSON.stringify({ recipientId, message })
            });
            await fetchInbox({ reset: true });
            return true;
        } catch (err) {
            inboxError.value = err instanceof Error ? err.message : "Failed to send message.";
            return false;
        }
    }

    async function markConversationRead(conversationId: string) {
        if (!activePageId.value) return;
        try {
            await apiFetch(
                `/pages/${encodeURIComponent(activePageId.value)}/inbox/${encodeURIComponent(conversationId)}/read`,
                { method: "PATCH" }
            );
            const convo = conversations.value.find((c) => c.id === conversationId);
            if (convo) convo.unreadCount = 0;
        } catch {
            // non-fatal — leave unread state as-is
        }
    }

    /* ---------- Insights ---------- */

    async function fetchInsights(opts: { metrics: string[]; period?: InsightPeriod; since?: number; until?: number }) {
        if (!activePageId.value) return;
        insightsLoading.value = true;
        insightsError.value = "";
        try {
            const query = new URLSearchParams({ metrics: opts.metrics.join(",") });
            if (opts.period) query.set("period", opts.period);
            if (opts.since) query.set("since", String(opts.since));
            if (opts.until) query.set("until", String(opts.until));
            const body = await apiFetch<any[]>(`/pages/${encodeURIComponent(activePageId.value)}/insights?${query}`);
            insights.value = pickList(body).map(mapInsightMetric);
        } catch (err) {
            insightsError.value = err instanceof Error ? err.message : "Failed to load insights.";
            insights.value = [];
        } finally {
            insightsLoading.value = false;
        }
    }

    return {
        // pages
        pages,
        pagesLoading,
        pagesError,
        activePageId,
        activePage,
        fetchPages,
        connectPage,
        disconnectPage,
        refreshPage,
        setActivePage,
        // posts
        posts,
        postsLoading,
        postsError,
        postsHasMore,
        fetchPosts,
        createPost,
        deletePost,
        // comments
        comments,
        commentsLoading,
        commentsError,
        commentsHasMore,
        commentsObjectId,
        fetchComments,
        replyComment,
        deleteComment,
        setCommentHidden,
        likeObject,
        unlikeObject,
        // inbox
        conversations,
        inboxLoading,
        inboxError,
        inboxHasMore,
        fetchInbox,
        activeConversationId,
        messages,
        messagesLoading,
        messagesError,
        messagesHasMore,
        openConversation,
        fetchMessages,
        replyConversation,
        sendNewMessage,
        markConversationRead,
        // insights
        insights,
        insightsLoading,
        insightsError,
        fetchInsights
    };
});
