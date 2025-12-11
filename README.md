1. Each of you write out issues for the project work
2. Assign yourself an issue
3. Clone the repo to your local computer.
4. Create a branch, then work as normal adding and commiting files as you work
5. Push your work to a pull request, which can be on draft mode if you are still working (so no one can merge it in prematurely)
6. Make sure you also pull the repository frequently to make sure you are always working with the most up-to-date version of the repository there is.



setup: 

na nie windowsie python3 zamiast python etc etc jak nie jestes na windowsie to pewnie wiesz co zrobic
stworzyc nowe wirtualne srodowisko pythona w folderze projektu, aktywowac je, kazac mu pobrac wymagania z requirements.txt

python -m venv env
.\env\Scripts\activate.bat 
pip install -r requirements.txt

otworzyc backend: 
  z folderu /backend:
  python .\manage.py runserver
otworzyc frontend:
  z folderu \frontend:
  npm run dev
  otworzyc link z konsoli
  
strona dziala yippie

jak zapiszecie plik to powinno przeładować odpowiedni serwer i nie musicie restartowac by zmiany zrobic, do backendu pamietajcie robic migracje jak cos w modelach zrobicie

Jakby cos mi sie nie spushowalo na gita poprawnie to depsy do frontentu:
npm install axios react-router-dom jwt-decode
