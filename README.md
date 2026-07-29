# Plataforma Escolar - EEEIEF "Professora Matilde Guerra Comério"

Esta é uma plataforma web moderna, rápida e responsiva construída a partir do banco de dados escolar contido na planilha `listMatriculaAluno (68).xls`. Ela permite visualizar de forma centralizada todos os dados dos 824 alunos matriculados, além de gerar gráficos demográficos, filtros inteligentes, busca em tempo real e visualização de fichas individuais prontas para impressão.

---

## 🚀 Como Executar a Plataforma

Para garantir a segurança, os navegadores modernos bloqueiam o carregamento de arquivos locais (CORS) quando você abre um arquivo `.html` diretamente com dois cliques. Por isso, a plataforma conta com um servidor local leve em Python integrado.

### Passo Único
Abra o prompt de comando (Terminal ou PowerShell) na pasta do projeto e execute:

```bash
python server.py
```

Isso irá:
1. Iniciar um servidor web local na porta `8000`.
2. Abrir o seu navegador padrão automaticamente no endereço **`http://localhost:8000`**.

*(Se o navegador não abrir automaticamente, basta abrir o seu navegador de preferência e acessar `http://localhost:8000`)*.

Para encerrar o servidor, basta fechar a janela do terminal ou pressionar `Ctrl + C`.

---

## 📁 Estrutura de Arquivos

*   `index.html`: Arquivo principal contendo a interface, estrutura do painel e modais.
*   `index.css`: Estilo visual premium com suporte a temas (Escuro e Claro), desfoques (glassmorphism) e design responsivo.
*   `index.js`: Lógica principal do sistema (filtros de pesquisa, contagem de dados, e criação de 8 tipos de gráficos interativos com Chart.js).
*   `server.py`: Servidor web local em Python para contornar problemas de CORS no navegador.
*   `data/students.json`: O banco de dados da escola, gerado e atualizado pelo script de conversão.
*   `scripts/convert_data.py`: Script Python ETL utilizado para converter a planilha Excel original em dados JSON limpos.

---

## 🔄 Como Atualizar os Dados dos Alunos

Se a coordenação ou a secretaria da escola alterar, adicionar ou remover alunos na planilha Excel original, você pode atualizar o banco de dados da plataforma com o seguinte passo a passo:

1. Substitua ou mantenha o arquivo Excel atualizado na pasta raiz com o nome exato: `listMatriculaAluno (68).xls` (ou certifique-se de que a planilha exportada possui a mesma estrutura).
2. Abra o terminal na pasta do projeto e execute o script de conversão:

```bash
python scripts/convert_data.py
```

O script irá reprocessar as linhas da planilha, limpar os dados, corrigir a codificação de caracteres e atualizar automaticamente o arquivo `data/students.json`. Da próxima vez que você carregar a plataforma, os novos dados já estarão disponíveis!

---

## 🔍 Comparação e Conciliação com o Censo Oficial

A plataforma possui uma funcionalidade avançada de cruzamento e auditoria que compara em tempo real os dados cadastrados na escola (`listMatriculaAluno (68).xls`) com a base oficial exportada do Censo Escolar (`RelacaoAlunoEscola_24_7_2026.xlsx`).

### O que é Comparado?
O script analisa cada estudante através de sua chave de ligação (CPF, fallback para Identificação CENSO ou Nome) e compara minuciosamente os seguintes campos:
*   **Nome do Aluno** (Detecta divergências de ortografia)
*   **CPF** (Compara CPFs declarados)
*   **Data de Nascimento**
*   **Sexo** (Normaliza F/M/Masculino/Feminino)
*   **Cor / Raça**
*   **Município-UF de Nascimento** (Naturalidade, normalizando abreviações de estados)
*   **Localização/Zona de residência** (Urbana / Rural)
*   **Atendimento Especializado AEE** (Se o aluno é elegível a AEE)
*   **Tipo de Deficiência / Transtorno**
*   **Recursos Necessários para Avaliações** (Ledor, transcritor, etc.)

### Como rodar a Comparação?
Sempre que você rodar o script de conversão:
```bash
python scripts/convert_data.py
```
Ele carregará as duas planilhas, efetuará o cruzamento inteligente de multimatrículas (evitando falsos positivos em alunos matriculados no AEE) e gerará dois arquivos na pasta `data/`:
*   `data/students.json`: O banco escolar padrão limpo.
*   `data/comparison.json`: O banco comparativo com a auditoria detalhada de cada aluno.

### Visualização na Plataforma
Ao abrir a plataforma (`http://localhost:8000`), clique no item **Comparação Censo** na barra lateral. Lá você encontrará:
*   **Painel de KPIs**: Total de alunos conciliados, alunos ausentes no censo oficial, alunos com divergências cadastrais críticas e cadastros 100% corretos.
*   **Listagem de Auditoria**: Filtre alunos com divergências, por nome, CPF ou status de conciliação.
*   **Modal de Comparação Lado a Lado**: Ao clicar em um aluno, é aberta uma tela comparativa mostrando campo a campo o valor na Escola vs o valor no Censo, destacando em vermelho as diferenças que necessitam de correção na secretaria ou no sistema do Censo.
*   **Exportação**: Você pode exportar o relatório comparativo geral contendo a lista de inconsistências de cada aluno para um arquivo CSV para auditoria física.

---

## 💡 Recursos da Plataforma

*   **Painel Geral (Dashboard)**: Estatísticas consolidadas por Nível de Ensino (Infantil vs Fundamental), contagem de alunos beneficiários do Bolsa Família, necessidades especiais (AEE) e gráficos interativos de séries, turnos, gênero e raça.
*   **Diretório de Alunos**: Pesquisa global instantânea enquanto digita (por Nome, Matrícula, CPF ou RA) combinada com múltiplos filtros paralelos.
*   **Exportação**: Botão para exportar a listagem atual filtrada diretamente para o formato CSV (compatível com Excel).
*   **Ficha Individual de 360 Graus**: Ao clicar em qualquer linha de aluno, abre-se um modal detalhado contendo 6 abas organizadas:
    1.  *Dados Pessoais*: Documentos, data de nascimento, idade atual, raça, etc.
    2.  *Vida Escolar*: Matrícula, RA, código censo, turno, turma e escola anterior.
    3.  *Contato e Endereço*: Endereço residencial detalhado e telefones de contato.
    4.  *Família & Responsáveis*: Dados completos de filiação e responsável legal.
    5.  *Saúde & Acessibilidade*: Cartão do SUS, restrições alimentares detalhadas, código de deficiência (CID/APAE) e recursos em sala.
    6.  *Outros Serviços*: Transporte escolar, termo de uso de imagem e PDI/PEI.
*   **Ficha de Impressão**: O modal possui um botão "Imprimir Ficha (PDF)". Ao ser clicado, a plataforma formata a ficha de forma limpa e profissional, ocultando menus e barras de navegação para que você possa imprimir em papel ou salvar como PDF para arquivamento físico.
