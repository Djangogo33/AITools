# Politique de Sécurité - AITools 🤖

Bienvenue sur le dépôt **AITools**. Le développement d'outils basés sur l'Intelligence Artificielle implique des défis de sécurité uniques. Nous nous engageons à protéger les données de nos utilisateurs et l'intégrité de nos modèles.

## 🎯 Points de vigilance spécifiques à l'IA

Nous surveillons activement et invitons la communauté à nous signaler les vulnérabilités liées aux aspects suivants :

* **Gestion des Secrets & Clés d'API :** Exposition accidentelle de tokens ou de clés d'API privées (OpenAI, Anthropic, Hugging Face, etc.) dans le code ou les fichiers de configuration.
* **Injections de Prompts (Prompt Injections) :** Failles critiques permettant à un utilisateur malveillant de contourner les instructions système (*System Prompts*) pour exécuter du code arbitraire (RCE) ou extraire des données sensibles.
* **Empoisonnement des données / Extraction :** Vulnérabilités permettant d'altérer les données d'entraînement locales ou d'extraire des informations confidentielles à partir des logs de requêtes.

---

## 🛡️ Versions Supportées

Seules les versions listées ci-dessous reçoivent activement des correctifs de sécurité (notamment les mises à jour des dépendances de modèles et de wrappers d'API) :

| Version | Supportée |
| ------- | --------- |
| 1.0.x   | ✅ Oui    |
| < 1.0.0 | ❌ Non    |

---

## 🚨 Comment signaler une faille ?

Si vous découvrez une faille de sécurité ou une fuite potentielle de données dans l'un de nos outils IA, **merci de ne pas ouvrir de ticket (Issue) public**. 

1. Rejoignez notre serveur Discord dédié : [https://discord.gg/J2ssa2Wkjr](https://discord.gg/J2ssa2Wkjr).
2. Contactez directement et en **message privé (DM)** un membre de l'équipe de développement (**Djangogo33** ou un administrateur).
3. Fournissez un maximum de détails : le script concerné, le prompt ou la charge utile (*payload*) utilisé, et l'impact constaté.

> 💡 **Conseil de sécurité :** Pensez à vérifier que votre fichier `.env` ou vos fichiers de clés ne sont pas suivis par Git avant de pousser vos modifications !

---

## 🛠️ Notre engagement de traitement

Une fois le problème signalé en privé :
1. Nous accusons réception de votre rapport sous **48 heures**.
2. Nous travaillons sur un correctif (patch de sécurité ou durcissement du prompt système).
3. Une mise à jour sera publiée, et vous serez crédité dans notre changelog (si vous le souhaitez).
4. 
