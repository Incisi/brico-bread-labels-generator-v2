const { ipcRenderer } = require('electron');

const DataService = {
    async getConfig() {
        return await ipcRenderer.invoke('load-config');
    },

    async saveConfig(config) {
        return await ipcRenderer.invoke('save-config', config);
    },

    async getProducts(storeId) {
        return await ipcRenderer.invoke('load-data', storeId);
    },

    async saveProducts(storeId, products) {
        return await ipcRenderer.invoke('save-data', { products, storeId });
    },

    async generateLabels(products) {
        return await ipcRenderer.invoke('generate-labels', products);
    }
};

module.exports = DataService;