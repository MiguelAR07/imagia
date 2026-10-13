export type ProjectSummary = {
    id: number;
    name: string;
    client: { id: number; name: string } | null;
    status: string;
    priority: string;
    category: string | null;
    due_date: string | null;
    progress: number;
    progress_is_manual: boolean;
    overdue: boolean;
    archived: boolean;
};

export type ProjectDetail = ProjectSummary & {
    description: string | null;
    currency: string;
    progress_mode: 'tasks' | 'manual';
    manual_progress: number | null;
    observations: string | null;
    start_date: string | null;
    agreed_amount: string | null;
    completed_at: string | null;
};

export type TaskCard = {
    id: number;
    project_id: number;
    milestone_id: number | null;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    assignee: { id: number; name: string } | null;
    assignee_id: number | null;
    due_date: string | null;
    weight: number;
    overdue: boolean;
    comments_count: number | null;
    project?: { id: number; name: string } | null;
};

export type TaskDetail = TaskCard & {
    comments: {
        id: number;
        body: string;
        user: { id: number; name: string } | null;
        created_at: string | null;
    }[];
};

export type MilestoneItem = {
    id: number;
    name: string;
    due_date: string | null;
    completed_at: string | null;
    tasks_total: number;
    tasks_done: number;
};

export type DeliverableItem = {
    id: number;
    name: string;
    description: string | null;
    status: string;
    is_visible_to_client: boolean;
    due_date: string | null;
    delivered_at: string | null;
};

export type FileItem = {
    id: number;
    name: string;
    size: number;
    mime_type: string | null;
    uploaded_by: string | null;
    created_at: string | null;
};
