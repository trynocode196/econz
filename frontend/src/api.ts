import api from './services/api';

export interface CrmStageDto {
  _id: string;
  name: string;
  color: string;
  order: number;
  kind?: 'open' | 'won' | 'lost';
}

// Deals
export const getCrmDeals = (params?: any) => api.get('/crm/deals', { params });
export const getCrmDeal = (id: string) => api.get(`/crm/deals/${id}`);
export const getCrmDealOwners = () => api.get('/crm/deal-owners');
export const createCrmDeal = (data: any) => api.post('/crm/deals', data);
export const updateCrmDeal = (id: string, data: any) => api.put(`/crm/deals/${id}`, data);
export const deleteCrmDeal = (id: string) => api.delete(`/crm/deals/${id}`);
export const changeDealStage = (id: string, stage: string) => api.patch(`/crm/deals/${id}/stage`, { stage });
export const markDealWon = (id: string) => api.patch(`/crm/deals/${id}/won`);
export const markDealLost = (id: string, lostReason?: string) => api.patch(`/crm/deals/${id}/lost`, { lostReason });

// Stages
export const getCrmStages = () => api.get('/crm/stages');
export const createCrmStage = (data: any) => api.post('/crm/stages', data);
export const updateCrmStage = (id: string, data: any) => api.put(`/crm/stages/${id}`, data);
export const reorderCrmStages = (stages: any[]) => api.put('/crm/stages/reorder', { stages });
export const deleteCrmStage = (id: string) => api.delete(`/crm/stages/${id}`);

// Activities
export const getDealActivities = (dealId: string) => api.get(`/crm/deals/${dealId}/activities`);
export const createDealActivity = (dealId: string, data: any) => api.post(`/crm/deals/${dealId}/activities`, data);
export const updateDealActivity = (activityId: string, data: any) => api.put(`/crm/activities/${activityId}`, data);
export const deleteDealActivity = (activityId: string) => api.delete(`/crm/activities/${activityId}`);

export default api;
