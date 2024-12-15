import logging
from datetime import datetime, timedelta
from decimal import Decimal
from models import db, Delegation, TokenDistribution
from config import Config

class TokenDistributionManager:
    def __init__(self):
        self.logger = logging.getLogger('token_distribution')
        self.ispo_start = Config.ISPO_START_DATE
        self.ispo_end = Config.ISPO_END_DATE
        self.early_period_end = Config.ISPO_EARLY_BONUS_END_DATE
        
    def calculate_rewards(self, delegation):
        """Calculate RV token rewards for a delegation"""
        try:
            # Base calculation factors
            amount = Decimal(str(delegation.amount))
            duration = (min(datetime.utcnow(), self.ispo_end) - delegation.timestamp).days
            
            # Early participation bonus (60% allocation for first 3 months)
            if delegation.timestamp <= self.early_period_end:
                base_multiplier = Decimal('1.6')  # 60% more rewards
                early_bonus = Decimal('20.0')  # 20% bonus
            else:
                base_multiplier = Decimal('1.0')
                early_bonus = Decimal('0.0')
            
            # Calculate base rewards
            # Formula: amount * (duration/total_duration) * base_rate * multiplier
            total_duration = (self.ispo_end - self.ispo_start).days
            base_rate = Decimal('0.05')  # 5% total allocation
            
            rv_tokens = (amount * 
                        (Decimal(str(duration)) / Decimal(str(total_duration))) * 
                        base_rate * 
                        base_multiplier)
            
            return rv_tokens, early_bonus
            
        except Exception as e:
            self.logger.error(f"Error calculating rewards: {str(e)}")
            return Decimal('0'), Decimal('0')
    
    def process_pending_distributions(self):
        """Process all pending token distributions"""
        try:
            # Get all active delegations
            delegations = Delegation.query.filter_by(status='active').all()
            
            for delegation in delegations:
                # Check if distribution already exists
                existing = TokenDistribution.query.filter_by(
                    delegation_id=delegation.id,
                    status='pending'
                ).first()
                
                if not existing:
                    rv_tokens, early_bonus = self.calculate_rewards(delegation)
                    
                    distribution = TokenDistribution(
                        wallet_address=delegation.wallet_address,
                        delegation_id=delegation.id,
                        rv_tokens=rv_tokens,
                        early_bonus=early_bonus,
                        distribution_date=self.ispo_end
                    )
                    
                    db.session.add(distribution)
            
            db.session.commit()
            return True
            
        except Exception as e:
            self.logger.error(f"Error processing distributions: {str(e)}")
            db.session.rollback()
            return False
