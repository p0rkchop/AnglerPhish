// MongoDB initialization script for AnglerPhish
// This script runs when the MongoDB container starts for the first time

db = db.getSiblingDB('anglerphish');

// Create application user for the anglerphish database
db.createUser({
  user: 'anglerphish_user',
  pwd: 'anglerphish_password_change_in_production',
  roles: [
    {
      role: 'readWrite',
      db: 'anglerphish'
    }
  ]
});

// Create indexes for better performance
db.createCollection('users');
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });

db.createCollection('submissions');
db.submissions.createIndex({ "submissionId": 1 }, { unique: true });
db.submissions.createIndex({ "status": 1, "receivedAt": -1 });
db.submissions.createIndex({ "senderEmail": 1 });
db.submissions.createIndex({ "messageId": 1 });

db.createCollection('configs');
db.configs.createIndex({ "key": 1 }, { unique: true });
db.configs.createIndex({ "category": 1 });

print('MongoDB initialization completed for AnglerPhish database');