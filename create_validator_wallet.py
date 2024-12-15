import logging
import os
from datetime import datetime
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
import base64
import json

# Set up logging with more details
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_new_validator_wallet():
    """Create a new validator wallet and save credentials securely"""
    try:
        # Step 1: Generate the ECDSA private key
        logger.info("Step 1: Generating secure private key...")
        private_key = ec.generate_private_key(ec.SECP256K1())
        
        # Step 2: Get the public key
        logger.info("Step 2: Deriving public key...")
        public_key = private_key.public_key()
        
        # Step 3: Generate validator address
        logger.info("Step 3: Creating validator address...")
        # Get DER encoded public key
        public_bytes = public_key.public_bytes(
            encoding=serialization.Encoding.DER,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        
        # Hash using SHA256
        digest = hashes.Hash(hashes.SHA256())
        digest.update(public_bytes)
        hashed = digest.finalize()
        
        # Take first 20 bytes and encode in base32
        address_bytes = hashed[:20]
        address = base64.b32encode(address_bytes).decode('utf-8').lower()
        validator_address = f"pbvaloper{address}"
        
        logger.info("Step 4: Serializing keys...")
        # Serialize private key (PEM format)
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode('utf-8')
        
        # Serialize public key (PEM format)
        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode('utf-8')
        
        # Step 5: Save the keys securely
        logger.info("Step 5: Saving credentials...")
        os.makedirs('secure_credentials', exist_ok=True)
        
        # Save private key
        private_key_file = 'secure_credentials/validator_private_key.pem'
        with open(private_key_file, 'w') as f:
            f.write(private_pem)
        
        # Save public information
        public_info = {
            'public_key': public_pem,
            'validator_address': validator_address,
            'created_at': datetime.utcnow().isoformat()
        }
        
        public_info_file = 'secure_credentials/validator_public_info.json'
        with open(public_info_file, 'w') as f:
            json.dump(public_info, f, indent=2)
        
        # Print success message with clear next steps
        print(f"""
=== Validator Wallet Created Successfully! ===

Your Validator Address: {validator_address}

What this means:
- This is your unique validator identity on the Provenance blockchain
- You'll use this address when setting up your validator node
- Others will use this address to delegate HASH tokens to you

Files Created:
1. Private Key: {private_key_file}
   - This is like your validator's password - keep it super secure!
   - Never share this with anyone
   - Back it up somewhere safe

2. Public Info: {public_info_file}
   - Contains your validator's public address
   - Safe to share with others

Next Steps:
1. First, back up your private key file somewhere secure
2. You'll need to fund this address with 500 HASH (minimum required stake)
3. Once funded, we'll help you set up the validator node

Need help? Just ask and I'll explain any part in more detail!
""")
        return True
        
    except Exception as e:
        logger.error(f"Error creating validator wallet: {str(e)}")
        print("\nOops! Something went wrong while creating your validator wallet.")
        print(f"Error: {str(e)}")
        print("\nDon't worry! Let's try again. The error has been logged for debugging.")
        return False

if __name__ == "__main__":
    create_new_validator_wallet()
