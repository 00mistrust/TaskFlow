TaskFlow - Collaborative Project Management

#L'équipe :
Marwane Taouil - Project Manager & Developer ;@MR12006 

Marwa El Ouaai - Developer ;@00mistrust

Lina ABAICH - Developer  ;@abaichlina

Salsabil ADIM- Developer ; @salsabiladim

Samir TOUIMI BENJELLOUN -Developer ;@dream21edit-star


#Feature Distribution
Marwane: F1- authentification et F5 - dashboard
Marwa: F3 -gestion des taches et f6 -filtrage,recherche,pagination
Lina: F4- assignation des tachees et F9- historique 
Salsabil: F2- creation et gestion des projetset F8- gestion des membres
Samir : F7- sauvegarde des brouillons et F10 - notifications

-----------ETAPES POUR LANCER L'APP-----------------

# 1. Cloner le repo
git clone https://github.com/MR12006/TaskFlow.git
cd TaskFlow

# 2. Creer .env file in backend/ avec ces valeurs:
MONGO_URI=mongodb://mongo:27017/taskflow
JWT_SECRET=supersecretkey
PORT=5000

# 3. lancer
cd backend
docker-compose up --build

# 4. ouvrir frontend/login.html

--------------------------------------------------------

 Technical Stack
Backend: Node.js & Express.js  
Frontend: Vanilla JavaScript & Axios  
Database: MongoDB (Container via Docker)  
DevOps: Docker Compose
