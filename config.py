import os
from datetime import datetime

class Config:
    # Flask Configuration
    SECRET_KEY = os.environ.get('FLASK_SECRET_KEY', 'dev_key_change_in_prod')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///ispo.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Network Selection
    NETWORK = os.environ.get("NETWORK", "MAINNET")
    IS_MAINNET = NETWORK == "MAINNET"
    
    # Validator Configuration
    VALIDATOR_ADDRESS = os.environ.get(
        "VALIDATOR_ADDRESS",
        "pbvaloper1lzgdym2g6vhp2w7298hvmcdv6aatxeajrj694m"
    )
    VALIDATOR_NAME = "Rovve ISPO"
    VALIDATOR_DESCRIPTION = "Official Rovve ISPO validator for RV token distribution"
    COMMISSION_RATE = "0.050000000000000000"  # 5% commission
    MINIMUM_DELEGATION = 100  # Minimum HASH tokens required
    MIN_SELF_DELEGATION = "500000000000"  # 500 HASH
    
    # ISPO Configuration
    ISPO_START_DATE = datetime(2025, 1, 15)
    ISPO_END_DATE = datetime(2025, 9, 15)
    ISPO_EARLY_BONUS_END_DATE = datetime(2025, 4, 15)
    TOTAL_RV_ALLOCATION = 0.05  # 5% of total RV supply
    EARLY_BONUS_MULTIPLIER = 1.6  # 60% bonus for first 3 months
    
    # Network Configuration
    CHAIN_ID = "pio-mainnet-1" if IS_MAINNET else "pio-testnet-1"
    RPC_ENDPOINT = f"https://rpc.{'' if IS_MAINNET else 'test.'}provenance.io"
    API_ENDPOINT = f"https://api.{'' if IS_MAINNET else 'test.'}provenance.io"
    LCD_ENDPOINT = f"{API_ENDPOINT}/v1"
    EXPLORER_URL = "https://explorer.provenance.io"
    
    # Validator Security Configuration
    OPERATOR_KEY_ENV = "VALIDATOR_OPERATOR_KEY"
    BACKUP_INTERVAL = 3600  # Backup every hour
    MAX_MISSED_BLOCKS = 10  # Maximum missed blocks before alert
    
    # Monitoring Configuration
    HEALTH_CHECK_INTERVAL = 60  # seconds
    MISSED_BLOCKS_THRESHOLD = 10
    SYNC_TOLERANCE_BLOCKS = 5
    ALERT_WEBHOOK_URL = os.environ.get("ALERT_WEBHOOK_URL")
    
    # Reward Distribution
    BASE_REWARD_RATE = 0.10  # 10% annual distribution rate
    MAX_DURATION_BONUS = 1.5  # 50% bonus for 6-month stake
    REFERRAL_BONUS = 0.05  # 5% referral bonus
