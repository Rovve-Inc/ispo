import logging
from datetime import datetime
import requests
from models import ValidatorStatus
from app import db

class ValidatorMonitor:
    def __init__(self, rpc_endpoint):
        self.rpc_endpoint = rpc_endpoint
        self.logger = logging.getLogger('validator_monitor')

    def check_node_health(self):
        try:
            response = requests.get(f"{self.rpc_endpoint}/status")
            if response.status_code == 200:
                data = response.json()
                catching_up = data['result']['sync_info']['catching_up']
                latest_block_height = int(data['result']['sync_info']['latest_block_height'])
                
                status = ValidatorStatus(
                    status='healthy' if not catching_up else 'syncing',
                    last_updated=datetime.utcnow()
                )
                db.session.add(status)
                db.session.commit()
                
                return not catching_up, latest_block_height
            return False, None
        except Exception as e:
            self.logger.error(f"Error checking node health: {str(e)}")
            return False, None

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