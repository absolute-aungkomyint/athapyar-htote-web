# {{AthaPyar Htote Web}} - Proprosal by @absolute-aungkomyint

## Gist
- Personal Budget Management Web Application (Offline-First)

## Story
- People keep losing traces of their financial progress.   
- Hate Spreadsheets.    
- Another Variant for Financial Management.   
- Fast and low weight.   
- Easy interface rather than massive tables and column views.   
- Run on local device with no-internet

## Why   
- It empowers users to take control of their finances without the overhead of complex accounting software.   
- Financial clarity improves as tracking becomes a frictionless habit rather than a chore.   
- It removes the "spreadsheet fatigue" and the anxiety of data privacy by keeping everything offline and local.   
   
   
## Why Not   
- We are not building a multi-user collaborative platform or a cloud-synced service.   
- We are not building a full-fledged accounting suite with tax filing or business payroll features.


## Tech Spec
- Architecture: Client-side, Single-Page Application (SPA) without Internet
- Frontend Stack:
  - Structure: HTML5 (Well Organized with Semantic Tags)
  - Styling: Tailwind CSS (Using CDN, Creating clean and tidy UI/Dashboard)
  - Logic: Vanilla JavaScript (ES6+)
- Storage System (local-First):
  - Use Browser's localStroage API
  - Store data as JSON Format in local Machine
- Main Pieces:
  1. Frictionless Entry Form: able to record amount, category and notes in seconds
  2. Live Dashboard Card: Dyanmic Calculation of Total Balance, Income, Outcome, Debts and Budget Goals
  3. Visual Insights: Generate charts using Chart.js (or) ApexCharts (Lightweight JS library)

## Features
## Features Based on Main Purpose   
### 1. Record Income   
- The practice of recording all money received (salary, freelance, investments, gifts) to know exactly how much is available to spend or save.   
   
### 2. Expense Tracking and Categorization   
-  The act of recording every expense and assigning a specific spending limit to each expense category based on income, priorities, and financial goals, creating a roadmap for every kyats.   
   
### 3. Budget Management   
- The act of assigning a specific spending limit to each expense category based on income, priorities, and financial goals, creating a roadmap for every dollar.   
   
### 4. Debt Management   
- The strategy for handling existing debt (credit cards, loans, mortgages) through prioritization, consolidation, and accelerated repayment plans to minimize interest and become debt-free.   
   
### 5. Financial Goal   
- The definition of short-term, medium-term, and long-term financial objectives (vacation, car, house, retirement) that give purpose and direction to the budgeting effort.   
   
### 6. Financial Report generation   
- The periodic calculation of total assets minus total liabilities to measure overall financial health and progress toward long-term wealth-building goals.   
   
   
## Additional Features   
### 1. Myanmar Language Support   
- This app is going to be built for Myanmar citizens. So App must be available in both Myanmar and Eng languages.   
   
### 2. Exchangeable currencies   
- Many of Myanmar Citizens are on aboard for various reasons. Thus, they are using more than one currencies. The app must be able to calculate the exchange rate.   


## Definition of Done
- [] Build basic Dashboard UI Layout using HTML/Tailwind CSS
- [] Store Data, implement logic using localStorage
- [] Make it Dynamic using DOM Manipulation
- [] Presenting Visuals with charts and Graphs
- [] Myanmar Language Support
- [] Support Different Currencies (Myanmar:Kyat, USA:USD, Singapore: SGD, Thainland: Bath, China: Yuan)
- [] Work withou Internet