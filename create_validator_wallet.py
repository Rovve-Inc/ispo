import logging
from validator import ValidatorKeyManager
import json
import os

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_new_validator_wallet():
    """Create a new validator wallet and save credentials securely"""
    try:
        # Initialize the validator key manager
        key_manager = ValidatorKeyManager()
        
        # Generate new wallet
        logger.info("Generating new validator wallet...")
        wallet_info = key_manager.generate_validator_wallet()
        
        # Create secure storage directory if it doesn't exist
        os.makedirs('secure_credentials', exist_ok=True)
        
        # Save private key separately in a secure file
        private_key_file = 'secure_credentials/validator_private_key.pem'
        with open(private_key_file, 'w') as f:
            f.write(wallet_info['private_key'])
        
        # Save public information
        public_info = {
            'public_key': wallet_info['public_key'],
            'validator_address': wallet_info['address'],
            'created_at': wallet_info['created_at']
        }
        
        public_info_file = 'secure_credentials/validator_public_info.json'
        with open(public_info_file, 'w') as f:
            json.dump(public_info, f, indent=2)
        
        logger.info(f"""
Validator wallet created successfully!

Your validator address is: {wallet_info['address']}

IMPORTANT: Your private key has been saved to {private_key_file}
KEEP THIS FILE SECURE AND BACKUP IT SAFELY!

Public information has been saved to {public_info_file}

Next steps:
1. Secure your private key file
2. Fund your validator address with the minimum required HASH tokens (500 HASH)
3. Register your validator on the Provenance network
""")
        
        return True
        
    except Exception as e:
        logger.error(f"Error creating validator wallet: {str(e)}")
        return False

if __name__ == "__main__":
    create_new_validator_wallet()
