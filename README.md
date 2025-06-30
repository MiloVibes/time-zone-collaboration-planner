# SyncUp: The Time Zone Collaboration Planner

SyncUp is a full-stack web application designed to simplify the process of scheduling meetings for teams distributed across different time zones. It provides a user-friendly interface to manage user profiles, set personal working hours, and intelligently schedule meetings by finding optimal overlapping times for all participants.

## Screenshots

**Dashboard:** An overview of upcoming meetings and the user's local time.
![Dashboard](https://i.imgur.com/x0j3BfG.png)

**Meetings Page:** A full calendar view of all scheduled events.
![Meetings Page](https://i.imgur.com/z0j3BfG.png)

**Settings Page:** Allows users to customize their profile, timezone, and working hours.
![Settings Page](https://i.imgur.com/y0j3BfG.png)

## Features

* **User Authentication:** Secure user registration and login system. User sessions are persisted for a seamless experience.
* **Personalized Dashboard:** A dynamic dashboard that welcomes the user, displays their local time (based on their chosen timezone), and shows a list of their next 5 upcoming meetings.
* **Interactive Meeting Calendar:** A full-page calendar that displays all of a user's scheduled meetings.
* **Intelligent Meeting Creation:**
    * Schedule meetings for just yourself with a manual time picker.
    * Invite multiple registered users to a meeting.
    * Receive **optimal time suggestions** based on the availability and personalized working hours of all invitees.
* **Meeting Deletion:** Users can delete meetings they own directly from the calendar with a confirmation prompt.
* **Customizable User Profiles:** Users can update their username and set their local timezone and daily working hours (e.g., 9 AM - 5 PM) to improve the accuracy of scheduling suggestions.

## Technology Stack

The project is a modern full-stack application utilizing the following technologies:

* **Frontend:**
    * **Framework:** React
    * **Routing:** `react-router-dom`
    * **State Management:** React Context API for authentication state.
    * **HTTP Client:** `axios` (configured with a proxy for development)
    * **Calendar:** `react-big-calendar`
    * **Date/Time:** `date-fns` and `date-fns-tz`

* **Backend:**
    * **Framework:** Flask (Python)
    * **Database:** SQLAlchemy ORM with SQLite for simplicity.
    * **Migrations:** `Flask-Migrate` for managing database schema changes.
    * **Authentication:** `Flask-Login` for session management and `Flask-Bcrypt` for password hashing.
    * **Timezones:** `pytz`

## Getting Started

Follow these instructions to get a local copy of the project up and running.

### Prerequisites

* Python 3.8+
* Node.js and npm
* `pip` for Python package installation

### Installation & Setup

1.  **Clone the Repository**
    ```sh
    git clone <your-repository-url>
    cd time-zone-collaboration-planner
    ```

2.  **Backend Setup**
    * Navigate to the backend directory and install the required Python packages.
        ```sh
        cd backend
        pip install -r requirements.txt
        ```
    * Initialize and set up the database. This only needs to be done once.
        ```sh
        # Make sure you are in the 'backend' directory
        export FLASK_APP=app.py # On Windows, use 'set FLASK_APP=app.py'
        flask db init
        flask db migrate -m "Initial database setup"
        flask db upgrade
        ```

3.  **Frontend Setup**
    * Navigate to the frontend directory and install the required Node modules.
        ```sh
        cd ../frontend
        npm install
        ```

### Running the Application

The application requires both the backend and frontend servers to be running concurrently.

1.  **Start the Backend Server**
    * In a terminal, navigate to the `backend` directory and run:
        ```sh
        python3 app.py
        ```
    * The backend will be running on `http://127.0.0.1:5000`.

2.  **Start the Frontend Server**
    * In a **new, separate terminal**, navigate to the `frontend` directory and run:
        ```sh
        npm start
        ```
    * The frontend development server will open automatically in your browser at `http://localhost:3001`.

The application is now running! You can register a new user account and begin using the features.

## Project Evolution & Development Process

This project was built iteratively, starting with a simple concept and progressively adding layers of complexity to become a full-fledged application.

1.  **Initial Concept:** The project began as a basic, client-side-only time zone converter.
2.  **Introducing a Backend:** We quickly realized the need for more complex logic and data persistence. A Python Flask backend was introduced, along with a SQLite database managed by SQLAlchemy.
3.  **User Authentication:** A full authentication system was implemented using Flask-Login, allowing for user registration, login, and secure profiles. This was a critical step to personalize the user experience.
4.  **Core Features (Meetings & Settings):** The main features were then built out: an interactive calendar using `react-big-calendar`, a modal for creating meetings, and a settings page for profile customization. The "optimal time suggestion" algorithm was a key feature added to the backend.
5.  **Debugging & Refinement (The CORS Challenge):** A significant development challenge was handling Cross-Origin Resource Sharing (CORS) errors between the frontend (`localhost:3001`) and backend (`127.0.0.1:5000`). After several attempts to configure the `Flask-Cors` library, the most robust and stable solution was to implement a **proxy** in the React development server. By adding `"proxy": "http://127.0.0.1:5000"` to `package.json`, all frontend API calls are now channeled through the same origin, completely eliminating CORS issues during development.
6.  **UI/UX Improvements:** The final stages involved refining the user experience by fixing layout bugs, improving button functionality, and ensuring a more intuitive workflow for creating and deleting meetings.

## Future Work & Areas for Improvement

This project has a solid foundation, but there are many exciting features that could be added:

* **Real-time Whiteboard/Chat:** Integrate `Socket.IO` to allow for a real-time collaborative whiteboard or chat within a meeting view.
* **Document Sharing:** Add functionality to upload and share documents (PDFs, images) associated with a specific meeting.
* **Direct Calendar Integration:** Implement OAuth2 flows to allow users to connect their Google Calendar or Outlook Calendar to automatically sync meetings.
* **Enhanced Notifications:** Move from `window.alert()` to a more professional toast notification system (e.g., `react-toastify`) for a better user experience.
* **Recurring Meetings:** Add the ability to schedule meetings that repeat daily, weekly, or monthly.
* **Containerization:** Create `Dockerfile` and `docker-compose.yml` files to containerize the frontend and backend for easier deployment and environment consistency.
