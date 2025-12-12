import apiClient from './client';

export const fakerDocsApi = {
  getAvailableMethods: () => apiClient.get('/faker-docs/methods'),
  renderTemplate: (template: any) => apiClient.post('/faker-docs/render', template),
};

