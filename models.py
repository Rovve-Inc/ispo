from datetime import datetime
from db import db
from decimal import Decimal

class Delegation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    wallet_address = db.Column(db.String(44), nullable=False)
    amount = db.Column(db.Numeric(precision=20, scale=6), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    tx_hash = db.Column(db.String(64))
    status = db.Column(db.String(20), default='active')
    distributions = db.relationship('TokenDistribution', backref='delegation', lazy=True)

class TokenDistribution(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    wallet_address = db.Column(db.String(44), nullable=False)
    delegation_id = db.Column(db.Integer, db.ForeignKey('delegation.id'), nullable=False)
    rv_tokens = db.Column(db.Numeric(precision=20, scale=6), nullable=False)
    early_bonus = db.Column(db.Numeric(precision=5, scale=2), default=Decimal('0.00'))
    distribution_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ValidatorStatus(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.String(20), nullable=False)
    total_delegated = db.Column(db.Numeric(precision=20, scale=6), default=0)
    uptime = db.Column(db.Float, default=100.0)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    active_delegators = db.Column(db.Integer, default=0)
    blocks_signed = db.Column(db.Integer, default=0)
    commission_rate = db.Column(db.Float, default=5.0)  # 5% default commission
    rank = db.Column(db.Integer)  # Validator rank by total stake