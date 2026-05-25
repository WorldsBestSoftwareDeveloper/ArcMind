from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    arc_rpc_url: str = "https://rpc.testnet.arc.network"
    arcmind_vault_address: str | None = None
    copy_vault_address: str | None = None
    usdc_address: str | None = None
    agent_private_key: str | None = None
    anthropic_api_key: str | None = None
    groq_api_key: str | None = None
    ai_provider: str = "deterministic"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,http://localhost:3002,http://127.0.0.1:3002"
    database_path: str = "arcmind.db"
    hyperliquid_network: str = "testnet"
    hyperliquid_data_network: str = "mainnet"
    hyperliquid_execution_network: str = "testnet"
    hyperliquid_dry_run: bool = True
    hyperliquid_leader_addresses: str = ""
    agent_scheduler_enabled: bool = False
    agent_scheduler_interval_seconds: int = 21_600
    apify_token: str | None = None
    apify_actor_id: str = "saswave/hyperliquid-leaderboard-vaults-scraper"
    apify_leaderboard_limit: int = 25
    apify_cache_ttl_seconds: int = 1800
    arcmind_vault_deploy_block: int = 43_741_668
    arc_log_chunk_size: int = 2_000

    @property
    def vault_address(self) -> str | None:
        return self.arcmind_vault_address or self.copy_vault_address

    @property
    def leader_address_list(self) -> list[str]:
        return [address.strip() for address in self.hyperliquid_leader_addresses.split(",") if address.strip()]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
