# Debunk – Fake News Review Platform

**Debunk** is a full-stack web application designed to support community-driven verification of online content. Users can submit articles for review, while designated reviewers (“redactors”) evaluate their credibility and provide sourced verdicts.

The system is built as a decoupled application with a Django-based API backend and a React frontend. 

<img width="1366" height="623" alt="image" src="https://github.com/user-attachments/assets/9a687403-8bd1-429c-b57f-41e9a17fe9d7" />

<img width="1366" height="625" alt="image" src="https://github.com/user-attachments/assets/1f365c4b-b379-4609-b381-95ec1b46b194" />

<img width="1345" height="618" alt="image" src="https://github.com/user-attachments/assets/fe2f37ff-1b42-4caa-8320-ce55f445a67b" />

<img width="1366" height="623" alt="image" src="https://github.com/user-attachments/assets/a0733d11-574a-4c24-8299-b4a3153a1c20" />

<img width="1366" height="626" alt="image" src="https://github.com/user-attachments/assets/1f55139e-e219-4bfc-9c50-3e250f3bae33" />


## Overview

The platform enables structured review of potentially misleading content through role-based workflows:

* Users submit articles for verification
* Redactors evaluate and publish reviewed entries
* Administrators manage roles and platform integrity

The application emphasizes clear separation of concerns, with a REST API backend and a modern frontend interface.

## Tech Stack

* Backend
  * Django (REST-style API)
  * SQLite (default)
  * Gunicorn (production)

* Frontend
  * React + Vite
  * Node.js
  * Bootstrap
    
## Features
* Content Review Workflow
  * Users submit articles for verification (URLs, title, description, categories)
  * Redactors claim review requests within their categories
  * Redactors publish reviewed requests as entries with:
    * Verdict (Trustworthy / Not Trustworthy)
    * Supporting sources
    * Additional relevant articles identified during review
    * Description and categorization
* Role-Based Access
  * Unregistered users
    * Browse reviewed entries
    * View rankings (most upvoted entries, most misleading domains)
  * Registered users
    * Submit review requests
    * Upvote entries
    * Apply to become a redactor for given categories (with supporting documents)
  * Redactors
    * Review and claim requests within their categories
    * Publish verified entries with sources
    * Full access to user-level functionality
  * Administrators
    * Approve/reject redactor applications
    * Manage user roles
    * Moderate and remove content
     
## Architecture
  * Decoupled frontend and backend
  * REST API for all application interactions
  * Role-based permission system
  * Persistent media storage for uploaded documents
  * Dockerized deployment with service separation:
    * Backend (Django + Gunicorn)
    * Frontend (served via Nginx)
  * Shared volumes for database and media

## Running the Project
* Option 1 – Local Development
  Backend

  ```bash
  cd backend
  python -m venv venv
  source venv/bin/activate  # or venv\Scripts\activate on Windows
  pip install -r requirements.txt

  # Set environment variable
  SECRET_KEY=your_secret_key # On Windows SET SECRET_KEY=your_secret_key for cmd and $env: SECRET_KEY='your_secret_key' for ps
  
  python manage.py runserver
  ```
* Frontend

  ```bash
  cd frontend
  npm install
  VITE_API_URL=http://localhost:8000 # backend url
  # On Windows SET VITE_API_URL=http://localhost:8000 for cmd
  # '$env:VITE_API_URL='http://localhost:8000' for ps
  npm run dev
  ```
  
This setup uses a pre-populated SQLite database and sample media files for testing. The sample admin username and password is 'admin'.

* Option 2 – Docker (Recommended)
  
  Create a .env file in the project root:
  ```
  SECRET_KEY=your_secret_key
  DEBUG=True
  DJANGO_LOGLEVEL=info
  DJANGO_ALLOWED_HOSTS=localhost,backend
  DJANGO_SUPERUSER_USERNAME=admin
  DJANGO_SUPERUSER_PASSWORD=Admin123!
  ```
  Run:
  `docker compose up`

  ### Details:

  * Backend runs via Gunicorn
  * Frontend is served as static files via Nginx
  * Nginx proxies API requests to the backend
  * Database and media files are persisted using Docker volumes
  * Database is initialized and migrated automatically on first run

## Database Note

The project uses SQLite for simplicity and portability. For production scenarios, a dedicated database service (e.g., PostgreSQL) would be more appropriate and can be easily integrated via Docker Compose.

## Notes
  * Designed as a collaborative academic project
  * Focused on full-stack integration and role-based workflows
  * Designed with an emphasis on clarity and modular structure
    
## Future Improvements
  * Replace SQLite with PostgreSQL in a dedicated container
  * Improve frontend state management and structure
  * Add automated testing (backend + frontend)
  * Enhance moderation and reporting features

