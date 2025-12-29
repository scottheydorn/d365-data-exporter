# D365 Data Exporter

A secure, browser-based tool for exporting D365 F&O data entities to GitHub repositories.

![Version](https://img.shields.io/badge/version-1.0.0-E21836)
![React](https://img.shields.io/badge/React-18.2-61dafb)
![Security](https://img.shields.io/badge/Checkmarx-Compliant-green)

## 🌟 Features

- **🔐 Secure Authentication** - Azure AD / MSAL.js for D365, PAT for GitHub
- **📋 Entity Browser** - Filter and search data entities
- **📊 Record Counts** - See record counts before exporting
- **📤 Flexible Export** - JSON or CSV format
- **📁 GitHub Integration** - Auto-save exports to your repository
- **🎨 New Balance Branding** - Clean, professional UI

## 🚀 Quick Start

### 1. Deploy to GitHub Pages

```bash
# Clone this repository
git clone https://github.com/yourusername/d365-data-exporter.git
cd d365-data-exporter

# Install dependencies
npm install

# Build and deploy
npm run build
```

Or upload the files to a new GitHub repository and enable GitHub Pages.

### 2. Configure Azure AD App

1. Go to [Azure Portal](https://portal.azure.com) → Azure Active Directory
2. App Registrations → New Registration
3. Configure:
   - **Name**: D365 Data Exporter
   - **Supported account types**: Single tenant
   - **Redirect URI**: `https://yourusername.github.io/d365-data-exporter/` (SPA type)
4. API Permissions → Add:
   - Dynamics ERP → user_impersonation
5. Authentication:
   - Enable "Access tokens" and "ID tokens"
   - Add your GitHub Pages URL as SPA redirect URI

### 3. Create GitHub Personal Access Token

1. Go to GitHub → Settings → Developer Settings
2. Personal Access Tokens → Fine-grained tokens
3. Generate new token with:
   - **Repository access**: Select your target repository
   - **Permissions**: Contents (Read and Write)

### 4. Use the Application

1. Open the deployed app in your browser
2. Enter D365 credentials (URL, Client ID, Tenant ID)
3. Click "Connect to D365" and authenticate
4. Enter GitHub token and select repository
5. Add entities (manually or from presets)
6. Click "Get Counts" to see record counts
7. Select entities and click "Export"

## 📁 Project Structure

```
d365-data-exporter/
├── .github/workflows/
│   └── deploy.yml          # GitHub Pages deployment
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── D365ConnectionPanel.jsx
│   │   ├── GitHubConnectionPanel.jsx
│   │   ├── EntityListPanel.jsx
│   │   ├── EntityPresets.jsx
│   │   └── ExportPanel.jsx
│   ├── context/
│   │   └── AppContext.jsx
│   ├── utils/
│   │   ├── msalConfig.js   # Azure AD configuration
│   │   ├── d365Api.js      # D365 OData utilities
│   │   └── githubApi.js    # GitHub API utilities
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css           # New Balance styling
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🔒 Security Features

| Security Control | Implementation |
|-----------------|----------------|
| **Authentication** | MSAL.js for Azure AD OAuth 2.0 |
| **Token Storage** | Session storage only (not localStorage) |
| **URL Validation** | Hardcoded D365/GitHub domain allowlists |
| **Input Validation** | All user inputs sanitized |
| **No Credentials** | No secrets stored in code |
| **CSP Headers** | Content Security Policy enforced |
| **CxSAST Comments** | Checkmarx suppression documented |

### Trusted Domains (Hardcoded)

**D365:**
- `*.operations.dynamics.com`
- `*.sandbox.operations.dynamics.com`
- `*.cloudax.dynamics.com`

**Azure AD:**
- `login.microsoftonline.com`
- `login.windows.net`

**GitHub:**
- `api.github.com`

## 🎨 New Balance Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| NB Red | `#E21836` | Primary actions, accents |
| NB Black | `#231f20` | Text, headers |
| NB Teal | `#207c88` | Secondary actions |
| NB Opal | `#aac1bf` | Borders, subtle backgrounds |
| NB Cream | `#e8e9d7` | Page background |
| NB Gray | `#4c4d4f` | Secondary text |

## 📋 Common Entities

The app includes presets for common D365 F&O entities:

- **Financials**: MainAccounts, LedgerJournalHeaders, etc.
- **Customers & AR**: CustomersV3, SalesOrderHeaders, etc.
- **Vendors & AP**: VendorsV2, PurchaseOrderHeaders, etc.
- **Inventory**: ReleasedProducts, InventTable, etc.
- **Production**: ProductionOrders, BOMs, Routes
- **HR & Payroll**: Employees, Workers, Positions
- **System**: SystemParameters, Companies, Users

## 🛠 Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## ⚠️ Rate Limits

- **D365 OData**: ~6,000 requests per 5 minutes per user
- **GitHub API**: 5,000 requests per hour with PAT
- **Pagination**: D365 returns max 10,000 records per request

## 📄 License

MIT License - see LICENSE file for details.

---

Built for New Balance D365 Team
