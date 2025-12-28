/**
 * Template Library
 * 
 * Pre-built templates for common development patterns.
 * Dramatically speeds up development by providing tested, production-ready code.
 * 
 * Categories:
 * - Web Applications (landing pages, blogs, dashboards)
 * - APIs (REST, GraphQL, WebSocket)
 * - Full-Stack Apps (todo, chat, social)
 * - Data Processing (ETL, analysis, reporting)
 */

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'web-app' | 'api' | 'full-stack' | 'data-processing' | 'utility';
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // minutes
  
  // Files to create
  files: TemplateFile[];
  
  // Dependencies
  dependencies: {
    npm?: string[];
    pip?: string[];
  };
  
  // Setup steps
  setup: SetupStep[];
  
  // Configuration
  config: Record<string, any>;
  
  // Environment variables needed
  envVars?: string[];
}

export interface TemplateFile {
  path: string;
  content: string;
  template?: boolean; // Use templating engine
  description?: string;
}

export interface SetupStep {
  description: string;
  command: string;
  optional?: boolean;
}

/**
 * Template: Landing Page
 */
export const landingPageTemplate: Template = {
  id: 'landing-page',
  name: 'Modern Landing Page',
  description: 'Responsive landing page with hero, features, pricing, and contact sections',
  category: 'web-app',
  tags: ['html', 'css', 'tailwind', 'responsive'],
  difficulty: 'beginner',
  estimatedTime: 10,
  
  files: [
    {
      path: 'index.html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{PROJECT_NAME}}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
    <!-- Hero Section -->
    <section class="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-20">
        <div class="container mx-auto px-4 text-center">
            <h1 class="text-5xl font-bold mb-4">{{HERO_TITLE}}</h1>
            <p class="text-xl mb-8">{{HERO_SUBTITLE}}</p>
            <button class="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100">
                Get Started
            </button>
        </div>
    </section>

    <!-- Features Section -->
    <section class="py-20">
        <div class="container mx-auto px-4">
            <h2 class="text-3xl font-bold text-center mb-12">Features</h2>
            <div class="grid md:grid-cols-3 gap-8">
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <h3 class="text-xl font-semibold mb-2">Feature 1</h3>
                    <p class="text-gray-600">Description of feature 1</p>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <h3 class="text-xl font-semibold mb-2">Feature 2</h3>
                    <p class="text-gray-600">Description of feature 2</p>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <h3 class="text-xl font-semibold mb-2">Feature 3</h3>
                    <p class="text-gray-600">Description of feature 3</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Contact Section -->
    <section class="bg-gray-100 py-20">
        <div class="container mx-auto px-4 max-w-md">
            <h2 class="text-3xl font-bold text-center mb-8">Contact Us</h2>
            <form class="bg-white p-8 rounded-lg shadow-md">
                <input type="text" placeholder="Name" class="w-full mb-4 p-3 border rounded">
                <input type="email" placeholder="Email" class="w-full mb-4 p-3 border rounded">
                <textarea placeholder="Message" rows="4" class="w-full mb-4 p-3 border rounded"></textarea>
                <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700">
                    Send Message
                </button>
            </form>
        </div>
    </section>
</body>
</html>`,
      template: true,
      description: 'Main HTML file with Tailwind CSS',
    },
  ],
  
  dependencies: {},
  
  setup: [
    {
      description: 'Open index.html in browser',
      command: 'open index.html',
    },
  ],
  
  config: {
    PROJECT_NAME: 'My Awesome Product',
    HERO_TITLE: 'Welcome to the Future',
    HERO_SUBTITLE: 'Build amazing things with our platform',
  },
};

/**
 * Template: Todo App (Full-Stack)
 */
export const todoAppTemplate: Template = {
  id: 'todo-app-fullstack',
  name: 'Full-Stack Todo App',
  description: 'Complete todo app with React frontend, Express backend, and PostgreSQL database',
  category: 'full-stack',
  tags: ['react', 'express', 'postgresql', 'auth', 'crud'],
  difficulty: 'intermediate',
  estimatedTime: 45,
  
  files: [
    {
      path: 'backend/server.js',
      content: `const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors());
app.use(express.json());

// Get all todos
app.get('/api/todos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM todos ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create todo
app.post('/api/todos', async (req, res) => {
  try {
    const { title, description } = req.body;
    const result = await pool.query(
      'INSERT INTO todos (title, description) VALUES ($1, $2) RETURNING *',
      [title, description]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update todo
app.put('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, completed } = req.body;
    const result = await pool.query(
      'UPDATE todos SET title = $1, description = $2, completed = $3 WHERE id = $4 RETURNING *',
      [title, description, completed, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete todo
app.delete('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM todos WHERE id = $1', [id]);
    res.json({ message: 'Todo deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(\`Server running on port \${port}\`);
});`,
      description: 'Express backend with CRUD endpoints',
    },
    {
      path: 'backend/schema.sql',
      content: `CREATE TABLE IF NOT EXISTS todos (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`,
      description: 'Database schema',
    },
    {
      path: 'frontend/src/App.jsx',
      content: `import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'http://localhost:3000/api';

function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    const response = await fetch(\`\${API_URL}/todos\`);
    const data = await response.json();
    setTodos(data);
  };

  const addTodo = async (e) => {
    e.preventDefault();
    await fetch(\`\${API_URL}/todos\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    });
    setTitle('');
    setDescription('');
    fetchTodos();
  };

  const toggleTodo = async (id, completed) => {
    await fetch(\`\${API_URL}/todos/\${id}\`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !completed }),
    });
    fetchTodos();
  };

  const deleteTodo = async (id) => {
    await fetch(\`\${API_URL}/todos/\${id}\`, { method: 'DELETE' });
    fetchTodos();
  };

  return (
    <div className="App">
      <h1>Todo App</h1>
      
      <form onSubmit={addTodo}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit">Add Todo</button>
      </form>

      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id, todo.completed)}
            />
            <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
              {todo.title}
            </span>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;`,
      description: 'React frontend',
    },
    {
      path: 'frontend/package.json',
      content: `{
  "name": "todo-frontend",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  }
}`,
    },
    {
      path: 'backend/package.json',
      content: `{
  "name": "todo-backend",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "pg": "^8.11.0"
  },
  "scripts": {
    "start": "node server.js"
  }
}`,
    },
  ],
  
  dependencies: {
    npm: ['express', 'cors', 'pg', 'react', 'react-dom'],
  },
  
  setup: [
    {
      description: 'Install backend dependencies',
      command: 'cd backend && npm install',
    },
    {
      description: 'Install frontend dependencies',
      command: 'cd frontend && npm install',
    },
    {
      description: 'Setup database',
      command: 'psql -f backend/schema.sql',
      optional: true,
    },
    {
      description: 'Start backend',
      command: 'cd backend && npm start',
    },
    {
      description: 'Start frontend',
      command: 'cd frontend && npm start',
    },
  ],
  
  config: {
    DATABASE_URL: 'postgresql://localhost/todos',
    PORT: 3000,
  },
  
  envVars: ['DATABASE_URL', 'PORT'],
};

/**
 * Template: REST API
 */
export const restApiTemplate: Template = {
  id: 'rest-api-express',
  name: 'REST API with Express',
  description: 'Production-ready REST API with authentication, validation, and error handling',
  category: 'api',
  tags: ['express', 'rest', 'api', 'auth', 'jwt'],
  difficulty: 'intermediate',
  estimatedTime: 30,
  
  files: [
    {
      path: 'server.js',
      content: `const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware: Authenticate JWT
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Routes
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  // Save user to database
  res.json({ message: 'User registered' });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  // Verify user credentials
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token });
});

app.get('/api/protected', authenticate, (req, res) => {
  res.json({ message: 'Protected data', user: req.user });
});

app.listen(3000, () => console.log('API running on port 3000'));`,
      description: 'Express API with JWT authentication',
    },
  ],
  
  dependencies: {
    npm: ['express', 'jsonwebtoken', 'bcrypt'],
  },
  
  setup: [
    {
      description: 'Install dependencies',
      command: 'npm install',
    },
    {
      description: 'Start server',
      command: 'node server.js',
    },
  ],
  
  config: {
    JWT_SECRET: '{{GENERATE_SECRET}}',
    PORT: 3000,
  },
  
  envVars: ['JWT_SECRET'],
};

/**
 * Template: Blog
 */
export const blogTemplate: Template = {
  id: 'blog-static',
  name: 'Static Blog',
  description: 'Simple static blog with posts, categories, and RSS feed',
  category: 'web-app',
  tags: ['blog', 'html', 'css', 'markdown'],
  difficulty: 'beginner',
  estimatedTime: 20,
  
  files: [
    {
      path: 'index.html',
      content: `<!DOCTYPE html>
<html>
<head>
    <title>{{BLOG_NAME}}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <h1>{{BLOG_NAME}}</h1>
        <p>{{BLOG_TAGLINE}}</p>
    </header>
    <main>
        <article class="post">
            <h2>Welcome to My Blog</h2>
            <p class="meta">Posted on {{DATE}}</p>
            <p>This is your first blog post. Start writing!</p>
        </article>
    </main>
</body>
</html>`,
      template: true,
    },
  ],
  
  dependencies: {},
  setup: [],
  config: {
    BLOG_NAME: 'My Blog',
    BLOG_TAGLINE: 'Thoughts and ideas',
  },
};

/**
 * Template: Dashboard
 */
export const dashboardTemplate: Template = {
  id: 'dashboard-admin',
  name: 'Admin Dashboard',
  description: 'Full-featured admin dashboard with charts, tables, and user management',
  category: 'web-app',
  tags: ['dashboard', 'admin', 'charts', 'react'],
  difficulty: 'advanced',
  estimatedTime: 60,
  
  files: [
    {
      path: 'src/Dashboard.jsx',
      content: `import React from 'react';
import { LineChart, BarChart } from 'recharts';

function Dashboard() {
  return (
    <div className="dashboard">
      <h1>{{DASHBOARD_TITLE}}</h1>
      <div className="stats">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p>1,234</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;`,
      template: true,
    },
  ],
  
  dependencies: {
    npm: ['react', 'recharts', 'react-router-dom'],
  },
  setup: [],
  config: {
    DASHBOARD_TITLE: 'Admin Dashboard',
  },
};

/**
 * Template: E-commerce
 */
export const ecommerceTemplate: Template = {
  id: 'ecommerce-store',
  name: 'E-commerce Store',
  description: 'Complete e-commerce store with products, cart, and checkout',
  category: 'full-stack',
  tags: ['ecommerce', 'shop', 'cart', 'payment'],
  difficulty: 'advanced',
  estimatedTime: 90,
  
  files: [
    {
      path: 'backend/products.js',
      content: `const products = [
  { id: 1, name: 'Product 1', price: 29.99 },
  { id: 2, name: 'Product 2', price: 49.99 },
];

module.exports = { products };`,
    },
  ],
  
  dependencies: {
    npm: ['express', 'stripe', 'react', 'redux'],
  },
  setup: [],
  config: {},
  envVars: ['STRIPE_SECRET_KEY'],
};

/**
 * Template: Chat App
 */
export const chatAppTemplate: Template = {
  id: 'chat-app-realtime',
  name: 'Real-time Chat App',
  description: 'Real-time chat application with Socket.io',
  category: 'full-stack',
  tags: ['chat', 'websocket', 'realtime', 'socketio'],
  difficulty: 'intermediate',
  estimatedTime: 45,
  
  files: [
    {
      path: 'server.js',
      content: `const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', (socket) => {
  console.log('User connected');
  
  socket.on('message', (msg) => {
    io.emit('message', msg);
  });
});

server.listen(3000);`,
    },
  ],
  
  dependencies: {
    npm: ['express', 'socket.io'],
  },
  setup: [],
  config: {},
};

/**
 * Template: GraphQL API
 */
export const graphqlApiTemplate: Template = {
  id: 'graphql-api',
  name: 'GraphQL API',
  description: 'GraphQL API with Apollo Server',
  category: 'api',
  tags: ['graphql', 'apollo', 'api'],
  difficulty: 'intermediate',
  estimatedTime: 40,
  
  files: [
    {
      path: 'server.js',
      content: `const { ApolloServer, gql } = require('apollo-server');

const typeDefs = gql\`
  type Query {
    hello: String
  }
\`;

const resolvers = {
  Query: {
    hello: () => 'Hello world!',
  },
};

const server = new ApolloServer({ typeDefs, resolvers });
server.listen().then(({ url }) => {
  console.log(\`Server ready at \${url}\`);
});`,
    },
  ],
  
  dependencies: {
    npm: ['apollo-server', 'graphql'],
  },
  setup: [],
  config: {},
};

/**
 * Template: Data Analysis
 */
export const dataAnalysisTemplate: Template = {
  id: 'data-analysis-python',
  name: 'Data Analysis Project',
  description: 'Python data analysis project with Jupyter, Pandas, and visualizations',
  category: 'data-processing',
  tags: ['python', 'pandas', 'jupyter', 'analysis'],
  difficulty: 'intermediate',
  estimatedTime: 30,
  
  files: [
    {
      path: 'analysis.py',
      content: `import pandas as pd
import matplotlib.pyplot as plt

# Load data
df = pd.read_csv('data.csv')

# Analyze
print(df.describe())

# Visualize
df.plot()
plt.show()`,
    },
    {
      path: 'requirements.txt',
      content: `pandas
matplotlib
jupyter
seaborn
scipy`,
    },
  ],
  
  dependencies: {
    pip: ['pandas', 'matplotlib', 'jupyter', 'seaborn'],
  },
  setup: [
    {
      description: 'Install dependencies',
      command: 'pip install -r requirements.txt',
    },
    {
      description: 'Start Jupyter',
      command: 'jupyter notebook',
    },
  ],
  config: {},
};

/**
 * Template: Portfolio Website
 */
export const portfolioTemplate: Template = {
  id: 'portfolio-personal',
  name: 'Personal Portfolio',
  description: 'Professional portfolio website with projects and contact form',
  category: 'web-app',
  tags: ['portfolio', 'personal', 'resume'],
  difficulty: 'beginner',
  estimatedTime: 25,
  
  files: [
    {
      path: 'index.html',
      content: `<!DOCTYPE html>
<html>
<head>
    <title>{{NAME}} - Portfolio</title>
</head>
<body>
    <header>
        <h1>{{NAME}}</h1>
        <p>{{TITLE}}</p>
    </header>
    <section id="projects">
        <h2>Projects</h2>
        <!-- Projects here -->
    </section>
    <section id="contact">
        <h2>Contact</h2>
        <p>Email: {{EMAIL}}</p>
    </section>
</body>
</html>`,
      template: true,
    },
  ],
  
  dependencies: {},
  setup: [],
  config: {
    NAME: 'John Doe',
    TITLE: 'Full Stack Developer',
    EMAIL: 'john@example.com',
  },
};

/**
 * All templates
 */
export const templates: Template[] = [
  landingPageTemplate,
  todoAppTemplate,
  restApiTemplate,
  blogTemplate,
  dashboardTemplate,
  ecommerceTemplate,
  chatAppTemplate,
  graphqlApiTemplate,
  dataAnalysisTemplate,
  portfolioTemplate,
];

/**
 * Get template by ID
 */
export function getTemplate(id: string): Template | undefined {
  return templates.find(t => t.id === id);
}

/**
 * Search templates
 */
export function searchTemplates(query: string): Template[] {
  const lowerQuery = query.toLowerCase();
  return templates.filter(t => 
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.includes(lowerQuery))
  );
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: Template['category']): Template[] {
  return templates.filter(t => t.category === category);
}
