from pydantic_settings import BaseSettings
from sqlalchemy import URL


class Settings(BaseSettings):
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "aitrainer"
    db_user: str = "aitrainer"
    db_password: str = "aitrainer_local"
    agent_url: str = "http://localhost:8001"
    cors_origins: list[str] = ["http://localhost:8081"]

    @property
    def database_url(self) -> URL:
        return URL.create(
            "postgresql+psycopg", username=self.db_user,
            password=self.db_password, host=self.db_host,
            port=self.db_port, database=self.db_name,
        )


settings = Settings()
