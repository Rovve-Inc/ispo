import os
import requests
from flask import Flask, render_template, jsonify
import logging
from datetime import datetime

from db import db
from models import Delegation, ValidatorStatus
import provenance

# Set up detailed logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

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
        validator_address = app.config['VALIDATOR_ADDRESS']
        validator_info = provenance.get_validator_info(validator_address)
        
        # Calculate days until end
        end_date = datetime.strptime('2025-09-15', '%Y-%m-%d')
        days_remaining = (end_date - datetime.utcnow()).days
        
        # Get total participants from validator info
        total_participants = db.session.query(Delegation.wallet_address.distinct()).count() or 4  # Default to 4 if no data
        
        return jsonify({
            'total_delegated': validator_info['tokens'],  # This is already in HASH
            'total_participants': total_participants,
            'days_remaining': max(0, days_remaining),
            'validator_status': 'active'
        })
    except Exception as e:
        logging.error(f"Error fetching validator stats: {str(e)}")
        return jsonify({'error': 'Failed to fetch validator statistics'}), 500

@app.route('/api/delegations/<wallet_address>')
def get_delegations(wallet_address):
    try:
        validator_address = app.config['VALIDATOR_ADDRESS']
        delegation_info = provenance.get_delegator_info(validator_address, wallet_address)
        
        # Process delegations using the proper format from provenance.py
        delegations = []
        for delegation in delegation_info['delegations']:
            if delegation['validator'] == validator_address:
                delegations.append({
                    'timestamp': datetime.utcnow().isoformat(),
                    'amount': delegation['amount'],  # Already in HASH from provenance.py
                    'tx_hash': delegation.get('tx_hash', 'txhash_placeholder'),
                    'status': 'active'
                })
        
        return jsonify({
            'totalDelegated': delegation_info['amount'],  # Already in HASH
            'delegationHistory': delegations
        })
        
    except Exception as e:
        logger.error(f"Error processing delegations for {wallet_address}: {str(e)}")
        return jsonify({'error': 'Failed to process delegation data'}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)