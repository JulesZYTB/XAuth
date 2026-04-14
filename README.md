<br />
<div align="center">
  <img src="https://img.freepik.com/vecteurs-libre/vecteur-conception-bouclier-cyber-securite-neon-bleu_53876-112200.jpg" alt="XAuth Shield" width="150" style="border-radius:20px;"/>
  <h1 align="center">XAuth Omega</h1>

  <p align="center">
    <strong>L'infrastructure de licence et télémetrie logicielle ultime, développée pour les architectures de classe Entreprise.</strong>
    <br />
    XAuth protège vos logiciels via un chiffrement AES-GCM militaire, une télémetrie avancée, et un système de gestion de licences cross-platforme (HWID, Restrictions d'IP, Webhooks).
    <br />
    <br />
    <a href="https://bloume.fr">Voir le site officiel</a>
    ·
    <a href="#fonctionnalités-principales">Explorer les fonctionnalités</a>
  </p>
</div>

<div align="center">
  <img src="https://img.shields.io/badge/version-2.0.0-blue.svg?style=for-the-badge&logo=appveyor" />
  <img src="https://img.shields.io/badge/Node.js-18.x-green.svg?style=for-the-badge&logo=nodedotjs" />
  <img src="https://img.shields.io/badge/React-18-61DAFB.svg?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-Ready-3178C6.svg?style=for-the-badge&logo=typescript" />
  <br/>
  <i>Développé à partir du template <a href="https://github.com/WildCodeSchool/create-js-monorepo">create-js-monorepo</a>.</i>
</div>

---

## ⛔ Droits & Licence d'utilisation

**Dev by Bloume SAS, [bloume.fr](https://bloume.fr)**

> [!WARNING]
> **Open Source - Utilisation Restreinte :**
> Ce projet est Open Source. Vous avez le droit absolu d'utiliser, de cloner, ou de modifier le code pour vos usages internes ou pour l'améliorer. **Cependant, il est STRICTEMENT INTERDIT de s'approprier les droits d'auteur, de revendre ce code source tel quel, ou de supprimer les crédits originaux.** Le copyright Bloume SAS doit être préservé intact.

---

## ✨ Fonctionnalités Principales

### 🛡️ Sécurité & Chiffrement Militaire
- **Protocole Handshake (AES-256-GCM)** : Les communications entre le logiciel client et le backend sont scellées et chiffrées avec des IVs dynamiques et nonces de session, rendant le "man-in-the-middle" inutile.
- **Hardware ID (HWID) Bonding** : Les licences sont verrouillées automatiquement sur le hardware de la machine cliente (Cross-platform: Windows, Linux, MacOS).
- **IP Lock** : Assignation d'IP statique stricte optionnelle.
- **Security Auditor (Nouveau)** : Un scan automatisé dans le dashboard permettant la détection en un clic des réseaux de partage frauduleux (keys partagées) et des attaques brute-force sur votre API.

### 📊 Télémetrie & Dashboard Temps Réel
- **Statistiques Vivantes** : Monitoring des Daily Active Users (DAU), métriques d'utilisations, de licences bannis ou expirés.
- **Carte Chaleur Globale (GeoIP)** : Toute validation passe par notre `GeoService` transparent, illuminant les pays d'où proviennent vos utilisateurs.
- **Détection des Anomalies** : Suivez précisément les réussites vs les échecs cryptographiques (Crack Attempts logs).

### ⚙️ Écosystème Produit Intégral
- **Système de Release** : Déployez vos mises à jour logiciels directement depuis l'interface et bloquez l'accès aux versions "beta" on-the-fly.
- **Webhooks (HMAC)** : Connectez des évènements (Ban, Redeem, Regenerate) de Webhooks avec sérialisation de signatures vers vos Discords ou APIs internes.
- **Routage i18n Natif** : Interfaces bilingues à 100% (FR et EN).

---

## 🚀 Démarrage Rapide (Installation)

### 1. Prérequis
- Node.js (v18+)
- MySQL Base de données configurée.

### 2. Cloner et Installer
```bash
git clone https://github.com/JulesZYTB/XAuth.git
cd XAuth

# Installation rapide via l'infrastructure monorepo
npm install
```

### 3. Base de données
Connectez votre serveur SQL et injectez le schéma racine situé dans :
```text
server/database/schema.sql
```
*Le super-admin initial sera `system_admin` avec le mot de passe `admin123`.*

### 4. Environnement
Créez les fichiers `.env` copiés depuis les templates et remplacez par vos variables:
Dans le dossier `server/` :
```env
APP_PORT=3310
FRONTEND_URL=http://localhost:3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=xauth
JWT_SECRET=UnSuperSecretLongEtTresComplique_BloumeSAS_2026
```

### 5. Lancer l'environnement de développement
Grâce aux commandes unifiées du JS-monorepo :
```bash
npm run dev
```

*Le client s'ouvre sur `localhost:3000` et l'API sur `localhost:3310`.*

---

## 🛠️ Intégration Client (Les SDKs)

L'implémentation a été pensée pour être instantanée sur presque n'importe quel langage. Les implémentations de références (Drop-in Ready) sont disponibles dans le dossier `/examples/` :

<details>
<summary><b>🐍 Python (xauth.py)</b></summary>
<br>

Exemple complet de validation client:
```python
from examples.python.xauth import XAuth

auth = XAuth(app_id=1, app_secret="VOTRE_SECRET")
result = auth.validate_license("XXXX-XXXX-XXXX")

if result.get("success"):
    print("Welcome!", result.get("variables"))
else:
    print("Acces Denied:", result.get("message"))
```
</details>

<details>
<summary><b>🚀 NodeJS & TypeScript (xauth.js / xauth.ts)</b></summary>
<br>

Exemple ES Module :
```typescript
import { XAuth } from './examples/nodejs/xauth';

const auth = new XAuth(1, "VOTRE_SECRET");
const result = await auth.validateLicense("XXXX-XXXX-XXXX");

if(result.success) {
    console.log("Connecté ! Expiration:", result.expiry);
}
```
</details>

<details>
<summary><b>🐹 Golang (xauth.go)</b></summary>
<br>

Exemple Go :
```go
import "xauth"

auth := xauth.NewXAuth(1, "VOTRE_SECRET", "http://votre-vps.com")
res := auth.ValidateLicense("XXXX-XXXX-XXXX")

if res.Success {
    fmt.Println("Connecté !")
}
```
</details>

---

## 🎨 Captures d'Écran de l'Infrastructure

| Global Heatmap & DAU | Security Auditor |
| ------------------- | ----------------- |
| ![Dashboard Overview](https://upload.wikimedia.org/wikipedia/commons/4/4e/Code_Snippet.svg) *(À remplacer par votre screenshot)* | ![Auditor view](https://upload.wikimedia.org/wikipedia/commons/4/4e/Code_Snippet.svg) *(À remplacer par votre screenshot)* |

| License Forge | Event Webhooks |
| ------------------- | ----------------- |
| ![Licenses](https://upload.wikimedia.org/wikipedia/commons/4/4e/Code_Snippet.svg) *(À remplacer par votre screenshot)* | ![Webhooks](https://upload.wikimedia.org/wikipedia/commons/4/4e/Code_Snippet.svg) *(À remplacer par votre screenshot)* |

---

## 📁 Architecture du projet & Monorepo

```text
XAuth/
├── client/                     # Frontend App (React / Vite)
│   ├── src/
│   │   ├── components/         # Composants Modals & UI réutilisables
│   │   ├── pages/              # Dashboards, Auth, Apps Views
│   │   ├── locales/            # i18n fr.json / en.json traductions
│   │   └── tailwind.css        # Système de design Bloume Enterprise
├── server/                     # Backend API (Express.js)
│   ├── src/
│   │   ├── modules/            # Logique CRUD (Licenses, Apps, Dashboards, Audits)
│   │   ├── services/           # Services Tiers (Webhook, GeoIP, Sécurité AES)
│   │   └── router.ts           # Routeurs
│   └── database/               # SQL Schémas
└── examples/                   # SDKs (Go, PHP, Python, NodeJS)
```

---

<br />
<div align="center">
  <p>Fait avec de l'innovation et une attention méticuleuse à la sécurité.</p>
  <p><b>Dev by Bloume SAS, 2024 - 2026.</b></p>
</div>
