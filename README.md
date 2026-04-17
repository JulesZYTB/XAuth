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
    <a href="https://xauth.monster"><b>Site officiel (xauth.monster)</b></a>
    ·
    <a href="https://api.xauth.monster">API (api.xauth.monster)</a>
    ·
    <a href="https://bloume.fr">Dev by Bloume</a>

  </p>
</div>

<div align="center">
  <img src="https://img.shields.io/badge/version-2.0.0-blue.svg?style=for-the-badge&logo=appveyor" />
  <img src="https://img.shields.io/badge/Node.js-18.x-green.svg?style=for-the-badge&logo=nodedotjs" />
  <img src="https://img.shields.io/badge/React-18-61DAFB.svg?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Express-Backend-000000.svg?style=for-the-badge&logo=express" />
  <img src="https://img.shields.io/badge/TypeScript-Ready-3178C6.svg?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/MySQL-Database-4479A1.svg?style=for-the-badge&logo=mysql" />
  <br/>
  <i>Développé à partir du template <a href="https://github.com/WildCodeSchool/create-js-monorepo">create-js-monorepo</a>.</i>
</div>

---

## ⛔ Droits & Licence d'utilisation

**Dev by Bloume SAS, [bloume.fr](https://bloume.fr)**

> [!WARNING]
> **Open Source - Utilisation Restreinte :**
> Ce projet est rendu Open Source pour vous offrir un cœur de protection logicielle transparent et auditable. Vous avez le droit absolu d'utiliser, de cloner, ou de modifier le code pour vos usages locaux, internes, personnels ou d'entreprise (protection de vos propres logiciels). **Cependant, il est STRICTEMENT INTERDIT de vous approprier les droits d'auteur, de revendre cette infrastructure en marque blanche, de supprimer le copyright, ou de clamer la paternité de cette œuvre.** Le copyright Bloume SAS doit être préservé intact en toutes circonstances.

---

## 🌟 Présentation Détaillée du Système

XAuth Omega n'est pas un simple gestionnaire de clés. C'est une forteresse modulaire conçue pour les distributeurs de logiciels qui souhaitent lutter activement contre le piratage, le reverse-engineering, et la fuite de licences. 

Chaque requête vers notre API de validation passe d'abord par une couche Cryptographique (AES-256-GCM), puis Géospatiale (GeoIP Resolution), puis par un contrôle d'intégrité (HWID Bonding).

### 🛡️ 1. Sécurité & Chiffrement de Grade Militaire
- **Protocole Handshake (AES-256-GCM)** : Les communications entre votre logiciel et le serveur sont invisibles pour les sniffeurs de paquets. Chaque lancement du logiciel initialise un **`nonce` aléatoire** unique. Même si la requête est capturée, elle ne peut être rejouée.
- **Hardware ID (HWID) Bonding Définitif** : Une licence s'attache d'elle-même à la signature numérique du matériel de l'utilisateur. Qu'il soit sur **Windows, Linux ou macOS**, XAuth capte l'empreinte unique de sa machine.
- **Lock IP Statique** : Pour les entreprises, vous pouvez interdire l'usage de la licence en dehors des murs d'un seul et unique routeur.
- **Security Auditor Intelligent** : Une IA interne analyse le log des authentifications et isole pour vous en 1 clic les attaques par force brute ou les abus de partages frauduleux de licences.

### 📊 2. Télémetrie Globale & Dashboard Interagissant
- **Carte Chaleur Globale 3D (GeoIP)** : Regardez le monde s'allumer. Chaque lancement de votre application géolocalise l'utilisateur (sans traquer son identité) pour vous donner un radar mondial de la présence de votre marque.
- **Monitoring DAU (Daily Active Users)** : Vous saurez enfin **qui utilise vraiment** votre logiciel, et combien de sessions sont ouvertes chaque jour.
- **Crash & Crack Detection** : Distinguez le flux légitime des requêtes corrompues, isolant par "Anomaly Detection" les tentatives de contournements.

### ⚙️ 3. Écosystème Cœur & API
- **Gestionnaire de Déploiement (Releases)** : Pourquoi payer un CDN ? Distribuez directement vos versions et installez vos patchs. Bloquez les anciennes versions via un panneau.
- **Système de Webhooks Sécurisés (HMAC)** : Connectez XAuth à l'extérieur. Discord, Slack, votre CRM... Lors d'une nouvelle vente `[REDEEM]` ou d'un bannissement `[BAN]`, un webhook est tiré.
- **Silos d'Applications** : Vous avez 15 logiciels ? Gérez-les tous depuis le même panel, chacun avec son propre secret privé.

---

## 🚀 Guide Rapide de Déploiement

### 1. Prérequis Serveur
- Node.js (Version 18 ou supérieure recommandée)
- MySQL / MariaDB (Pour stocker la data temporelle)
- NPM, Git.

### 2. Cloner et Installer
```bash
git clone https://github.com/JulesZYTB/XAuth.git
cd XAuth

# Installation rapide via l'infrastructure monorepo unifiée
npm install
```

### 3. Schéma de Base de Données
Ouvrez votre gestionnaire SQL (PhpMyAdmin, DBeaver) et exécutez le script complet. Il créera l'architecture complète, de la gestion des identités aux logs d'audit d'entreprise.
```text
server/database/schema.sql
```
> **Compte Initial :** Le super-admin généré sera **`system_admin`** avec le mot de passe **`admin123`**. Pensez à le changer en production.

### 4. Configuration des Variables d'Environnement
```env
# Dans server/.env
APP_PORT=3310
FRONTEND_URL=http://localhost:3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=mypassword
DB_NAME=xauth
JWT_SECRET=UnSuperSecretLongEtTresComplique_BloumeSAS_2026

# Dans client/.env
VITE_API_URL=http://localhost:3310
```

### 5. Démarrer XAuth Omega
Le monorepo permet de démarrer le backend et le frontend simultanément :
```bash
npm run dev
```

*Le client s'ouvre sur `localhost:3000` et l'API sur `localhost:3310`.*

---

## 🛠️ Intégration Client (Les bibliothèques / SDKs)

L'implémentation dans votre logiciel existant prend **moins de 5 lignes**. Les SDK "Drop-in Ready" incluent nativement le protocole AES et le fetching HWID.
Trouvez votre langage de prédilection dans le dossier `examples/`.

<details>
<summary><b>🐍 Python (Script ou .exe)</b></summary>
<br>

Fichier source : `examples/python/xauth.py`

```python
from examples.python.xauth import XAuth

auth = XAuth(app_id=1, app_secret="VOTRE_SECRET")
result = auth.validate_license("KEY-XXXX-XXXX")

if result.get("success"):
    print(f"Connexion réussie ! Expiration: {result.get('expiry')}")
    # Votre logiciel se lance ici
else:
    print(f"Accès refusé: {result.get('message')}")
    # Extinction du logiciel
```
</details>

<details>
<summary><b>🚀 NodeJS & TypeScript (Electron, CLI, Bot)</b></summary>
<br>

Fichier source : `examples/nodejs/xauth.js` / `.ts`

```typescript
import { XAuth } from './examples/nodejs/xauth';

const auth = new XAuth(1, "VOTRE_SECRET");
const result = await auth.validateLicense("KEY-XXXX-XXXX");

if(result.success) {
    console.log("Connecté ! Variables injectées:", result.variables);
} else {
    console.error("Échec:", result.message);
}
```
</details>

<details>
<summary><b>🐹 Golang (Systèmes Complés)</b></summary>
<br>

Fichier source : `examples/go/xauth.go`

```go
package main
import (
    "fmt"
    "xauth"
)

func main() {
    auth := xauth.NewXAuth(1, "VOTRE_SECRET", "http://votre-api.com")
    res := auth.ValidateLicense("KEY-XXXX-XXXX")

    if res.Success {
        fmt.Println("Connecté ! Annonce Backend :", res.Broadcast)
    } else {
        fmt.Println("Erreur Critique:", res.Message)
    }
}
```
</details>

<details>
<summary><b>🐘 PHP (Plugins Web)</b></summary>
<br>

Fichier source : `examples/php/xauth.php`

```php
require_once 'examples/php/xauth.php';

$auth = new XAuth(1, "VOTRE_SECRET", "http://votre-api.com");
$res = $auth->validateLicense("KEY-XXXX-XXXX");

if ($res['success']) {
    echo "Licence web reconnue.";
}
```
</details>

---

## 🎨 Captures d'Écran de l'Infrastructure

> **Remplacer par des images locales** :
> Les liens ci-dessous sont des exemples. N'hésitez pas à héberger vos propres captures d'écran et à remplacer les URLs directes !

<div align="center">
  <img src="https://assets.website-files.com/6007ec17326eab25f9bcee25/61df6ed41f6e625a072d7335_Dashboard%202-min.png" alt="Dashboard" border="0" style="border-radius:24px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); width: 80%;"/>
  <br/><br/>
  
  <i>Le panneau d'analyse globale et la carte géospatiale des utilisateurs actifs (DAU).</i>

  <br/><br/>

  <hr>

  <img src="https://assets.website-files.com/6007ec17326eab25f9bcee25/620f4c3905cf584f2c05fc08_Monitoring-min.png" alt="Security Auditor" border="0" style="border-radius:24px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); width: 80%;"/>
  <br/><br/>

  <i>Mode "Security Auditor" pour le blocage unifié des fuites de licences.</i>
</div>

---

## 📁 Architecture du projet

L'application suit une structure moderne en Monorepo :

```text
XAuth/
├── client/                     # ⚛️ Frontend App (React / Vite)
│   ├── src/
│   │   ├── components/         # Composants Modals (SecurityAuditor, Webhooks)
│   │   ├── pages/              # Dashboards, Auth, Gestion d'Apps, Utilisateurs
│   │   ├── locales/            # Moteur i18n Natif (fr.json / en.json)
│   │   └── tailwind.css        # Système de design unique Themé Dark "Bloume Enterprise"
│
├── server/                     # ⚙️ Backend API (Express.js / Node)
│   ├── src/
│   │   ├── modules/            # Logique CRUD stricte (Licenses, Dashboards, Audits)
│   │   ├── services/           # Middlewares & Handlers (Webhook, GeoIP Tracker, AES-GCM)
│   │   └── router.ts           # Routeurs
│   └── database/               # SQL Schémas d'initialisation
│
└── examples/                   # 🖥️ SDKs de reverse-intégration
```

---

<br />
<div align="center">
  <p>Fait avec un goût prononcé pour l'esthétique et une architecture intraitable contre le piratage.</p>
  <p><b>Dev by Bloume SAS, 2024 - 2026.</b></p>
</div>
