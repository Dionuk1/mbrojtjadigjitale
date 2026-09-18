# Secure You Tools

Create a complete, modern, lightweight cybersecurity web application called Security Toolkit.

The application should be useful for everyday personal security tasks. It must be simple, clean, responsive, and not overloaded with unnecessary features or animations.

The application must not require registration or login for normal users. All public security tools should work directly in the browser.

Only the admin area should require authentication.

Main layout

Create a responsive application layout with a hamburger menu icon in the top-left corner.

When the user clicks the hamburger icon, open a sidebar menu from the left.

The sidebar must contain exactly these navigation items:

☰ Security Toolkit

🏠 Dashboard
🔑 Password Generator
🛡️ Strength Checker
📝 Passphrase Generator
📁 File Hash Checker
🔒 Text Encryption
✅ Security Checklist
💡 Security Tips

──────────────

⚙️ Settings
🔐 Admin Login

On desktop, the sidebar can remain visible or collapsible.

On mobile and tablet devices, the sidebar should open as an overlay and close automatically when the user selects a menu item.

Add a dark transparent overlay behind the opened mobile sidebar.

Add a close button inside the sidebar.

Highlight the currently active page.

Design style

Use a clean cybersecurity-inspired design.

Design requirements:

Dark navy background

Blue and green security accents

Modern cards

Rounded corners

Soft shadows

Clear typography

Accessible contrast

Simple icons

Responsive layout

Minimal animations

Smooth sidebar transition

Mobile-friendly controls

Consistent buttons and input fields

Light mode and dark mode support

Do not make the application visually crowded.

Use reusable components for cards, buttons, alerts, input fields, toggles, copy buttons and tool headers.

Display this privacy message where appropriate:

“Your sensitive data is processed locally in your browser and is never stored or transmitted.”

1. Dashboard

Create a simple dashboard that introduces the Security Toolkit.

The dashboard should include:

Welcome title

Short application description

Search bar for finding tools

Quick-access cards for the most useful tools

Privacy-first information card

Daily security tip

Security checklist progress

Recently used tools stored only in local browser storage

Button to clear recent activity

Quick-access cards should include:

Password Generator

Strength Checker

Passphrase Generator

File Hash Checker

Text Encryption

Security Checklist

Do not show fake statistics or fake security results.

2. Password Generator

Create a secure password generator.

Features:

Password length slider from 8 to 128 characters

Default password length of 16 characters

Include uppercase letters

Include lowercase letters

Include numbers

Include symbols

Exclude ambiguous characters

Exclude duplicate characters when possible

Option to generate easy-to-read passwords

Generate button

Regenerate button

Copy password button

Clear button

Password strength indicator

Password entropy estimation

Display the selected password length

Show a warning when too few character types are selected

Use the browser Web Crypto API with crypto.getRandomValues().

Never use Math.random() for security-sensitive generation.

Never save generated passwords.

Do not send generated passwords to any server.

3. Password Strength Checker

Create a password strength analysis tool.

The analysis must happen locally in the browser.

Features:

Password input field

Show or hide password

Strength score from 0 to 100

Labels:



Very Weak

Weak

Medium

Strong

Very Strong

Progress bar

Check password length

Check uppercase letters

Check lowercase letters

Check numbers

Check symbols

Detect repeated characters

Detect sequential patterns

Detect keyboard patterns such as qwerty

Detect common weak passwords

Detect common patterns such as 123456, password, admin and letmein

Show clear improvement recommendations

Estimate password entropy

Explain that estimated cracking time is only an approximation

Clear button

Do not store or transmit the checked password.

Do not log password input in analytics or browser console.

4. Passphrase Generator

Create a memorable passphrase generator.

Features:

Generate between 3 and 8 random words

Choose separator:



Hyphen

Underscore

Dot

Space

Capitalize words option

Add numbers option

Add symbols option

Add a random number at the beginning or end

Copy button

Regenerate button

Clear button

Strength indicator

Explain why long passphrases can be secure and easier to remember

Use cryptographically secure randomness.

Do not store generated passphrases.

Example format:

River-Laptop-Mango-92!

5. File Hash Checker

Create a local file hash verification tool.

The selected file must remain inside the user’s browser.

Do not upload files to a server.

Features:

Drag-and-drop file upload area

Standard file picker button

Display file name

Display file size

Display file type

Generate SHA-256 hash

Generate SHA-512 hash

Optional MD5 hash only for legacy comparison

Clearly warn that MD5 is not secure for cryptographic protection

Copy each hash

Compare generated hash with an expected hash

Show:



Hashes Match

Hashes Do Not Match

Clear selected file

Progress indicator for larger files

Support large files without freezing the interface when possible

Use the Web Crypto API for supported hash algorithms.

Explain that a matching hash helps verify file integrity but does not automatically prove that a file is safe.

6. Text Encryption

Create a secure local text encryption and decryption tool.

Use AES-GCM encryption through the Web Crypto API.

Features:

Text input area

Master password field

Show or hide master password

Encrypt button

Decrypt button

Copy encrypted output

Copy decrypted output

Download encrypted result as a .txt file

Upload an encrypted .txt file

Clear all button

Automatically generate a unique random salt

Automatically generate a unique initialization vector

Derive the encryption key securely from the master password

Display useful validation messages

Warn the user that forgotten master passwords cannot be recovered

All encryption and decryption must happen locally in the browser.

Never store:

Original text

Encrypted text

Decrypted text

Master passwords

Encryption keys

Do not send any encryption data to a backend.

