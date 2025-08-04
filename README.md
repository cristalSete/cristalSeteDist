# 🚛 Sistema de Organização de Carga - Cristal Sete

Sistema web para organização e otimização de carregamento de produtos em caminhões, desenvolvido especificamente para a empresa Cristal Sete.

## ✨ Funcionalidades

### 📊 Análise de Carga
- **Upload de arquivo CSV**: Carregue dados de produtos diretamente via arquivo CSV
- **Processamento automático**: Análise e formatação automática dos dados de entrada
- **Relatório detalhado**: Visualização completa com estatísticas de produtos, clientes e alocação

### 📦 Organização Inteligente
- **Distribuição otimizada**: Algoritmo inteligente para distribuição de produtos nos compartimentos
- **Separação por tipo**: Distinção automática entre produtos normais e especiais
- **Controle de empilhamento**: Organização considerando regras de empilhamento e segurança

### 🔗 Compartilhamento (Nova Funcionalidade!)
- **Links compartilháveis**: Gere links únicos para compartilhar mapas de carga
- **Persistência no MongoDB**: Dados salvos com segurança no banco de dados
- **Acesso via ID**: Visualização de mapas compartilhados através de URLs únicas
- **Histórico**: Mantenha registro de todas as cargas organizadas

### 📱 Interface Responsiva
- **Design moderno**: Interface limpa e intuitiva
- **Visualização em cards**: Informações organizadas em cartões informativos
- **Responsivo**: Funciona perfeitamente em desktop, tablet e mobile

## 🚀 Como usar

### 1. Configuração inicial
```bash
# Clone o repositório
git clone [url-do-repo]

# Instale as dependências
npm install

# Configure o MongoDB (veja SETUP_MONGODB.md)
cp .env.example .env.local
# Edite .env.local com suas configurações de MongoDB
```

### 2. Executar o projeto
```bash
npm run dev
```

### 3. Utilizar o sistema
1. **Acesse** http://localhost:3000
2. **Carregue** um arquivo CSV com os dados dos produtos
3. **Visualize** o relatório gerado automaticamente
4. **Compartilhe** o mapa usando o botão "Compartilhar Mapa"
5. **Copie** o link gerado para compartilhar com outros usuários

## 📁 Estrutura de Dados CSV

O arquivo CSV deve conter as seguintes colunas:
- `cliente`: Nome do cliente
- `pedido`: Número do pedido
- `produto`: Descrição do produto
- `quantidade`: Quantidade de itens
- `peso`: Peso total
- `cidade_uf`: Cidade e UF de destino
- `dimensoes`: Dimensões do produto (formato: LarguraxAltura)

### Exemplo:
```csv
cliente,pedido,produto,quantidade,peso,cidade_uf,dimensoes
João Silva,001,Vidro Temperado,5,50.5,São Paulo/SP,120x200
Maria Santos,002,Espelho,3,30.2,Rio de Janeiro/RJ,80x150
```

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: TailwindCSS, Shadcn/ui
- **Backend**: Next.js API Routes
- **Banco de Dados**: MongoDB com Mongoose
- **Icons**: Lucide React
- **Utilitários**: clsx, tailwind-merge

## 📋 Funcionalidades Detalhadas

### Compartilhamento de Mapas
Quando você clica em "Compartilhar Mapa":

1. **Salvamento**: O resumo completo é salvo no MongoDB
2. **ID único**: Um ID único é gerado para o mapa
3. **Link gerado**: URL no formato `/compartilhado/[id]`
4. **Acesso**: Qualquer pessoa com o link pode visualizar o mapa

### Visualização Compartilhada
Ao acessar um link compartilhado, você verá:
- ✅ Todas as estatísticas do carregamento
- ✅ Organização completa dos compartimentos
- ✅ Informações sobre montes não alocados
- ✅ Data e hora do compartilhamento
- ✅ Nome do arquivo original (se disponível)

## ⚙️ Configuração do Ambiente

### Variáveis de Ambiente (.env.local)
```env
# MongoDB - String de conexão
MONGODB_URI=mongodb://localhost:27017/cristal-sete
# ou para MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/cristal-sete

# URL base da aplicação
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Configuração do MongoDB
Consulte o arquivo `SETUP_MONGODB.md` para instruções detalhadas de configuração do MongoDB.

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Add nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é desenvolvido para uso interno da Cristal Sete.

---

**Desenvolvido com ❤️ para otimizar o carregamento de caminhões da Cristal Sete**
