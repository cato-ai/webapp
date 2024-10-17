#!/bin/bash

echo -e "\n\n\n\n\n\n Setting up environment..."

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

apt install unzip

if [ $? -eq 0 ]; then
    echo "unzip isntalled successfully"
else
    echo "Failed to install unzip"
    exit 1
fi

unzip /opt/webapp.zip

cd /opt/webapp

apt install -y npm || exit 1

echo -e "\n\nInstalling PostgreSQL..."
apt install -y postgresql postgresql-contrib

if ! command_exists psql; then
    echo "PostgreSQL installation failed!"
    exit 1
else
    echo "PostgreSQL is installed successfully"
fi


#Section to grant permission and create user for cato_ai user
echo -e "\n\n\nCreating PostgreSQL user..."
sudo -u postgres psql -c "CREATE USER $1 WITH PASSWORD '$2';"

if [ $? -eq 0 ]; then
    echo "PostgreSQL user created successfully"
else
    echo "Failed to create PostgreSQL user!"
    exit 1
fi

sudo -u postgres psql -c "CREATE DATABASE $3;"

if [ $? -eq 0 ]; then
    echo -e "\n\nPostgreSQL DATABASE created successfully"
else
    echo -e "\n\nFailed to create PostgreSQL DB"
    exit 1
fi

sudo -u postgres psql -c "GRANT ALL ON DATABASE $3 to $1;"

if [ $? -eq 0 ]; then
    echo "PostgreSQL user GRANTED PERMISSIONS"
else
    echo "Failed to grant permissions to PostgreSQL user!"
    exit 1
fi


sudo -u postgres psql -c "ALTER DATABASE $3 OWNER TO $1;"

if [ $? -eq 0 ]; then
    echo "PostgreSQL DB owner altered successfully"
else
    echo "Failed to alter PostgreSQL db owner"
    exit 1
fi

#permisions
sudo chown -R csye6225:csye6225 /opt/webapp/


echo -e "\n\n Installing Node.js dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "npm install failed!"
    exit 1
fi


# echo -e "\n\n\n\n Starting the application...\n\n\n"
# npm start
# if [ $? -ne 0 ]; then
#    echo "npm start failed!"
#    exit 1
# fi


echo -e "\n\n\n Opening port 3000 for handling http requests with ufw..."
sudo ufw allow http
sudo ufw allow 3000

echo -e "\n\n\nScript completed successfully!"
