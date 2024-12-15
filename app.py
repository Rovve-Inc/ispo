import os
import requests
from flask import Flask, render_template, jsonify
import logging
from datetime import datetime

from db import db
from models import Delegation, ValidatorStatus

# Set up detailed logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Create the app
app = Flask(__name__)

# Import and load configuration
from config import Config
app.config.from_object(Config)

# Additional database configuration
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

# Initialize the app with the extension
db.init_app(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/delegate')
def delegate():
    return render_template('delegate.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/delegations')
def delegations():
    return render_template('delegations.html')

@app.route('/api/validator/stats')
def get_validator_stats():
    try:
        # Get validator status
        validator = ValidatorStatus.query.order_by(ValidatorStatus.last_updated.desc()).first()
        
        # Calculate days until end
        end_date = datetime.strptime('2025-09-15', '%Y-%m-%d')
        days_remaining = (end_date - datetime.utcnow()).days
        
        # Get total participants (unique delegators)
        total_participants = db.session.query(Delegation.wallet_address.distinct()).count()
        
        return jsonify({
            'total_delegated': float(validator.total_delegated) if validator else 0,
            'total_participants': total_participants,
            'days_remaining': max(0, days_remaining),
            'validator_status': validator.status if validator else 'unknown'
        })
    except Exception as e:
        logging.error(f"Error fetching validator stats: {str(e)}")
        return jsonify({'error': 'Failed to fetch validator statistics'}), 500

@app.route('/api/delegations/<wallet_address>')
def get_delegations(wallet_address):
    try:
        # Query Provenance API for delegations
        validator_address = app.config['VALIDATOR_ADDRESS']
        api_url = f"{app.config['REST_ENDPOINT']}/cosmos/staking/v1beta1/delegators/{wallet_address}/delegations"
        
        logger.debug(f"Querying Provenance API: {api_url}")
        response = requests.get(api_url, timeout=10)
        
        if response.status_code != 200:
            logger.error(f"API request failed with status {response.status_code}: {response.text}")
            return jsonify({'error': 'Failed to fetch delegation data from Provenance'}), 500
            
        data = response.json()
        logger.debug(f"Received delegation data: {data}")
        
        delegations = []
        total_delegated = 0
        
        # Process each delegation
        for delegation in data.get('delegation_responses', []):
            if delegation['delegation']['validator_address'] == validator_address:
                amount = float(delegation['balance']['amount']) / 1e6  # Convert from uHash to HASH
                
                delegations.append({
                    'timestamp': datetime.utcnow().isoformat(),
                    'amount': amount,
                    'tx_hash': delegation.get('tx_hash'),
                    'status': 'active'
                })
                total_delegated += amount
        
        logger.debug(f"Processed delegations: {delegations}")
        return jsonify({
            'totalDelegated': total_delegated,
            'delegationHistory': delegations
        })
        
    except requests.RequestException as e:
        logger.error(f"Network error fetching delegations for {wallet_address}: {str(e)}")
        return jsonify({'error': 'Network error while fetching delegation data'}), 500
    except Exception as e:
        logger.error(f"Error processing delegations for {wallet_address}: {str(e)}")
        return jsonify({'error': 'Failed to process delegation data'}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)