Use an authenticated encryption approach so modified encrypted data fails securely.

7. Security Checklist

Create an interactive personal cybersecurity checklist.

Checklist items should include:

I use a unique password for every important account

I use passwords or passphrases with at least 16 characters

I use a trusted password manager

I have enabled two-factor authentication

I have saved my recovery codes securely

My phone and computer use a screen lock

My operating system is updated

My browser is updated

My important files are backed up

I review active login sessions

I do not reuse old passwords

I avoid opening suspicious links and attachments

I verify website domains before entering passwords

I use device encryption

I have updated my account recovery email and phone number

Features:

Check and uncheck items

Progress bar

Completed items counter

Security level:



Needs Improvement

Basic

Good

Strong

Save checklist progress locally using localStorage

Reset checklist button

Export checklist as text

Display recommendations based on unchecked items

Do not require an account to save checklist progress.

8. Security Tips

Create a security education page with practical tips.

Organize tips into simple categories:

Password Security

Two-Factor Authentication

Phishing Protection

Device Security

Browser Security

Wi-Fi Security

Backup Security

Social Media Privacy

File Download Safety

Account Recovery

Include advice such as:

Use a unique password for each account

Prefer passwords or passphrases with at least 16 characters

Use a trusted password manager

Enable two-factor authentication

Prefer authenticator apps or security keys when available

Never share one-time authentication codes

Verify the real domain before logging in

Avoid opening unexpected attachments

Keep devices and applications updated

Download software only from trusted official sources

Keep secure backups

Review active sessions regularly

Never store important passwords in plain text

Do not reuse compromised passwords

Add search and category filters.

Keep explanations short, clear and practical.

9. Settings

Create a settings page for local application preferences.

Features:

Dark mode

Light mode

System theme

Enable or disable animations

Default password length

Default passphrase word count

Automatically clear sensitive fields after a selected period

Auto-clear options:



Never

After 1 minute

After 5 minutes

After 10 minutes

Show or hide privacy reminders

Clear recent tools

Reset all local settings

Clear all locally stored checklist progress

Export non-sensitive settings

Import non-sensitive settings

Store settings only in localStorage.

Never include sensitive tool input in exported settings.

10. Admin Login

Create a separate admin authentication page at:

/admin/login

Do not include public user registration.

Admin login requirements:

Email or username field

Password field

Show or hide password

Login button

Loading state

Generic invalid credentials message

Rate limiting

Temporary lockout after repeated failed attempts

Secure session handling

Logout functionality

Protected admin routes

Redirect unauthenticated users to /admin/login

Prevent open redirects

Use secure and HttpOnly cookies where backend sessions are available

Never store an admin password in frontend code

Never store plaintext passwords in the database

Hash admin passwords using Argon2id or bcrypt

Do not expose default admin credentials in the interface or source code.

11. Admin Dashboard

Create a protected admin page at:

/admin/dashboard

The admin dashboard should be simple and not overloaded.

Features:

Anonymous tool usage counters

Password generator usage count

Strength checker usage count

Passphrase generator usage count

File hash checker usage count

Text encryption page visits

Security checklist usage count

Most-used tool

Daily and weekly usage summary

Enable or disable individual tools

Manage daily security tips

Manage common weak password patterns used by the strength checker

View anonymous feedback

Logout button

Never collect or store:

Passwords

Passphrases

Hash input text

Uploaded files

File contents

Master passwords

Encryption keys

Encrypted or decrypted user text

IP addresses unless technically necessary for login security

Sensitive browser data

Anonymous analytics must only record events such as:

password_generator_opened

password_generated

strength_checker_opened

passphrase_generated

file_hash_generated

text_encryption_opened

checklist_completed

Do not record the actual contents processed by any tool.

Security requirements

Apply secure development practices throughout the application.

Requirements:

Validate all input

Escape displayed content

Prevent cross-site scripting

Prevent SQL injection

Add CSRF protection to admin actions

Add admin login rate limiting

Use secure session cookies

Use SameSite cookie settings

Use HttpOnly cookies

Use Secure cookies in production

Add Content Security Policy

Add X-Content-Type-Options

Add Referrer-Policy

Add Permissions-Policy

Do not expose secrets in frontend environment variables

Do not log sensitive information

Do not use localStorage for admin authentication tokens

Add safe error handling

Avoid revealing whether an admin username exists

Add inactivity session timeout for the admin

Add logout from all admin sessions if supported

Routing

Create these routes:

/

/password-generator

/strength-checker

/passphrase-generator

/file-hash-checker

/text-encryption

/security-checklist

/security-tips

/settings

/admin/login

/admin/dashboard

Important privacy rules

All public security tools must work locally in the browser whenever technically possible.

Never store, transmit or log sensitive user input.

Show privacy reminders near sensitive tools.

Generated passwords and passphrases must disappear when the page is refreshed unless the user manually copies them.

Do not add a password history feature.

Do not add cloud synchronization.

Do not add public user accounts.

Do not claim that the application guarantees complete security.

Final result

Build the complete application with:

Functional sidebar navigation

Hamburger menu

Responsive mobile layout

Working password generator

Working password strength checker

Working passphrase generator

Working local file hash checker

Working local text encryption and decryption

Working security checklist

Security tips page

Settings page

Separate admin login

Protected admin dashboard

Clean cybersecurity design

Privacy-first local processing

Clear validation and error states

Prioritize functionality, privacy, security and simplicity over unnecessary visual effects.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://mbrojtjadigjitale.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ec7f25ba-8524-41e7-b57b-90a0bc5422ed).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
