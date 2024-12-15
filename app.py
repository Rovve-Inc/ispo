import os
import logging
from datetime import datetime
from flask import Flask, jsonify, render_template
from db import db
from models import Delegation, ValidatorStatus, TokenDistribution
import provenance
from token_distribution import TokenDistributionManager

# Set up detailed logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize token distribution manager
token_manager = TokenDistributionManager()

# Create the app
app = Flask(__name__)

# Configure database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

# Initialize the database
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
        # Get latest validator status
        status = ValidatorStatus.query.order_by(ValidatorStatus.id.desc()).first()
        
        if status:
            # Calculate days remaining until Sep 15, 2025
            end_date = datetime(2025, 9, 15)
            days_remaining = (end_date - datetime.utcnow()).days
            
            return jsonify({
                'total_delegated': float(status.total_delegated),
                'total_participants': Delegation.query.distinct(Delegation.wallet_address).count(),
                'days_remaining': max(0, days_remaining),
                'uptime': float(status.uptime)
            })
        
        return jsonify({
            'total_delegated': 0,
            'total_participants': 0,
            'days_remaining': 0,
            'uptime': 100.0
        })
        
    except Exception as e:
        logger.error(f"Error getting validator stats: {str(e)}")
        return jsonify({'error': 'Failed to get validator statistics'}), 500

@app.route('/api/delegations/<wallet_address>')
def get_delegations(wallet_address):
    try:
        delegations = [{
            'amount': float(d.amount),
            'timestamp': d.timestamp.isoformat(),
            'tx_hash': d.tx_hash,
            'status': d.status
        } for d in Delegation.query.filter_by(
            wallet_address=wallet_address
        ).order_by(Delegation.timestamp.desc()).all()]
        
        return jsonify({
            'delegationHistory': delegations
        })
        
    except Exception as e:
        logger.error(f"Error processing delegations for {wallet_address}: {str(e)}")
        return jsonify({'error': 'Failed to process delegation data'}), 500

@app.route('/api/rewards/<wallet_address>')
def get_rewards(wallet_address):
    try:
        # Get all active delegations for the wallet
        delegations = Delegation.query.filter_by(
            wallet_address=wallet_address,
            status='active'
        ).all()
        
        total_rv_tokens = 0
        early_bonus = 0
        rewards_data = []
        
        for delegation in delegations:
            rv_tokens, bonus = token_manager.calculate_rewards(delegation)
            total_rv_tokens += rv_tokens
            early_bonus += bonus
            
            rewards_data.append({
                'delegation_amount': float(delegation.amount),
                'rv_tokens': float(rv_tokens),
                'early_bonus': float(bonus),
                'delegation_date': delegation.timestamp.isoformat()
            })
        
        return jsonify({
            'total_rv_tokens': float(total_rv_tokens),
            'total_early_bonus': float(early_bonus),
            'rewards_breakdown': rewards_data
        })
        
    except Exception as e:
        logger.error(f"Error calculating rewards for {wallet_address}: {str(e)}")
        return jsonify({'error': 'Failed to calculate rewards'}), 500

@app.route('/api/distribution/status/<wallet_address>')
def get_distribution_status(wallet_address):
    try:
        distributions = TokenDistribution.query.filter_by(
            wallet_address=wallet_address
        ).all()
        
        return jsonify({
            'distributions': [{
                'amount': float(dist.rv_tokens),
                'early_bonus': float(dist.early_bonus),
                'status': dist.status,
                'distribution_date': dist.distribution_date.isoformat()
            } for dist in distributions]
        })
        
    except Exception as e:
        logger.error(f"Error getting distribution status for {wallet_address}: {str(e)}")
        return jsonify({'error': 'Failed to get distribution status'}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)
