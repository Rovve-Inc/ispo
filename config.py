import os

class Config:
    SECRET_KEY = os.environ.get('FLASK_SECRET_KEY', 'dev_key_change_in_prod')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///ispo.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Validator Configuration
    VALIDATOR_ADDRESS = "pbvaloper1lzgdym2g6vhp2w7298hvmcdv6aatxeajrj694m"  # Test validator
    VALIDATOR_NAME = "Rovve ISPO"
    VALIDATOR_DESCRIPTION = "Official Rovve ISPO validator for RV token distribution"
    MINIMUM_DELEGATION = 100  # Minimum HASH tokens required
    ISPO_START_DATE = "2025-01-15"  # Updated dates from requirements
    ISPO_END_DATE = "2025-09-15"
    
    # Provenance Configuration
    CHAIN_ID = "pio-mainnet-1"
    RPC_ENDPOINT = "https://rpc.provenance.io"
    REST_ENDPOINT = "https://api.provenance.io"
    LCD_ENDPOINT = "https://api.provenance.io"  # Needed for delegation queries
    EXPLORER_URL = "https://explorer.provenance.io"
    
    # Test Validator Configuration
    VALIDATOR_ADDRESS = "pbvaloper1lzgdym2g6vhp2w7298hvmcdv6aatxeajrj694m"
    VALIDATOR_MONIKER = "Rovve ISPO"
