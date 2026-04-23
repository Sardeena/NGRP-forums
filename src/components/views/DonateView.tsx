import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Shield, Zap, Check, CreditCard, Gift, Crown, Info, AlertCircle, Coins, Wallet } from 'lucide-react';

type Tier = 'silver' | 'gold' | 'platinum';
type PaymentMethodType = 'paypal' | 'crypto' | 'wallet';

export const DonateView: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState<Tier>('gold');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('paypal');

  const tiers = [
    {
      id: 'silver' as Tier,
      name: 'Silver Donor',
      price: '$10.00',
      color: 'text-gray-400',
      bgColor: 'bg-gray-400/10',
      borderColor: 'border-gray-400/20',
      icon: <Star className="w-8 h-8" />,
      benefits: ['Custom Forum Title', 'Silver Donor Badge', '1x Vehicle Slot', 'Priority Support']
    },
    {
      id: 'gold' as Tier,
      name: 'Gold Donor',
      price: '$25.00',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      icon: <Crown className="w-8 h-8" />,
      benefits: ['All Silver Benefits', 'Gold Donor Badge', '3x Vehicle Slots', 'Custom Discord Role', 'Instant $50,000 In-Game']
    },
    {
      id: 'platinum' as Tier,
      name: 'Platinum Donor',
      price: '$50.00',
      color: 'text-ng-blue',
      bgColor: 'bg-ng-blue/10',
      borderColor: 'border-ng-blue/20',
      icon: <Zap className="w-8 h-8" />,
      benefits: ['All Gold Benefits', 'Platinum Donor Badge', 'Unlimited Vehicle Slots', 'Private Support Channel', 'Instant $250,000 In-Game', 'Unique Vehicle Skin']
    }
  ];

  const renderPayment = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="forum-container rounded-lg p-8 bg-ng-dark/95 flex flex-col gap-6"
    >
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">Checkout</h3>
        <button onClick={() => setShowPayment(false)} className="text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest">Cancel</button>
      </div>
      
      <div className="flex items-center justify-between p-4 bg-black/40 rounded border border-white/5">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${tiers.find(t => t.id === selectedTier)?.bgColor} ${tiers.find(t => t.id === selectedTier)?.color}`}>
            {tiers.find(t => t.id === selectedTier)?.icon}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white uppercase tracking-widest">{tiers.find(t => t.id === selectedTier)?.name}</span>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest">1 Month Subscription</span>
          </div>
        </div>
        <span className="text-xl font-black italic text-ng-blue">{tiers.find(t => t.id === selectedTier)?.price}</span>
      </div>

      <div className="flex flex-col gap-4">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Payment Method</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PaymentMethod 
            icon={<CreditCard className="w-5 h-5" />} 
            label="PayPal" 
            active={paymentMethod === 'paypal'} 
            onClick={() => setPaymentMethod('paypal')}
          />
          <PaymentMethod 
            icon={<Coins className="w-5 h-5" />} 
            label="Crypto" 
            active={paymentMethod === 'crypto'} 
            onClick={() => setPaymentMethod('crypto')}
          />
          <PaymentMethod 
            icon={<Wallet className="w-5 h-5" />} 
            label="E-Wallet" 
            active={paymentMethod === 'wallet'} 
            onClick={() => setPaymentMethod('wallet')}
          />
        </div>
      </div>

      <div className="p-4 bg-ng-blue/10 border border-ng-blue/20 rounded flex gap-4 items-start">
        <Info className="w-5 h-5 text-ng-blue flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-ng-blue/80 leading-relaxed uppercase font-bold tracking-tight">
          Donations are non-refundable. By proceeding, you agree to our Terms of Service. 
          Rewards are usually delivered instantly but may take up to 24 hours.
        </p>
      </div>

      <button className="w-full py-4 glossy-blue text-white font-bold uppercase tracking-widest rounded shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2">
        {paymentMethod === 'paypal' && <CreditCard className="w-4 h-4" />}
        {paymentMethod === 'crypto' && <Coins className="w-4 h-4" />}
        {paymentMethod === 'wallet' && <Wallet className="w-4 h-4" />}
        Proceed with {paymentMethod === 'paypal' ? 'PayPal' : paymentMethod === 'crypto' ? 'Crypto' : 'E-Wallet'}
      </button>
    </motion.div>
  );

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="glossy-blue p-4 rounded shadow-lg flex justify-between items-center">
        <h2 className="text-white font-bold uppercase tracking-widest flex items-center gap-2">
          <Gift className="w-5 h-5" />
          Server Donations
        </h2>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-green-500" />
          <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Secure Checkout</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showPayment ? renderPayment() : (
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {tiers.map((tier) => (
                <div 
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id)}
                  className={`forum-container rounded-lg overflow-hidden flex flex-col cursor-pointer transition-all hover:scale-[1.02] ${selectedTier === tier.id ? 'border-ng-blue/50 ring-2 ring-ng-blue/20' : 'border-transparent opacity-80 hover:opacity-100'}`}
                >
                  <div className={`p-8 flex flex-col items-center text-center gap-4 ${tier.bgColor}`}>
                    <div className={tier.color}>{tier.icon}</div>
                    <div className="flex flex-col">
                      <h3 className={`text-xl font-black italic uppercase tracking-tighter ${tier.color}`}>{tier.name}</h3>
                      <span className="text-2xl font-black italic text-white mt-2">{tier.price} <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">/mo</span></span>
                    </div>
                  </div>
                  <div className="p-6 bg-ng-dark/95 flex flex-col gap-4 flex-grow">
                    <div className="flex flex-col gap-3">
                      {tier.benefits.map((benefit, i) => (
                        <div key={i} className="flex items-center gap-3 text-xs text-gray-400">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="font-bold uppercase tracking-widest text-[10px]">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="forum-container rounded-lg p-8 bg-ng-dark/95 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col gap-2 max-w-xl">
                <h3 className="text-lg font-black italic text-white uppercase tracking-tighter flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Support the Community
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed uppercase font-bold tracking-widest">
                  Your donations help us keep the servers running, pay for high-performance hosting, 
                  and fund future development. 100% of proceeds go back into the community.
                </p>
              </div>
              <button 
                onClick={() => setShowPayment(true)}
                className="px-12 py-4 glossy-blue text-white font-bold uppercase tracking-widest rounded shadow-2xl hover:brightness-110 transition-all flex items-center gap-3"
              >
                Proceed to Checkout
                <Check className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PaymentMethod: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <div 
    onClick={onClick}
    className={`p-4 rounded border flex items-center justify-center gap-3 cursor-pointer transition-all ${active ? 'border-ng-blue bg-ng-blue/10 text-white' : 'border-white/10 bg-black/40 text-gray-500 hover:border-white/20'}`}
  >
    {icon}
    <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
  </div>
);
