import apiClient from "./api.service";

const base = (wid) => `/workspaces/${wid}/tasks`;

const taskService = {
  list: (wid) => apiClient.get(base(wid)),
  create: (wid, data) => apiClient.post(base(wid), data),
  update: (wid, tid, data) => apiClient.put(`${base(wid)}/${tid}`, data),
  patchStatus: (wid, tid, status) =>
    apiClient.patch(`${base(wid)}/${tid}/status`, { status }),
  remove: (wid, tid) => apiClient.delete(`${base(wid)}/${tid}`),
};

export default taskService;
