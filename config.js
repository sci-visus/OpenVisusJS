// Settings for your webviewer installation

// Server module URL
const dotenv = require('dotenv');
const path = require('path');

// Server module URL
//DEFAULT_SERVER='http://10.1.10.57/mod_visus?';
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });
const DEPLOY_SERVER = process.env.DEPLOY_SERVER || 'localhost';

DEFAULT_SERVER='http://${DEPLOY_SERVER}:8080/mod_visus?';
 
