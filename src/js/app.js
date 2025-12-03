const DataService = require('./data.js');
const UIService = require('./ui.js');

let state = {
    products: [],
    config: { stores: [] },
    currentStoreId: 'matriz'
};

async function init() {
    state.config = await DataService.getConfig();

    const savedStore = localStorage.getItem('lastStoreId');
    if (savedStore && state.config.stores.find(s => s.id === savedStore)) {
        state.currentStoreId = savedStore;
    }

    UIService.renderStoreSelector(state.config.stores, state.currentStoreId);
    await loadStoreData();
    setupEventListeners();
}

async function loadStoreData() {
    state.products = await DataService.getProducts(state.currentStoreId);
    refreshMainList();
}

function refreshMainList(searchTerm = '') {
    const activeProducts = state.products.filter(p => !p.isDeleted);
    const filtered = filterProducts(activeProducts, searchTerm);
    UIService.renderProductList(filtered, 'products');
}

function refreshTrashList(searchTerm = '') {
    const deletedProducts = state.products.filter(p => p.isDeleted);
    const filtered = filterProducts(deletedProducts, searchTerm);
    UIService.renderProductList(filtered, 'trash-products', true);
}

function filterProducts(products, term) {
    if (!term) return products;
    const lowerTerm = term.toLowerCase();
    return products.filter(p =>
        (p.nome && p.nome.toLowerCase().includes(lowerTerm)) ||
        (p.codigo && p.codigo.toLowerCase().includes(lowerTerm))
    );
}

function setupEventListeners() {
    document.getElementById('store-select').addEventListener('change', async (e) => {
        state.currentStoreId = e.target.value;
        localStorage.setItem('lastStoreId', state.currentStoreId);
        await loadStoreData();
    });

    document.getElementById('search').addEventListener('input', (e) => {
        refreshMainList(e.target.value);
    });

    document.getElementById('add-product-btn').addEventListener('click', addNewProduct);
    document.getElementById('save-all-btn').addEventListener('click', saveAllChanges);
    document.getElementById('generate-btn').addEventListener('click', generateLabels);

    document.getElementById('select-all').addEventListener('change', (e) => {
        document.querySelectorAll('.select-product:not(:disabled)').forEach(cb => cb.checked = e.target.checked);
    });

    document.getElementById('apply-global-quantity-btn').addEventListener('click', () => {
        const qty = document.getElementById('global-quantity').value;
        document.querySelectorAll('.product-item:not(.inactive) .quantity-input').forEach(input => input.value = qty);
    });

    document.getElementById('products').addEventListener('click', handleProductAction);

    document.getElementById('trash-btn').addEventListener('click', () => {
        refreshTrashList();
        UIService.toggleModal('trash-modal', true);
    });
    document.getElementById('close-trash-btn').addEventListener('click', () => UIService.toggleModal('trash-modal', false));
    document.getElementById('search-trash').addEventListener('input', (e) => refreshTrashList(e.target.value));
    document.getElementById('trash-products').addEventListener('click', handleTrashAction);

    document.getElementById('settings-btn').addEventListener('click', () => {
        UIService.renderSettingsList(state.config.stores);
        UIService.toggleModal('settings-modal', true);
    });
    document.getElementById('close-settings-btn').addEventListener('click', () => UIService.toggleModal('settings-modal', false));
    document.getElementById('add-store-btn').addEventListener('click', handleAddStore);
    document.getElementById('settings-list').addEventListener('click', handleSettingsAction);
}

function addNewProduct() {
    const newProduct = {
        codigo: "0000", nome: "", medida: "", preco: 0,
        isNew: true, isInactive: false, isDeleted: false, historicoPrecos: []
    };
    state.products.unshift(newProduct);
    refreshMainList(document.getElementById('search').value);
    DataService.saveProducts(state.currentStoreId, state.products);
}

