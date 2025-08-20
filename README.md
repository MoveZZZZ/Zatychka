# 💳 Zatychka – Payment & Wallet Management Platform (only ADMIN)

Zatychka is a **secure payment and wallet management platform** built with **ASP.NET Core (C#)** and **React (JavaScript)**.  
It provides a **robust backend API** for handling authentication, wallet operations, transactions, deposits, dispute management, and integrations with third-party systems (including **Telegram links**).  

The project was designed with **scalability and security** in mind, leveraging **Entity Framework Core** with migrations, **JWT authentication**, and a modular architecture.

---

## 🎯 Project Goals

- Build a **secure, production-ready payment service**  
- Provide APIs for **wallets, deposits, and transactions**  
- Support **role-based access control** (user/admin separation)  
- Enable integration with **Telegram links** and external systems  
- Ensure **auditability, dispute handling, and statistics tracking**  

---

## ✨ Features

### 🔐 Security & Authentication
- JWT-based authentication & authorization  
- Role-based access (Admin, User)  
- DTO-driven request/response validation  
- Secure session and token verification  

### 👤 Account Management
- User registration & login  
- Device registration and management  
- Balance history tracking  
- Account settings update  

### 💰 Financial Operations
- Wallet creation, lookup, and updates  
- Deposit management (PayIn)  
- Exact-sum transaction generation  
- PayIn transaction history & lookups  
- Dispute management for transactions  

### 📊 Statistics & Monitoring
- Private and public statistics APIs  
- Real-time wallet balance monitoring  
- Historical transaction data  
- Audit logging for key financial events  

### 📡 Integrations
- Telegram link generation and management  
- Public and private API endpoints  
- Configurable rates and requisites  

---

## 📂 Project Structure

```
Zatychka-master/
│── Zatychka.sln                     # Solution
│── package.json / package-lock.json # Frontend dependencies
│
├── Zatychka.Server/                 # Backend (ASP.NET Core)
│   ├── Program.cs                   # Entrypoint
│   ├── appsettings.json             # Configuration
│   ├── Controllers/                 # API endpoints
│   │   ├── AuthController.cs        # Authentication & JWT
│   │   ├── AccountController.cs     # User accounts
│   │   ├── WalletController.cs      # Wallet operations
│   │   ├── PayinTransactionsController.cs # Deposits & transactions
│   │   ├── BalanceHistoryController.cs    # Balance history
│   │   ├── DisputesController.cs    # Dispute management
│   │   ├── TelegramLinksController.cs # Telegram integrations
│   │   ├── Statistics controllers   # Private & public stats
│   │   └── ... (other APIs)
│   ├── DTOs/                        # Data Transfer Objects
│   ├── Data/AppDbContext.cs         # EF Core context
│   ├── Migrations/                  # Database migrations
│   └── Zatychka.Server.csproj
│
└── README.md
```

---

## 🏗️ Architecture

Zatychka follows a **modular layered architecture**:

1. **Frontend (React)**  
   - SPA client for interacting with APIs  
   - Handles UI, state management, and visualization  

2. **Backend (ASP.NET Core)**  
   - REST APIs for authentication, wallets, transactions  
   - DTOs for strict input/output contracts  
   - EF Core for persistence and migrations  

3. **Database (SQL)**  
   - Stores users, wallets, deposits, transactions, disputes  
   - Migration-driven schema evolution  
   - Audit logs for compliance  

---

## ⚙️ Requirements

- **.NET 8.0+**  
- **Node.js 16+**  
- **SQL Server / PostgreSQL** (configurable)  

---

## 🚀 Installation & Run

### 1. Backend
```bash
cd Zatychka.Server
dotnet restore
dotnet build
dotnet run
```

### 2. Frontend
```bash
npm install
npm start
```

- API: `http://localhost:5000`  
- Frontend: `http://localhost:3000`  

---

## 🔌 API Overview

### Authentication
- `POST /api/auth/login` → Login & receive JWT  
- `POST /api/auth/register` → Register new user  
- `POST /api/auth/token-check` → Validate token  

### Wallets
- `GET /api/wallet` → Get wallet info  
- `POST /api/wallet` → Create new wallet  
- `PATCH /api/wallet/:id` → Update wallet  

### PayIn / Deposits
- `POST /api/payin` → Generate deposit link  
- `GET /api/payin/:id` → Lookup transaction  
- `GET /api/payin/history` → Deposit history  

### Disputes
- `POST /api/disputes` → File dispute  
- `GET /api/disputes/:id` → View dispute status  

### Statistics
- `GET /api/statistics/public`  
- `GET /api/statistics/private`  

### Telegram Links
- `POST /api/telegram-links` → Create link  
- `GET /api/telegram-links` → List links  

---

## 📊 Security Practices

- JWT for secure authentication  
- Role-based authorization (admin/user separation)  
- DTO validation on every API call  
- EF Core migrations for DB schema integrity  
- Audit logging for financial events  

---

## 🧩 Future Enhancements

- Multi-currency support  
- Two-Factor Authentication (2FA)  
- Enhanced fraud detection on deposits  
- Admin dashboards with advanced analytics  
- Dockerized deployment  

---

## 🛠️ Technologies

- **Backend:** ASP.NET Core, C#  
- **Frontend:** React, JavaScript  
- **Database:** SQL (via Entity Framework Core)  
- **Authentication:** JWT  
- **Integrations:** Telegram API  

---
