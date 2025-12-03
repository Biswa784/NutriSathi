# FastAPI SQLite Alembic

This project is a FastAPI application that uses SQLite as the database and Alembic for database migrations. It provides a simple structure for building RESTful APIs with SQLAlchemy ORM.

## Project Structure

```
fastapi-sqlite-alembic
├── app
│   ├── main.py                # Entry point of the FastAPI application
│   ├── api
│   │   └── v1
│   │       ├── __init__.py    # API versioning initialization
│   │       └── endpoints.py    # API endpoints definition
│   ├── core
│   │   └── config.py          # Configuration settings
│   ├── db
│   │   ├── base.py            # SQLAlchemy base class
│   │   ├── models.py          # SQLAlchemy models
│   │   └── session.py         # Database session management
│   ├── crud
│   │   └── crud_items.py      # CRUD operations for items
│   ├── schemas
│   │   └── item.py            # Pydantic schemas for item data
│   └── deps.py                # Dependency injection functions
├── alembic
│   ├── env.py                 # Alembic environment script
│   ├── script.py.mako         # Migration script template
│   └── versions
│       └── .gitkeep           # Keep versions directory in version control
├── alembic.ini                # Alembic configuration file
├── requirements.txt           # Project dependencies
├── .env.example               # Example environment variables
└── README.md                  # Project documentation
```

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd fastapi-sqlite-alembic
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up the database:**
   - Configure your database connection in `app/core/config.py`.
   - Run Alembic migrations to set up the database schema:
     ```bash
     alembic upgrade head
     ```

5. **Run the application:**
   ```bash
   uvicorn app.main:app --reload
   ```

## Usage

- Access the API at `http://127.0.0.1:8000`.
- API documentation is available at `http://127.0.0.1:8000/docs`.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.