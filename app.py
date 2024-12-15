import os
from flask import Flask, render_template, jsonify, request
import logging

logging.basicConfig(level=logging.DEBUG)

def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')
    
    from models import db, Delegation, Rewards
    db.init_app(app)
    
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

    @app.route('/api/delegate', methods=['POST'])
    def handle_delegation():
        data = request.json
        wallet_address = data.get('wallet_address')
        amount = data.get('amount')
        
        # Create new delegation record
        delegation = Delegation(
            wallet_address=wallet_address,
            amount=amount,
            status='pending'
        )
        db.session.add(delegation)
        db.session.commit()
        
        return jsonify({'status': 'success', 'delegation_id': delegation.id})

    @app.route('/api/rewards/<wallet_address>')
    def get_rewards(wallet_address):
        rewards = Rewards.query.filter_by(wallet_address=wallet_address).all()
        return jsonify([{
            'amount': r.amount,
            'timestamp': r.timestamp,
            'type': r.reward_type
        } for r in rewards])

    return app

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        from models import db
        db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)
