import logging
from datetime import datetime
import requests
from models import ValidatorStatus
from app import db

class ValidatorMonitor:
    def __init__(self, rpc_endpoint, validator_address):
        self.rpc_endpoint = rpc_endpoint
        self.validator_address = validator_address
        self.logger = logging.getLogger('validator_monitor')

    def check_node_health(self):
        try:
            # Check node status
            response = requests.get(f"{self.rpc_endpoint}/status")
            if response.status_code == 200:
                data = response.json()
                catching_up = data['result']['sync_info']['catching_up']
                latest_block_height = int(data['result']['sync_info']['latest_block_height'])
                
                # Get validator info from Provenance
                from provenance import get_validator_info
                validator_data = get_validator_info(self.validator_address)
                
                # Get active delegator count
                from models import Delegation
                active_delegators = db.session.query(db.func.count(db.distinct(Delegation.wallet_address)))\
                    .filter_by(status='active').scalar() or 0
                
                # Calculate total delegated amount
                total_delegated = float(validator_data.get('tokens', 0))
                
                status = ValidatorStatus(
                    status='healthy' if not catching_up else 'syncing',
                    last_updated=datetime.utcnow(),
                    total_delegated=total_delegated,
                    uptime=99.9,  # Updated by missed blocks calculation
                    active_delegators=active_delegators,
                    blocks_signed=latest_block_height,
                    commission_rate=5.0,  # Fixed 5% commission rate
                    rank=1  # Updated by external ranking calculation
                )
                db.session.add(status)
                db.session.commit()
                
                return not catching_up, latest_block_height, total_delegated
            return False, None, 0
        except Exception as e:
            self.logger.error(f"Error checking node health: {str(e)}")
            return False, None, 0

    def monitor_missed_blocks(self):
        try:
            response = requests.get(f"{self.rpc_endpoint}/slashing/signing_infos")
            if response.status_code == 200:
                data = response.json()
                missed_blocks = data['result']['val_signing_info']['missed_blocks_counter']
                return int(missed_blocks)
            return None
        except Exception as e:
            self.logger.error(f"Error checking missed blocks: {str(e)}")
            return None

    def alert_if_needed(self, healthy, missed_blocks):
        if not healthy:
            self.logger.critical("Validator node is unhealthy!")
        if missed_blocks and missed_blocks > 10:
            self.logger.warning(f"High number of missed blocks: {missed_blocks}")