async function saveAllChanges() {
    const productDivs = document.querySelectorAll('.product-item');
    const domMap = new Map();

    const currentCodes = new Set();
    let hasDuplicate = false;

    productDivs.forEach(div => {
        const originalCode = div.dataset.codigo;
        const newCode = div.querySelector('.product-id-input').value.trim();

        if (currentCodes.has(newCode) && newCode !== "") hasDuplicate = true;
        currentCodes.add(newCode);

        domMap.set(originalCode, {
            codigo: newCode,
            nome: div.querySelector('.product-name-input').value,
            medida: div.querySelector('.product-measure-input').value,
            preco: parseFloat(div.querySelector('.product-price-input').value) || 0,
            isNew: div.querySelector('.is-new-checkbox').checked
        });
    });

    if (hasDuplicate) {
        return UIService.showAlert('Erro', 'Existem códigos duplicados na lista. Corrija antes de salvar.', 'error');
    }

    state.products = state.products.map(p => {
        if (p.isDeleted) return p;
        const changes = domMap.get(p.codigo);
        if (changes) {
            if (p.preco !== changes.preco) {
                p.historicoPrecos.push({ preco: p.preco, data: new Date().toISOString() });
            }
            return { ...p, ...changes };
        }
        return p;
    });

    try {
        await DataService.saveProducts(state.currentStoreId, state.products);
        UIService.showAlert('Sucesso', 'Alterações salvas e backup criado!', 'success');
        refreshMainList();
    } catch (error) {
        UIService.showAlert('Erro ao salvar', error.message, 'error');
    }
}

async function handleProductAction(e) {
    const btn = e.target;
    const div = btn.closest('.product-item');
    if (!div) return;
    const codigo = div.dataset.codigo;
    const product = state.products.find(p => p.codigo === codigo);

    if (btn.classList.contains('toggle-active-btn')) {
        product.isInactive = !product.isInactive;
        await DataService.saveProducts(state.currentStoreId, state.products);
        refreshMainList(document.getElementById('search').value);
    } else if (btn.classList.contains('delete-btn')) {
        const result = await UIService.confirmAction('Excluir produto?', 'Ele irá para a lixeira.');
        if (result.isConfirmed) {
            product.isDeleted = true;
            await DataService.saveProducts(state.currentStoreId, state.products);
            refreshMainList(document.getElementById('search').value);
            UIService.showAlert('Excluído', 'Produto movido para a lixeira', 'success');
        }
    }
}

async function handleTrashAction(e) {
    if (e.target.classList.contains('restore-btn')) {
        const codigo = e.target.dataset.id;
        const product = state.products.find(p => p.codigo === codigo);
        if (product) {
            product.isDeleted = false;
            await DataService.saveProducts(state.currentStoreId, state.products);
            refreshTrashList(document.getElementById('search-trash').value);
            refreshMainList(document.getElementById('search').value);
            UIService.showAlert('Restaurado', 'Produto voltou para a lista ativa', 'success');
        }
    }
}

async function generateLabels() {
    const itemsToPrint = [];
    const productDivs = document.querySelectorAll('.product-item');

    productDivs.forEach(div => {
        if (div.querySelector('.select-product').checked) {
            const codigo = div.dataset.codigo;
            const productData = {
                codigo: codigo,
                nome: div.querySelector('.product-name-input').value,
                medida: div.querySelector('.product-measure-input').value,
                preco: parseFloat(div.querySelector('.product-price-input').value) || 0,
                isNew: div.querySelector('.is-new-checkbox').checked
            };
            const qty = parseInt(div.querySelector('.quantity-input').value) || 1;
            for (let i = 0; i < qty; i++) itemsToPrint.push(productData);
        }
    });

    if (itemsToPrint.length === 0) return UIService.showAlert('Atenção', 'Selecione produtos para imprimir.', 'warning');

    await DataService.generateLabels(itemsToPrint);
}

// Lógica de Configurações
async function handleAddStore() {
    const idInput = document.getElementById('new-store-id');
    const nameInput = document.getElementById('new-store-name');
    const id = idInput.value.trim();
    const name = nameInput.value.trim();

    if (!id || !name) return UIService.showAlert('Erro', 'Preencha ID e Nome', 'error');
    if (state.config.stores.find(s => s.id === id)) return UIService.showAlert('Erro', 'ID já existe', 'error');

    state.config.stores.push({ id, name });
    await DataService.saveConfig(state.config);

    UIService.renderSettingsList(state.config.stores);
    UIService.renderStoreSelector(state.config.stores, state.currentStoreId);

    idInput.value = '';
    nameInput.value = '';
}

async function handleSettingsAction(e) {
    if (e.target.classList.contains('remove-store-btn')) {
        const id = e.target.dataset.id;
        if (id === state.currentStoreId) return UIService.showAlert('Erro', 'Não é possível remover a loja ativa', 'error');

        const result = await UIService.confirmAction('Remover Loja?', 'Isso não apaga o arquivo de dados, apenas remove da lista.');
        if (result.isConfirmed) {
            state.config.stores = state.config.stores.filter(s => s.id !== id);
            await DataService.saveConfig(state.config);
            UIService.renderSettingsList(state.config.stores);
            UIService.renderStoreSelector(state.config.stores, state.currentStoreId);
        }
    }
}

// Iniciar
window.onload = init;