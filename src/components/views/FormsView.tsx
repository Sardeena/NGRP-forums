import React, { useState, useEffect } from 'react';
import { FileText, Send, AlertCircle, CheckCircle, ChevronRight, Users, ShieldAlert, Car, ChevronDown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile } from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';

type FormType = 'lspd' | 'gang' | 'ban-appeal' | 'refund';

interface FormsViewProps {
  selectedFormType?: FormType | null;
  user: UserProfile | null;
}

export const FormsView: React.FC<FormsViewProps> = ({ selectedFormType, user }) => {
  const [selectedForm, setSelectedForm] = useState<FormType | null>(selectedFormType || null);
  const [submitted, setSubmitted] = useState(false);
  const [isFormsOpen, setIsFormsOpen] = useState(!!selectedFormType);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  // Update selectedForm if prop changes
  useEffect(() => {
    if (selectedFormType) {
      setSelectedForm(selectedFormType);
      setIsFormsOpen(true);
    }
  }, [selectedFormType]);

  const handleFormSubmit = async () => {
    if (!user || !selectedForm) return;

    setSubmitting(true);
    try {
      const formTitles: Record<FormType, string> = {
        lspd: "LSPD Recruitment Form",
        gang: "Gang Registration Form",
        'ban-appeal': "Ban Appeal Form",
        refund: "Asset Refund Request"
      };

      const message = Object.entries(formData)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');

      await addDoc(collection(db, 'support_tickets'), {
        uid: user.uid,
        subject: `[FORM] ${formTitles[selectedForm]}`,
        category: selectedForm === 'ban-appeal' ? 'Ban Appeal' : 'General Support',
        message: message,
        status: 'Pending',
        timestamp: Date.now()
      });

      setSubmitted(true);
      setFormData({});
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'support_tickets');
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderFormList = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <FormCard 
        icon={<Users className="w-6 h-6" />} 
        title="LSPD Application" 
        description="Apply to join the Los Santos Police Department." 
        onClick={() => setSelectedForm('lspd')}
      />
      <FormCard 
        icon={<ShieldAlert className="w-6 h-6" />} 
        title="Ban Appeal" 
        description="Appeal a server or forum ban." 
        onClick={() => setSelectedForm('ban-appeal')}
      />
      <FormCard 
        icon={<Car className="w-6 h-6" />} 
        title="Refund Request" 
        description="Request a refund for lost assets due to bugs." 
        onClick={() => setSelectedForm('refund')}
      />
      <FormCard 
        icon={<Users className="w-6 h-6" />} 
        title="Gang Registration" 
        description="Register your unofficial gang group." 
        onClick={() => setSelectedForm('gang')}
      />
    </div>
  );

  const renderFormFields = () => {
    switch(selectedForm) {
      case 'lspd':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput label="Age" placeholder="21" value={formData['Age'] || ''} onChange={(v) => updateField('Age', v)} />
              <FormInput label="Previous Experience" placeholder="Security, Army, etc." value={formData['Previous Experience'] || ''} onChange={(v) => updateField('Previous Experience', v)} />
            </div>
            <FormInput label="Why do you want to join?" placeholder="Detailed explanation..." value={formData['Reason'] || ''} onChange={(v) => updateField('Reason', v)} />
          </>
        );
      case 'gang':
        return (
          <>
            <FormInput label="Gang Name" placeholder="The Grove Street Families" value={formData['Gang Name'] || ''} onChange={(v) => updateField('Gang Name', v)} />
            <FormInput label="Base Location" placeholder="Ganton" value={formData['Base Location'] || ''} onChange={(v) => updateField('Base Location', v)} />
            <FormInput label="Member Count" placeholder="15" value={formData['Member Count'] || ''} onChange={(v) => updateField('Member Count', v)} />
          </>
        );
      case 'ban-appeal':
        return (
          <>
            <FormInput label="Ban Reason" placeholder="Metagaming" value={formData['Ban Reason'] || ''} onChange={(v) => updateField('Ban Reason', v)} />
            <FormInput label="Banning Admin" placeholder="AdminName" value={formData['Banning Admin'] || ''} onChange={(v) => updateField('Banning Admin', v)} />
            <FormInput label="Why should we unban you?" placeholder="Detailed explanation..." value={formData['Explanation'] || ''} onChange={(v) => updateField('Explanation', v)} />
          </>
        );
      case 'refund':
        return (
          <>
            <FormInput label="Lost Item" placeholder="Infernus, $500,000, etc." value={formData['Lost Item'] || ''} onChange={(v) => updateField('Lost Item', v)} />
            <FormInput label="Evidence Link" placeholder="Imgur/YouTube link" value={formData['Evidence Link'] || ''} onChange={(v) => updateField('Evidence Link', v)} />
          </>
        );
      default:
        return null;
    }
  };

  const renderForm = () => {
    const formTitles: Record<FormType, string> = {
      lspd: "LSPD Recruitment Form",
      gang: "Gang Registration Form",
      'ban-appeal': "Ban Appeal Form",
      refund: "Asset Refund Request"
    };

    if (submitted) {
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="forum-container rounded-lg p-12 flex flex-col items-center text-center gap-4 bg-ng-dark/95"
        >
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 mb-4">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black italic text-white uppercase italic tracking-tighter">Application Submitted!</h2>
          <p className="text-gray-400 text-sm max-w-md">
            Your application has been successfully sent to the administration team. 
            Please allow up to 48 hours for a response in your support tickets.
          </p>
          <button 
            onClick={() => { setSelectedForm(null); setSubmitted(false); }}
            className="mt-6 px-8 py-3 glossy-blue text-white font-bold uppercase tracking-widest rounded shadow-lg hover:brightness-110 transition-all"
          >
            Back to Forms
          </button>
        </motion.div>
      );
    }

    if (!user) {
      return (
        <div className="forum-container rounded-lg p-12 flex flex-col items-center text-center gap-4 bg-ng-dark/95">
          <ShieldAlert className="w-16 h-16 text-gray-700" />
          <h2 className="text-xl font-black italic text-white uppercase tracking-tighter">Authentication Required</h2>
          <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Please log in to submit application forms.</p>
          <button 
            onClick={() => setSelectedForm(null)}
            className="mt-6 px-8 py-3 glossy-blue text-white font-bold uppercase tracking-widest rounded shadow-lg hover:brightness-110 transition-all"
          >
            Back to Forms
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6">
        <div className="glossy-blue p-4 rounded shadow-lg flex justify-between items-center">
          <h2 className="text-white font-bold uppercase tracking-widest flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {formTitles[selectedForm!]}
          </h2>
          <button 
            onClick={() => setSelectedForm(null)}
            className="text-[10px] font-bold text-white/50 hover:text-white uppercase tracking-widest"
          >
            Cancel
          </button>
        </div>

        <div className="forum-container rounded overflow-hidden">
          <div className="p-8 bg-ng-dark/95 flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput label="In-Game Name" placeholder="Firstname_Lastname" value={formData['In-Game Name'] || ''} onChange={(v) => updateField('In-Game Name', v)} />
              <FormInput label="Account ID" placeholder="12345" value={formData['Account ID'] || ''} onChange={(v) => updateField('Account ID', v)} />
            </div>
            <FormInput label="Discord ID" placeholder="username#0000" value={formData['Discord ID'] || ''} onChange={(v) => updateField('Discord ID', v)} />
            
            {renderFormFields()}

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Additional Comments</label>
              <textarea 
                value={formData['Comments'] || ''}
                onChange={(e) => updateField('Comments', e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded p-4 text-sm text-white focus:outline-none focus:border-ng-blue/50 min-h-[100px]"
                placeholder="Anything else we should know?"
              />
            </div>
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded flex gap-4 items-start">
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-yellow-500/80 leading-relaxed uppercase font-bold tracking-tight">
                By submitting this form, you agree that all information provided is truthful. 
                Providing false information will result in an immediate denial and potential forum ban.
              </p>
            </div>
            <button 
              onClick={handleFormSubmit}
              disabled={submitting}
              className="w-full py-4 glossy-blue text-white font-bold uppercase tracking-widest rounded shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit Application
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {!selectedForm ? (
        <div className="flex flex-col gap-4">
          <div 
            onClick={() => setIsFormsOpen(!isFormsOpen)}
            className="glossy-blue p-4 rounded shadow-lg flex justify-between items-center cursor-pointer hover:brightness-110 transition-all"
          >
            <h2 className="text-white font-bold uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Application Forms
            </h2>
            <ChevronDown className={`w-5 h-5 text-white transition-transform duration-300 ${isFormsOpen ? 'rotate-180' : ''}`} />
          </div>
          
          <AnimatePresence>
            {isFormsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                {renderFormList()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderForm()}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

const FormCard: React.FC<{ icon: React.ReactNode; title: string; description: string; onClick: () => void }> = ({ icon, title, description, onClick }) => (
  <div 
    onClick={onClick}
    className="forum-container rounded overflow-hidden p-8 bg-ng-dark/95 flex flex-col items-center text-center gap-4 cursor-pointer hover:border-ng-blue/30 border border-transparent transition-all group"
  >
    <div className="p-4 bg-ng-blue/10 rounded-full text-ng-blue group-hover:bg-ng-blue group-hover:text-white transition-all">
      {icon}
    </div>
    <div className="flex flex-col">
      <h3 className="text-lg font-black italic text-white uppercase italic tracking-tighter">{title}</h3>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
    <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-ng-blue uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
      Open Form <ChevronRight className="w-3 h-3" />
    </div>
  </div>
);

const FormInput: React.FC<{ label: string; placeholder: string; value: string; onChange: (v: string) => void }> = ({ label, placeholder, value, onChange }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</label>
    <input 
      type="text" 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-black/40 border border-white/10 rounded px-4 py-2.5 text-sm text-white focus:outline-none focus:border-ng-blue/50"
      placeholder={placeholder}
    />
  </div>
);
