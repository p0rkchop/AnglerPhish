# Phishfry - a gamified phishing submission system.

Version 0.1

Overview: Phishfry is a system that allows people to submit suspicious emails to earn points for successful submissions. The point is to create a gamified experience for an organization, where people compete to see who can spot the most phishing messages and get the most points. This document will break down the major components of the system and demonstrate a minimum viable product.

Application Core: The application will be capable of running entirely out of a docker container, using a modern web stack capable of receiving phishing email submissions, storing data in a database and providing a modern web user experience.

Components:
- Modern web stack: The application should be built with the MERN stack: MongoDB, Express.js, React and Node.js. The entire system will run within a docker container. All configuration options for the application must be available within the web UI. The application will write all of its operations to a log file on disk, with routine operations creating an INFO message and errors noted with a WARN message. All functions of the system have error checking conditions.
- Phishing email ingestion engine: 
  - Receiving and sending email. People who believe they have received a phishing email will forward it to an address specified by the person responsible for this instance. In this application, the email address for submission is: phishfry25@gmail.com. The application needs the ability to retrieve email messages via secure IMAP (port 993 TLS required), and send responses to people submitting the message via SMTP over TLS (Port 587). In this example, the application will use imap.gmail.com and smtp.gmail.com for server names. The application needs the ability to accept and store a username and password for both. Error checking for this component validates that the mail server can be reached and authenticated to.
  - The application will make an IMAP request every five minutes and download the complete contents of the email message, including headers and attachments.
  - When the message is downloaded, it will be stored in the database with a submission identifier, and a record of the email address that sent the email.
  - The email will be parsed for all URLs, which will be included as part of the database record.
  - When a message is downloaded, all attachments will be downloaded and associated with the message submission.
  - When a message is downloaded, it will be rendered as a PNG image with all inline images displayed.
  - Submitted messages have two states, noted in the database associated with the submission: To-Do and Done.
- Web User Interface:
  - The web user interface has two application roles: Administrator and User. The administrator is responsible for system configuration and reviewing submitted phishing email messages. The system needs an administrative UI that includes user management and system configuration options. At the current time, do not take action to create a user-side part of the application. In the first iteration, the system will work by only receiving and reviewing submissions.
  - Upon login, the main screen for the administrator shows a list of submissions. In the list is the email address of the sender, the subject line of the email message and a timestamp associated with when the message was retrieved.
  - On the left side is a navigation bar, which has three navigation elements: dashboard, Config and logout.
  - When the administrator clicks on a submission, it opens up the submission detail view to display all of the vital information about the email message, the rendered image of the email message, list of extracted URLs and a list of all attachments, which can be clicked on to view or download.
  - Within the submission detail view, the administrator has the ability to submit a numerical score, 0-100, on the submission. Once the score is submitted, the state of the submitted message is set to “Done” and will no longer show on the dashboard.