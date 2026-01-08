import axios from 'axios';
import { amoCRMAuthService } from './amocrm.auth.js';
import { getAmoCRMConfigSync } from './amocrm.config.js';
import { Lead, AmoCRMTask, AmoCRMConfig } from './amocrm.types.js';
import { logger } from '../../common/utils/logger.js';
import { getPrisma } from '../../config/database.js';

export class AmoCRMService {
    private amoCrmConfig: AmoCRMConfig | null = getAmoCRMConfigSync();

    /**
     * Re-initialize the service with new configuration
     */
    public reinitialize(newConfig: AmoCRMConfig | null) {
        this.amoCrmConfig = newConfig;
        logger.info('AmoCRMService re-initialized');
    }

    get isConfigured(): boolean {
        return this.amoCrmConfig !== null;
    }

    private async getHeaders() {
        const token = await amoCRMAuthService.getAccessToken();
        if (!token) throw new Error('No access token available for AmoCRM');
        return { Authorization: `Bearer ${token}` };
    }

    private get baseUrl() {
        if (!this.amoCrmConfig) return '';
        return `https://${this.amoCrmConfig.domain}/api/v4`;
    }

    /**
     * Create a Lead in AmoCRM
     */
    async createLead(patientName: string, phone: string, metadata: any = {}): Promise<number | null> {
        if (!this.amoCrmConfig) {
            logger.warn('AmoCRM not configured, skipping createLead');
            return null;
        }
        try {
            const headers = await this.getHeaders();

            const response = await axios.post(`${this.baseUrl}/leads`, [
                {
                    name: `OSPAN: ${patientName}`,
                    price: 0,
                    _embedded: {
                        contacts: [
                            {
                                first_name: patientName,
                                custom_fields_values: [
                                    {
                                        field_code: 'PHONE',
                                        values: [{ value: phone }]
                                    }
                                ]
                            }
                        ]
                    }
                }
            ], { headers });

            const leadId = response.data._embedded.leads[0].id;
            logger.info({ leadId }, 'AmoCRM Lead created');
            return leadId;

        } catch (error: any) {
            logger.error({ error: error.response?.data || error.message }, 'Failed to create AmoCRM Lead');
            return null;
        }
    }

    /**
     * Update Lead Status (move pipeline stage)
     */
    async updateLeadStatus(leadId: number, statusId: number, pipelineId?: number) {
        if (!this.amoCrmConfig) {
            logger.warn('AmoCRM not configured, skipping updateLeadStatus');
            return;
        }
        try {
            const headers = await this.getHeaders();
            const data: any = { id: leadId, status_id: statusId };
            if (pipelineId) data.pipeline_id = pipelineId;

            await axios.patch(`${this.baseUrl}/leads`, [data], { headers });
            logger.info({ leadId, statusId }, 'AmoCRM Lead status updated');
        } catch (error: any) {
            logger.error({ error: error.response?.data || error.message }, 'Failed to update AmoCRM Lead status');
        }
    }

    /**
     * Create Task in AmoCRM
     */
    async createTask(text: string, entityId: number | undefined, userId?: number): Promise<number | null> {
        if (!this.amoCrmConfig) {
            logger.warn('AmoCRM not configured, skipping createTask');
            return null;
        }
        if (!entityId) return null;
        try {
            const headers = await this.getHeaders();
            const body = [{
                text: text,
                entity_id: entityId,
                entity_type: 'leads',
                task_type_id: 1,
                complete_till: Math.floor(Date.now() / 1000) + 86400,
                responsible_user_id: userId
            }];

            const response = await axios.post(`${this.baseUrl}/tasks`, body, { headers });
            const taskId = response.data._embedded.tasks[0].id;
            return taskId;
        } catch (error: any) {
            logger.error({ error: error.response?.data || error.message }, 'Failed to create AmoCRM Task');
            return null;
        }
    }

    /**
     * Get Pipelines (to find IDs)
     */
    async getPipelines() {
        if (!this.amoCrmConfig) {
            logger.warn('AmoCRM not configured, skipping getPipelines');
            return [];
        }
        try {
            const headers = await this.getHeaders();
            const response = await axios.get(`${this.baseUrl}/leads/pipelines`, { headers });
            return response.data._embedded.pipelines;
        } catch (error: any) {
            logger.error('Failed to fetch pipelines');
            return [];
        }
    }

    /**
     * Sync Patient Data to AmoCRM (on update)
     */
    async syncPatient(patientId: string) {
        if (!this.amoCrmConfig) return;
        const prisma = await getPrisma();
        const patient = await prisma.patient.findUnique({ where: { id: patientId } });
        if (!patient || !patient.amoCrmLeadId) return;
    }
    async getAccountInfo(): Promise<any> {
        if (!this.amoCrmConfig) return null;
        try {
            // Note: Use amoCrmConfig.domain
            const url = `https://${this.amoCrmConfig.domain}.amocrm.ru/api/v4/account`;
            // Placeholder for now
            return {};
        } catch (error) {
            return null;
        }
    }

    // Removed duplicate getPipelines (it was already defined above)
}

export const amoCRMService = new AmoCRMService();
