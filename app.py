import os
from flask import Flask, render_template, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Initialize SQLAlchemy with a custom base class
class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

# Create the app
app = Flask(__name__)

# Configure database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

# Initialize the app with the extension
db.init_app(app)

from models import Delegation, ValidatorStatus

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/delegate')
def delegate():
    return render_template('delegate.html')

@app.route('/about')
def about():
    return render_template('about.html')

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
        # Get delegations for the wallet
        delegations = Delegation.query.filter_by(
            wallet_address=wallet_address
        ).order_by(Delegation.timestamp.desc()).all()
        
        # Calculate total delegated
        total_delegated = sum(float(d.amount) for d in delegations)
        
        # Format delegation history
        delegation_history = []
        for delegation in delegations:
            delegation_history.append({
                'timestamp': delegation.timestamp.isoformat(),
                'amount': float(delegation.amount),
                'tx_hash': delegation.tx_hash,
                'status': delegation.status
            })
        
        return jsonify({
            'totalDelegated': total_delegated,
            'delegationHistory': delegation_history
        })
        
    except Exception as e:
        logging.error(f"Error fetching delegations for {wallet_address}: {str(e)}")
        return jsonify({'error': 'Failed to fetch delegation data'}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)