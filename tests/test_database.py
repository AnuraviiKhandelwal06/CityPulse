def test_database_imports():

    from app.db.database import Base

    assert Base is not None