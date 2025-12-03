const Swal = require('sweetalert2');

const UIService = {
    renderStoreSelector(stores, activeStoreId) {
        const selector = document.getElementById('store-select');
        selector.innerHTML = '';
        stores.forEach(store => {
            const option = document.createElement('option');
            option.value = store.id;
            option.textContent = store.name;
            if (store.id === activeStoreId) option.selected = true;
            selector.appendChild(option);
        });
    },

    renderProductList(products, containerId, isTrashMode = false) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        if (products.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum produto encontrado.</div>';
            return;
        }

        const sortedProducts = isTrashMode ? products : [...products].sort((a, b) => a.isInactive - b.isInactive);

        sortedProducts.forEach(product => {
            const div = document.createElement('div');
            div.classList.add('product-item');
            if (product.isInactive && !isTrashMode) div.classList.add('inactive');
            div.dataset.codigo = product.codigo;

            if (isTrashMode) {
                div.innerHTML = `
                    <div class="product-info-trash">
                        <strong>${product.codigo}</strong> - ${product.nome}
                    </div>
                    <div class="product-actions-trash">
                        <button class="btn btn-success restore-btn" data-id="${product.codigo}">Restaurar</button>
                    </div>
                `;
            } else {
                div.innerHTML = `
                    <div class="product-header">
                        <div>
                            <input type="checkbox" class="select-product" ${product.isInactive ? 'disabled' : ''}>
                            <label>Selecionar</label>
                        </div>
                        <div>
                            <input type="checkbox" class="is-new-checkbox" ${product.isNew ? 'checked' : ''}>
                            <label>Novo?</label>
                        </div>
                    </div>
                    <label>ID:</label>
                    <input type="text" class="product-id-input" value="${product.codigo || ''}">
                    <label>Nome:</label>
                    <input type="text" class="product-name-input" value="${product.nome || ''}">
                    <label>Medida:</label>
                    <input type="text" class="product-measure-input" value="${product.medida || ''}">
                    <label>Preço:</label>
                    <input type="number" step="0.01" class="product-price-input" value="${product.preco ? product.preco.toFixed(2) : '0.00'}">
                    <label>Qtd:</label>
                    <input type="number" value="1" min="1" class="quantity-input">
                    <div class="product-actions">
                        <button class="btn toggle-active-btn">${product.isInactive ? 'Ativar' : 'Inativar'}</button>
                        <button class="btn delete-btn">Excluir</button>
                    </div>
                `;
            }
            container.appendChild(div);
        });
    },

    renderSettingsList(stores) {
        const container = document.getElementById('settings-list');
        container.innerHTML = '';
        stores.forEach((store, index) => {
            const div = document.createElement('div');
            div.classList.add('settings-item');
            div.innerHTML = `
                <span>${store.name} <small>(${store.id})</small></span>
                ${index > 0 ? `<button class="btn btn-danger btn-sm remove-store-btn" data-id="${store.id}">Remover</button>` : ''}
            `;
            container.appendChild(div);
        });
    },

    toggleModal(modalId, show) {
        const modal = document.getElementById(modalId);
        modal.style.display = show ? 'flex' : 'none';
    },

    showAlert(title, text, icon) {
        Swal.fire(title, text, icon);
    },

    async confirmAction(title, text, confirmBtnText = 'Sim') {
        return Swal.fire({
            title: title,
            text: text,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: confirmBtnText,
            cancelButtonText: 'Cancelar'
        });
    }
};

module.exports = UIService;