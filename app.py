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

# Ensure database and tables are created
with app.app_context():
    try:
        db.create_all()
        logger.info("Database tables created successfully")
        
        # Check if we need to add test delegation
        from models import Delegation
        test_wallet = "pb1ydvlhwryqxf7ufzpxsu7lmvuut9y8sw2pwd0q4"
        existing_delegation = Delegation.query.filter_by(wallet_address=test_wallet).first()
        
        if not existing_delegation:
            test_delegation = Delegation(
                wallet_address=test_wallet,
                amount=500,  # 500 HASH
                timestamp=datetime(2024, 12, 14),  # December 14, 2024
                status='active'
            )
            db.session.add(test_delegation)
            db.session.commit()
            logger.info(f"Added test delegation for wallet {test_wallet}")
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")

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

@app.route('/analytics')
def analytics():
    return render_template('analytics.html')

@app.route('/api/analytics')
def get_analytics():
    try:
        # Get latest validator status
        status = ValidatorStatus.query.order_by(ValidatorStatus.id.desc()).first()
        
        # Get delegation distribution
        distribution_query = db.session.query(
            db.func.sum(db.case(
                (Delegation.amount < 1000, 1),
                else_=0
            )),
            db.func.sum(db.case(
                (Delegation.amount.between(1000, 10000), 1),
                else_=0
            )),
            db.func.sum(db.case(
                (Delegation.amount.between(10000, 100000), 1),
                else_=0
            )),
            db.func.sum(db.case(
                (Delegation.amount > 100000, 1),
                else_=0
            ))
        ).filter_by(status='active').first()
        
        if status:
            return jsonify({
                'rank': status.rank,
                'active_delegators': status.active_delegators,
                'uptime': float(status.uptime),
                'commission_rate': float(status.commission_rate),
                'blocks_signed': status.blocks_signed,
                'total_delegated': float(status.total_delegated),
                'status': status.status,
                'distribution_data': {
                    'small': distribution_query[0] or 0,
                    'medium': distribution_query[1] or 0,
                    'large': distribution_query[2] or 0,
                    'xlarge': distribution_query[3] or 0
                }
            })
        
        return jsonify({
            'error': 'No validator status available'
        }), 404
        
    except Exception as e:
        logger.error(f"Error getting analytics data: {str(e)}")
        return jsonify({'error': 'Failed to get analytics data'}), 500

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
        logger.info(f"Fetching delegations for wallet: {wallet_address}")
        
        # Query delegations from database
        # Clear query to ensure fresh data
        db.session.remove()
        
        # Query with explicit columns
        delegations = db.session.query(
            Delegation
        ).filter_by(
            wallet_address=wallet_address,
            status='active'
        ).order_by(Delegation.timestamp.desc()).all()
        
        logger.info(f"Raw delegation data: {[(d.amount, d.timestamp) for d in delegations]}")
        
        logger.info(f"Found {len(delegations)} delegations")
        
        # Convert to JSON response
        delegation_history = []
        for d in delegations:
            delegation_data = {
                'amount': float(d.amount),
                'timestamp': d.timestamp.isoformat(),
                'tx_hash': d.tx_hash,
                'status': d.status
            }
            logger.debug(f"Delegation data: {delegation_data}")
            delegation_history.append(delegation_data)
        
        # Just return empty history if no delegations found
        if not delegation_history:
            logger.info(f"No delegations found for wallet {wallet_address}")
        
        return jsonify({
            'delegationHistory': delegation_history
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
