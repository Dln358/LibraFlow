# Software Installs needed
1. Install MySQL workbench.
2. Install node.js
3. Recommend using VScode and the live server plugin for seeing html changes.

# Database Setup
1. When starting MySQL ensure that you remember and keep your password stored.
2. Add a new connection(libraflow) you can name it anything as it is running locally.
3. On the left side in the box click on users and privileges and click add account.
4. Keep the password and user name as well as you will need it.
5. Select your account and on the right side select schema Privileges.
6. Make sure the schema is libraflow, apply Create, Delete, Insert, Select, Update privileges.
7. Copy and paste the code from the schema.sql file into your query and run it.

# Server Setup
1. In your code editor(VScode) terminal enter the following dependencies. 
2. " npm init -y ".
3. " npm install express body-parser mysql ".
4. " npm install cors ". 
5. Ensure you are connected and running " node server.js ".
6. In your Server.js file please enter the host, user, password, database names.
7. Note I used port 3001, assuming this isn't used on your machine it should work. If taken you will need to change it to something like 3002 etc. and change it in script.js as well.
 