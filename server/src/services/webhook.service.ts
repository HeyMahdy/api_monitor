import axios, { AxiosError } from 'axios';
import type { Incident } from '../schema/incident.js';
import type { Monitor } from '../schema/monitor.js';
import type { HealthCheckResult } from '../schema/monitor.js';

/**
 * Webhook payload structure
 */
interface WebhookPayload {
    event: 'incident.created' | 'incident.acknowledged' | 'incident.resolved' | 'monitor.down' | 'monitor.up';
    timestamp: string;
    incident?: {
        id: number;
        monitor_id: string;
        status: string;
        severity: string;
        started_at: Date;
        failure_count: number;
        error_message?: string | null | undefined;
    };
    monitor?: {
        id: string;
        name: string;
        url: string;
        status: string;
    };
    health_check?: {
        status: boolean;
        response_time_ms: number;
        status_code?: number | null | undefined;
        error_type?: string | null | undefined;
        error_message?: string | null | undefined;
    };
}

/**
 * Webhook delivery options
 */
interface WebhookOptions {
    timeout?: number;
    retries?: number;
    headers?: Record<string, string>;
}

/**
 * Send webhook notification to a URL
 */
export const sendWebhook = async (
    webhookUrl: string,
    payload: WebhookPayload,
    options: WebhookOptions = {}
): Promise<boolean> => {
    const {
        timeout = 10000,
        retries = 3,
        headers = {}
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await axios.post(webhookUrl, payload, {
                timeout,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'API-Monitor-Webhook/1.0',
                    ...headers,
                },
                validateStatus: (status) => status >= 200 && status < 300,
            });

            return true;
        } catch (error) {
            lastError = error as Error;
            
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                
                // Don't retry on client errors (4xx)
                if (axiosError.response && axiosError.response.status >= 400 && axiosError.response.status < 500) {
                    console.error(`Webhook delivery failed (client error): ${axiosError.response.status}`, {
                        url: webhookUrl,
                        status: axiosError.response.status,
                    });
                    return false;
                }
            }

            // Retry on network errors and server errors (5xx)
            if (attempt < retries) {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    console.error('Webhook delivery failed after retries:', {
        url: webhookUrl,
        error: lastError?.message,
    });
    return false;
};

/**
 * Notify webhook about incident creation
 */
export const notifyIncidentCreated = async (
    webhookUrl: string,
    incident: Incident,
    monitor: Monitor
): Promise<boolean> => {
    const payload: WebhookPayload = {
        event: 'incident.created',
        timestamp: new Date().toISOString(),
        incident: {
            id: incident.id,
            monitor_id: incident.monitor_id,
            status: incident.status,
            severity: incident.severity,
            started_at: incident.started_at,
            failure_count: incident.failure_count,
            error_message: incident.error_message,
        },
        monitor: {
            id: monitor.id,
            name: monitor.name,
            url: monitor.url,
            status: monitor.status,
        },
    };

    return await sendWebhook(webhookUrl, payload);
};

/**
 * Notify webhook about incident acknowledgment
 */
export const notifyIncidentAcknowledged = async (
    webhookUrl: string,
    incident: Incident,
    monitor: Monitor
): Promise<boolean> => {
    const payload: WebhookPayload = {
        event: 'incident.acknowledged',
        timestamp: new Date().toISOString(),
        incident: {
            id: incident.id,
            monitor_id: incident.monitor_id,
            status: incident.status,
            severity: incident.severity,
            started_at: incident.started_at,
            failure_count: incident.failure_count,
            error_message: incident.error_message,
        },
        monitor: {
            id: monitor.id,
            name: monitor.name,
            url: monitor.url,
            status: monitor.status,
        },
    };

    return await sendWebhook(webhookUrl, payload);
};

/**
 * Notify webhook about incident resolution
 */
export const notifyIncidentResolved = async (
    webhookUrl: string,
    incident: Incident,
    monitor: Monitor
): Promise<boolean> => {
    const payload: WebhookPayload = {
        event: 'incident.resolved',
        timestamp: new Date().toISOString(),
        incident: {
            id: incident.id,
            monitor_id: incident.monitor_id,
            status: incident.status,
            severity: incident.severity,
            started_at: incident.started_at,
            failure_count: incident.failure_count,
            error_message: incident.error_message,
        },
        monitor: {
            id: monitor.id,
            name: monitor.name,
            url: monitor.url,
            status: monitor.status,
        },
    };

    return await sendWebhook(webhookUrl, payload);
};

/**
 * Notify webhook when monitor goes down
 */
export const notifyMonitorDown = async (
    webhookUrl: string,
    monitor: Monitor,
    healthCheck: HealthCheckResult
): Promise<boolean> => {
    const payload: WebhookPayload = {
        event: 'monitor.down',
        timestamp: new Date().toISOString(),
        monitor: {
            id: monitor.id,
            name: monitor.name,
            url: monitor.url,
            status: monitor.status,
        },
        health_check: {
            status: healthCheck.status,
            response_time_ms: healthCheck.response_time_ms,
            status_code: healthCheck.status_code,
            error_type: healthCheck.error_type,
            error_message: healthCheck.error_message,
        },
    };

    return await sendWebhook(webhookUrl, payload);
};

/**
 * Notify webhook when monitor comes back up
 */
export const notifyMonitorUp = async (
    webhookUrl: string,
    monitor: Monitor,
    healthCheck: HealthCheckResult
): Promise<boolean> => {
    const payload: WebhookPayload = {
        event: 'monitor.up',
        timestamp: new Date().toISOString(),
        monitor: {
            id: monitor.id,
            name: monitor.name,
            url: monitor.url,
            status: monitor.status,
        },
        health_check: {
            status: healthCheck.status,
            response_time_ms: healthCheck.response_time_ms,
            status_code: healthCheck.status_code,
            error_type: healthCheck.error_type,
            error_message: healthCheck.error_message,
        },
    };

    return await sendWebhook(webhookUrl, payload);
};

/**
 * Test webhook URL by sending a test notification
 */
export const testWebhook = async (webhookUrl: string): Promise<boolean> => {
    const payload: WebhookPayload = {
        event: 'monitor.up',
        timestamp: new Date().toISOString(),
        monitor: {
            id: 'test-monitor-id',
            name: 'Test Monitor',
            url: webhookUrl,
            status: 'UP',
        },
        health_check: {
            status: true,
            response_time_ms: 150,
            status_code: 200,
        },
    };

    return await sendWebhook(webhookUrl, payload, { retries: 1 });
};
