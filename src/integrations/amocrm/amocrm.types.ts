export interface AmoCRMConfig {
    domain: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
}

export interface AmoCRMTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: number; // Timestamp
}

export interface Lead {
    id: number;
    name: string;
    price: number;
    responsible_user_id: number;
    group_id: number;
    status_id: number;
    pipeline_id: number;
    loss_reason_id: number;
    created_by: number;
    updated_by: number;
    created_at: number;
    updated_at: number;
    closed_at: number;
    closest_task_at: number;
    is_deleted: boolean;
    custom_fields_values: any[] | null;
    score: number | null;
    account_id: number;
    _embedded: {
        tags: any[];
        company: any;
    };
}

export interface Contact {
    id: number;
    name: string;
    first_name: string;
    last_name: string;
    responsible_user_id: number;
    group_id: number;
    created_by: number;
    updated_by: number;
    created_at: number;
    updated_at: number;
    is_deleted: boolean;
    custom_fields_values: any[] | null;
    account_id: number;
}

export interface Pipeline {
    id: number;
    name: string;
    sort: number;
    is_main: boolean;
    is_unsorted_on: boolean;
    is_archive: boolean;
    account_id: number;
    _embedded: {
        statuses: Status[];
    };
}

export interface Status {
    id: number;
    name: string;
    sort: number;
    is_editable: boolean;
    pipeline_id: number;
    color: string;
    type: number;
    account_id: number;
}

export interface AmoCRMTask {
    id: number;
    created_by: number;
    updated_by: number;
    created_at: number;
    updated_at: number;
    responsible_user_id: number;
    group_id: number;
    entity_id: number;
    entity_type: string; // leads, contacts, companies, customers
    duration: number; // timestamp
    is_completed: boolean;
    task_type_id: number;
    text: string;
    result: any;
    complete_till: number; // timestamp
    account_id: number;
}
