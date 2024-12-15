import os
from flask import Flask, render_template, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
import logging
from datetime import datetime

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

# Models
class Delegation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    wallet_address = db.Column(db.String(44), nullable=False)
    amount = db.Column(db.Numeric(precision=20, scale=6), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='active')
    distributions = db.relationship('TokenDistribution', backref='delegation', lazy=True)

class TokenDistribution(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    wallet_address = db.Column(db.String(44), nullable=False)
    delegation_id = db.Column(db.Integer, db.ForeignKey('delegation.id'), nullable=False)
    rv_tokens = db.Column(db.Numeric(precision=20, scale=6), nullable=False)
    early_bonus = db.Column(db.Numeric(precision=5, scale=2), default=0)
    status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    distribution_date = db.Column(db.DateTime)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/delegate')
def delegate():
    return render_template('delegate.html')

@app.route('/rewards')
def rewards():
    return render_template('rewards.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/api/rewards/<wallet_address>')
def get_rewards(wallet_address):
    try:
        # Get delegations and calculated RV token rewards
        delegations = Delegation.query.filter_by(wallet_address=wallet_address).all()
        distributions = TokenDistribution.query.filter_by(wallet_address=wallet_address).all()
        
        # Calculate totals
        total_delegated = sum(float(d.amount) for d in delegations)
        total_rewards = sum(float(d.rv_tokens) for d in distributions)
        
        # Format reward history
        reward_history = []
        for dist in distributions:
            reward_history.append({
                'timestamp': dist.created_at.isoformat(),
                'type': 'Delegation Reward',
                'amount': float(dist.rv_tokens),
                'early_bonus': float(dist.early_bonus)
            })
        
        return jsonify({
            'totalDelegated': total_delegated,
            'totalRewards': total_rewards,
            'rewardHistory': reward_history,
            'distributionDate': '2025-09-15',  # ISPO end date
            'earlyBonus': max((float(d.early_bonus) for d in distributions), default=0)
        })
        
    except Exception as e:
        logging.error(f"Error fetching rewards for {wallet_address}: {str(e)}")
        return jsonify({'error': 'Failed to fetch rewards data'}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)