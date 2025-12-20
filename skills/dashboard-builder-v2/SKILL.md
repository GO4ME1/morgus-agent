# Morgus Skill: Dashboard & Visualization Builder v2.0

## Description

This skill enables Morgus to create **interactive dashboards and data visualizations** from various data sources. Users can upload data, connect to databases, or provide data in the prompt, and Morgus will generate a rich, interactive dashboard with charts, graphs, and tables.

## Core Principles

- **Data to Insights**: Transform raw data into actionable insights through visualization.
- **Interactivity is Key**: Users can filter, sort, and drill down into the data.
- **Customizable**: Dashboards are tailored to the user's specific needs and questions.
- **Multiple Data Sources**: Supports CSV, Excel, JSON, databases, and direct data input.

## Step-by-Step Workflow

1.  **Understand the Data**: Morgus analyzes the data source to understand its structure, columns, and data types.
2.  **Identify Key Metrics**: Morgus works with the user to identify the key metrics and KPIs to visualize.
3.  **Choose the Right Visualizations**: Morgus selects the best chart types (bar, line, pie, scatter, etc.) to represent the data.
4.  **Design the Dashboard Layout**: Morgus designs a clean, intuitive layout for the dashboard.
5.  **Generate the Code**: Morgus writes the code for the dashboard using libraries like Chart.js, D3.js, or Plotly.
6.  **Render the Dashboard**: The interactive dashboard is rendered in a sandboxed environment.

## Key Capabilities & Use Cases

| Capability | Description | Example Use Cases |
|---|---|---|
| **Business Intelligence** | Create dashboards for tracking business metrics | - "Build a sales dashboard for my Shopify store"
- "Visualize my website traffic from Google Analytics"
- "Create a KPI dashboard for my marketing campaign" |
| **Financial Analysis** | Analyze financial data and create reports | - "Visualize my stock portfolio performance"
- "Create a personal finance dashboard from my bank statements"
- "Build a financial model for my startup" |
| **Project Management** | Track project progress with Gantt charts and burndown charts | - "Create a Gantt chart for my project plan"
- "Build a dashboard to track my team's progress"
- "Visualize the dependencies in my project" |
| **Scientific Visualization** | Plot scientific data and create interactive simulations | - "Plot the results of my experiment"
- "Create an interactive map of climate change data"
- "Visualize a protein structure" |
| **Social Media Analytics** | Track social media engagement and performance | - "Visualize my Twitter follower growth"
- "Create a dashboard to track my brand mentions"
- "Analyze the sentiment of my social media comments" |

## Technical Implementation

- **Data Processing**: Pandas, NumPy
- **Charting Libraries**: Chart.js, D3.js, Plotly, Highcharts
- **Frontend**: HTML, CSS, JavaScript (React or Vue for complex dashboards)
- **Backend**: Morgus's agentic coding and data analysis capabilities

## Keyword Triggers

- "create a dashboard..."
- "visualize this data..."
- "build a chart of..."
- "plot these numbers..."
- "make a graph of..."
- "show me a dashboard for..."
- "analyze my data..."
