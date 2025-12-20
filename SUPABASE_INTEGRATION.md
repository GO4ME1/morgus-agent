# Supabase Integration Guide for Morgus

## Overview
This guide explains how Morgus can help users build full-stack applications with Supabase as the backend database.

## What is Supabase?
- **Open-source Firebase alternative**
- **PostgreSQL database** with realtime subscriptions
- **Built-in authentication** (email, OAuth, magic links)
- **Storage** for files and images
- **Row Level Security (RLS)** for data protection
- **Auto-generated REST and GraphQL APIs**

## Basic Setup Steps

### 1. Create Supabase Project
```bash
# User goes to database.new or supabase.com/dashboard
# Creates new project and gets:
# - Project URL: https://xxxxx.supabase.co
# - Anon/Public Key: eyJhbGciOi...
```

### 2. Create Database Table
```sql
-- Example: Create a todos table
create table todos (
  id bigint primary key generated always as identity,
  task text not null,
  is_complete boolean default false,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table todos enable row level security;

-- Create policy to allow public access (for demo)
create policy "Allow public access"
on public.todos
for all
to anon
using (true);
```

### 3. Frontend Integration (Vanilla JS)
```html
<!DOCTYPE html>
<html>
<head>
  <title>My Supabase App</title>
  <!-- Load Supabase client from CDN -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
  <h1>Todo App</h1>
  <input type="text" id="taskInput" placeholder="New task">
  <button onclick="addTodo()">Add</button>
  <ul id="todoList"></ul>

  <script>
    // Initialize Supabase client
    const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
    const SUPABASE_KEY = 'YOUR-ANON-KEY';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // Fetch todos
    async function fetchTodos() {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error:', error);
        return;
      }
      
      const list = document.getElementById('todoList');
      list.innerHTML = '';
      data.forEach(todo => {
        const li = document.createElement('li');
        li.textContent = todo.task;
        list.appendChild(li);
      });
    }

    // Add todo
    async function addTodo() {
      const input = document.getElementById('taskInput');
      const task = input.value.trim();
      
      if (!task) return;
      
      const { data, error } = await supabase
        .from('todos')
        .insert([{ task }]);
      
      if (error) {
        console.error('Error:', error);
        return;
      }
      
      input.value = '';
      fetchTodos();
    }

    // Load todos on page load
    fetchTodos();
  </script>
</body>
</html>
```

## Authentication Example
```javascript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});

// Get current user
const { data: { user } } = await supabase.auth.getUser();

// Sign out
await supabase.auth.signOut();
```

## Storage Example
```javascript
// Upload file
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('public/avatar1.png', file);

// Get public URL
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl('public/avatar1.png');
```

## How Morgus Should Help Users

### When user asks: "Build me a todo app with database"

**Morgus should:**

1. **Generate the frontend** (HTML/CSS/JS) with Supabase client
2. **Provide SQL commands** for creating tables
3. **Deploy the website** to Cloudflare Pages
4. **Give instructions** for:
   - Creating Supabase project at database.new
   - Running the SQL commands in Supabase SQL Editor
   - Adding their Supabase URL and key to the deployed site

### Example Response Template:
```
I've created your todo app! Here's what you need to do:

1. **Create Supabase Project:**
   - Go to https://database.new
   - Create a new project
   - Wait for it to finish setting up

2. **Set up the database:**
   - Go to SQL Editor in your Supabase dashboard
   - Run this SQL:
   [SQL commands here]

3. **Get your credentials:**
   - Go to Project Settings > API
   - Copy your Project URL and anon/public key

4. **Update the deployed site:**
   - Open the deployed site
   - Replace SUPABASE_URL and SUPABASE_KEY in the code
   - Or I can redeploy with your credentials if you provide them

Your app is deployed at: [URL]
```

## Common Use Cases

### 1. Todo/Task Manager
- Simple CRUD operations
- No auth needed for demo

### 2. Blog/CMS
- Posts table with title, content, author
- Auth for creating/editing posts

### 3. E-commerce Product Catalog
- Products table with name, price, image URL
- Categories and filtering

### 4. User Profiles
- Auth + profiles table
- Avatar upload to Storage

### 5. Real-time Chat
- Messages table with realtime subscriptions
- User presence tracking

## Important Notes

1. **Security**: Always enable Row Level Security (RLS) and create appropriate policies
2. **Free Tier**: Supabase free tier includes:
   - 500MB database space
   - 1GB file storage
   - 50,000 monthly active users
3. **CDN vs NPM**: For simple apps, use CDN. For React/Vue, use npm package
4. **Environment Variables**: Never commit API keys to public repos

## Resources
- Supabase Dashboard: https://supabase.com/dashboard
- Documentation: https://supabase.com/docs
- Quick Start: https://database.new
