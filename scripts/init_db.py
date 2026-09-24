from app.db.database import create_tables


if __name__ == "__main__":

    print("Creating CityPulse database tables...")

    create_tables()

    print("Database tables created successfully.")