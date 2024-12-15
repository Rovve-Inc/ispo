from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Delegation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    wallet_address = db.Column(db.String(64), nullable=False)
    amount = db.Column(db.Numeric(precision=18, scale=6), nullable=False)
    status = db.Column(db.String(20), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    rewards = db.relationship('Rewards', backref='delegation', lazy=True)

class Rewards(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    delegation_id = db.Column(db.Integer, db.ForeignKey('delegation.id'), nullable=False)
    wallet_address = db.Column(db.String(64), nullable=False)
    amount = db.Column(db.Numeric(precision=18, scale=6), nullable=False)
    reward_type = db.Column(db.String(20), nullable=False)  # 'RV' or 'bonus'
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class ValidatorStatus(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.String(20), nullable=False)
    total_delegated = db.Column(db.Numeric(precision=18, scale=6), default=0)
    uptime = db.Column(db.Float, default=100.0)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)

class TokenDistribution(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    wallet_address = db.Column(db.String(64), nullable=False)
    delegation_id = db.Column(db.Integer, db.ForeignKey('delegation.id'), nullable=False)
    rv_tokens = db.Column(db.Numeric(precision=18, scale=6), nullable=False)
    early_bonus = db.Column(db.Numeric(precision=5, scale=2), default=0)  # Percentage bonus
    distribution_date = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='pending')  # pending, distributed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    delegation = db.relationship('Delegation', backref='token_distributions')
