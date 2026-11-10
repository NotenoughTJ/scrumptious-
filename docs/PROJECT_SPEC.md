# Restaurant Simulation App — Project Specification

## Project Context

This project is the Team 4 senior capstone project for LSU ISDS 4125: Analysis and Design of Information Systems.

Team members:
- Kylie LaCaze
- Sarah Reid
- Kalynn Loftis
- Tahj Foster
- Cole Jacobs

The product is a web application that modernizes the existing restaurant simulation workflow while preserving the existing FORTRAN simulation engine.

The application is a front end and workflow layer around the legacy simulation. It does not recreate or replace the FORTRAN simulation calculations.

---

## Core System Workflow

The application follows this workflow:

Student enters restaurant decisions  
→ application validates and stores the decisions  
→ application generates the legacy RFI input files  
→ professor downloads/transfers the RFI files  
→ professor manually runs the existing FORTRAN simulation  
→ FORTRAN produces FR.LST  
→ professor imports FR.LST into the application  
→ application parses and stores the relevant results  
→ students view the results through the application

The FORTRAN simulation remains external to the application and is the authoritative source for simulation calculations.

---

## User Roles

The application has two primary user roles:

### Student

Students should be able to:

- sign in as a student
- access their assigned team
- enter restaurant decisions for the current simulation round
- receive validation feedback for missing or invalid information
- review their completed decisions
- submit decisions for the round
- view results from completed rounds
- review financial and operating performance
- review menu-item performance
- compare current results with previous rounds

Students should not have access to professor simulation-processing controls.

### Professor

Professors should be able to:

- sign in as a professor
- view student team submission status
- review submitted team decisions
- manage simulation rounds
- generate/download the required legacy RFI input files
- manually transfer those files into the existing FORTRAN workflow
- import the resulting FR.LST file
- receive confirmation or errors from the FR.LST import
- review imported results
- make completed results available to students

---

## Application Areas

The planned application contains the following major areas:

### Shared
- sign-in
- role-based access
- navigation
- shared design system
- application database

### Student Experience
- home
- decisions
- review
- results

### Professor Experience
- home/dashboard
- team submission status
- round management
- RFI generation/download
- FR.LST import
- results review

---

## Data Model

The Milestone 2 relational schema is the starting data model for implementation.

Primary entities currently include:

- User
- Team
- TeamDecision
- MenuItem
- MenuItemDecision
- TeamMetrics

Important relationships include:

- students belong to a team
- professors do not belong to student teams
- decisions are associated with a team and simulation round
- menu decisions are associated with a team, round, and menu item
- results are associated with a team and round
- Team.FirmNumber connects application teams to the firm identifiers used by the legacy simulation

The implementation should remain consistent with the approved schema unless the team identifies a necessary change during development.

Any schema change should be discussed with the team before dependent features are changed.

---

## Legacy Integration

### RFI Input

The application must convert submitted student decisions into the format required by the existing legacy simulation.

The generated files must preserve the required:

- values
- field ordering
- spacing
- formatting
- naming conventions

Generated RFI files should be tested against the supplied example files.

### FORTRAN

The FORTRAN simulation remains external and unchanged.

The application must not recreate simulation calculations or business logic performed by FORTRAN.

The professor manually runs the existing simulation using the generated RFI files.

### FR.LST Output

FR.LST is the simulation output returned from the existing FORTRAN system.

The application will:

- accept an FR.LST import
- parse the required result values
- associate results with the correct team and round
- store structured results
- display those results through the application

---

## Results

The results experience should support the project goal of improving how students understand simulation performance.

Results may include:

- food sales
- beverage sales
- food cost
- beverage cost
- operating profit
- net income or loss
- food orders
- average daily customer count
- menu-item performance
- previous-round comparisons

The application presents these values. It does not independently calculate the simulation outcomes.

---

## Design System

The implementation should follow the Milestone 2 design system.

### Colors

- Primary gold: `#E0A94F`
- Background white: `#FFFFFF`
- Deep green text/accent: `#1F3A2A`
- Light orange cards: `#FCEDE4`
- Soft orange alerts: `#D98B62`

Optional dark mode:

- Background: `#161616`
- Cards: `#242424`
- Gold remains the primary accent

### Typography

- Bricolage Grotesque for headings and key numbers
- Hanken Grotesk for body text, forms, labels, and tables
- Arial may be used as a fallback

### Primary Device

The application should be designed primarily for laptop/desktop use because users complete detailed decision forms and review data tables.

The application should still be responsive for tablets and phones, but it is not being designed as a mobile-first product.

---

## Implementation Principles

This is a five-person senior Information Systems capstone project.

The implementation should:

- remain understandable to the entire team
- favor clear and maintainable solutions over unnecessary technical complexity
- follow the existing project scope
- preserve the approved architecture
- avoid adding features that are not supported by the project requirements
- allow team members to work collaboratively across feature areas
- use Git branches and pull requests for integration

Do not introduce enterprise-level architecture or additional infrastructure unless it is required for the application to function.

---

## Git Collaboration

`main` represents the current integrated version of the application.

Team members should create working branches from the latest version of `main`.

Suggested branch format:

`firstname/feature-or-area`

Examples:

- `kylie/results-dashboard`
- `sarah/student-decisions`
- `kalynn/database`
- `tahj/rfi-generator`
- `cole/frlst-import`

Feature ownership represents primary responsibility, not exclusive ownership. Team members may collaborate across features.

Working changes should be reviewed before being merged into `main`.

---

## Current Development Stage

The team is currently transitioning from Milestone 2 design documentation into implementation.

A shared application foundation should be agreed upon before the major feature branches begin development.

Once the common foundation is merged into `main`, all feature work should begin from that shared version.

Do not create a competing application foundation if another team member is already responsible for establishing the agreed shared starting point.

---

## Important Scope Rule

Before generating or modifying code, confirm that the proposed change fits this specification.

Do not:

- redesign the system without team agreement
- replace the FORTRAN simulation
- calculate simulation outcomes inside the web application
- create functionality outside the established Student and Professor workflows
- change shared data structures without considering dependent features

When something is uncertain, preserve the existing project design and flag the question for the team rather than inventing a new requirement.