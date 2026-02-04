1. Each of you write out issues for the project work
2. Assign yourself an issue
3. Clone the repo to your local computer.
4. Create a branch, then work as normal adding and commiting files as you work
5. Push your work to a pull request, which can be on draft mode if you are still working (so no one can merge it in prematurely)
6. Make sure you also pull the repository frequently to make sure you are always working with the most up-to-date version of the repository there is.



setup: 

na unixowych systemach python3 zamiast python 
stworzyć nowe wirtualne środowisko pythona w folderze projektu, aktywować je, mu pobrac wymagania z requirements.txt:

python -m venv env
.\env\Scripts\activate.bat 
pip install -r requirements.txt

otworzyć backend: 
  z folderu /backend:
  python .\manage.py runserver
otworzyc frontend:
  z folderu \frontend:
  npm run dev
  otworzyc link z konsoli 

Jakby coś było nie zainstalowane we frontendzie, z folderu \frontend:
npm install 
