import os

class Config:
    SECRET_KEY = os.environ.get('FLASK_SECRET_KEY', 'dev_key_change_in_prod')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///ispo.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Validator Configuration
    VALIDATOR_NAME = "Rovve ISPO"
    VALIDATOR_DESCRIPTION = "Official Rovve ISPO validator for RV token distribution"
    MINIMUM_DELEGATION = 100  # Minimum HASH tokens required
    ISPO_START_DATE = "2024-03-01"
    ISPO_END_DATE = "2024-09-01"
    
    # AWS Configuration
    AWS_REGION = os.environ.get('AWS_REGION', 'us-west-2')
    NITRO_ENCLAVE_ID = os.environ.get('NITRO_ENCLAVE_ID')
    
    # Provenance Configuration
    CHAIN_ID = "pio-mainnet-1"
    RPC_ENDPOINT = os.environ.get('RPC_ENDPOINT', 'https://rpc.provenance.io')
    API_ENDPOINT = os.environ.get('API_ENDPOINT', 'https://api.provenance.io')
