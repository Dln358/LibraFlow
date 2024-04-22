# All Software Installs Needed for Complete Program
1. Install MySQL workbench.
2. Install node.js
3. Recommend using VScode and the live server plugin for seeing html changes.
4. Install Python
5. Recommend Intalling Juypter Notebooks Extension in VScode

# Database Setup
1. When starting MySQL ensure that you remember and keep your password stored.
2. Add a new connection(libraflow) you can name it anything as it is running locally.
3. On the left side in the box click on users and privileges and click add account.
4. Keep the password and user name as well as you will need it.
5. Select your account and on the right side select schema Privileges.
6. Make sure the schema is libraflow, apply Create, Delete, Insert, Select, Update privileges.
7. Copy and paste the code from the schema.sql file into your query and run it.

# Server Setup for node.js backend
1. In your code editor(VScode) terminal enter the following dependencies. 
2. " npm init -y ". If you dont bring in the node modules file
3. " npm install express body-parser mysql ".
4. " npm install cors bcrypt jsonwebtoken ". 
5. Ensure you are connected and running " node server.js ".
6. In your Server.js file please enter the host, user, password, database names.
7. Note I used port 3001, assuming this isn't used on your machine it should work. If taken you will need to change it to something like 3002 etc. and change it in script.js as well.
8. To start the server, and be able to interact with the database, you must manually start the server by running the server.js file.

# ML Model set up and instructions if you want to use the Recommendation Microservice
1. You will need juypter notebooks
2. Ensure that you're using the same kernel for the MLscript.py, and recommendations.ipynb for your pip/conda installs depending on your environment.
3. pip install flask
4. pip install mysql-connector-python
5. pip install transformers sentence-transformers
6. pip install pandas
7. pip install numpy
8. pip install joblib
9. pip install scikit-learn
10. In order to use the recommendation ML model system you must Install all these dependencies, and populate your database locally.
11. Create a books.csv file in your directory. Open the file in excel, and make the following columns, BookID, Title, Author, Genre, Description. Fill out the rows below with just one entry from your database. 
12. You then must run all code blocks in the recommendation.ipynb file. After completion you will have the .pkl files in your directory for use in the MLscript.py file.
13. You can now run the MLscript.py file, your books.csv will update with all database entries.
14. You can now retrain the model on the entirety of the database, and redeploy the newly trained model.
