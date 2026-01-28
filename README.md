# 🏷️ Gerador de Etiquetas - Brico Bread (v2.0)

> **Solução Desktop de Automação para Padronização de Embalagens**

![Status](https://img.shields.io/badge/Status-Em_Produção-success?style=for-the-badge)
![Electron](https://img.shields.io/badge/Electron-25.0+-blue?style=for-the-badge&logo=electron)
![Node](https://img.shields.io/badge/Node.js-18.0+-green?style=for-the-badge&logo=node.js)

Este projeto é uma aplicação desktop desenvolvida com **Electron** para automatizar a criação e impressão de etiquetas de preço e identificação de produtos da **Brico Bread**. O sistema elimina erros manuais de preenchimento, garante a padronização visual e agiliza o processo.

---

## 📸 Visão Geral

O sistema permite que o operador selecione os produtos de uma base de dados pré-cadastrada (Matriz/Filiais) e gere um layout pronto para impressão em impressoras.

### Principais Funcionalidades

* ✅ **Base de Dados JSON:** Carregamento dinâmico de produtos (Matriz e Morumbi) via arquivos JSON, facilitando a manutenção sem alterar o código-fonte.
* ✅ **Impressão Direta:** Layout CSS otimizado para quebras de página e tamanhos específicos de etiqueta.
* ✅ **Interface Intuitiva:** UI limpa e focada na eficiência operacional (poucos cliques).

---

## 🛠️ Tecnologias Utilizadas

* **Core:** [Electron](https://www.electronjs.org/) (Framework para Desktop Apps)
* **Linguagem:** JavaScript (ES6+), HTML5, CSS3
* **Armazenamento de Dados:** JSON (Flat File Database)
* **Estilização:** CSS customizado para mídia de impressão (`@media print`)

---

## 📂 Estrutura do Projeto

```bash
brico-bread-labels-generator-v2/
├── src/
│   ├── data/
│   │   ├── matriz.json       # Base de dados de produtos (Matriz)
│   │   └── morumbi.json      # Base de dados de produtos (Filial)
│   ├── js/
│   │   ├── app.js            # Lógica principal de geração
│   │   ├── data.js           # Manipulação dos JSONs
│   │   └── ui.js             # Controle de interface (DOM)
│   ├── css/                  # Estilos globais e de impressão
│   ├── fonts/                # Tipografias da marca (Gotham, Dancing Script)
│   ├── media/                # Assets gráficos (Logos, Backgrounds)
│   └── index.html            # View Principal
├── iniciar-programa.bat      # Script de inicialização rápida (Windows)
├── main.js                   # Entry point do Electron
└── package.json              # Dependências e Scripts
```

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos
* [Node.js](https://nodejs.org/) instalado.
* Gerenciador de pacotes npm ou yarn.

### Instalação

1.  Clone o repositório:
    ```bash
    git clone [https://github.com/incisi/brico-bread-labels-generator-v2.git](https://github.com/incisi/brico-bread-labels-generator-v2.git)
    ```
2.  Acesse a pasta do projeto:
    ```bash
    cd brico-bread-labels-generator-v2/src
    ```
3.  Instale as dependências:
    ```bash
    npm install
    ```

### Execução

* **Modo de Desenvolvimento:**
    ```bash
    npm start
    ```
* **Via Script (Windows):**
    Basta clicar duas vezes no arquivo `iniciar-programa.bat` na raiz do projeto.

---

## ⚙️ Configuração de Lojas

Para adicionar ou remover filiais, basta duplicar os arquivos localizados em `src/data/` e alterar o nome.

---

## 👤 Autor

**David Incisi**

* 💼 [LinkedIn](https://linkedin.com/in/incisi)
* 💻 [GitHub](https://github.com/incisi)
* 🌐 [Portfólio](https://incisi.dev.br)

---

Desenvolvido para otimizar a operação da **Brico Bread**.
